import { NextResponse } from "next/server";
import { createConsultationConReserva, getAvailability, listConsultations, SlotOcupadoError } from "@/lib/store";
import { genId } from "@/lib/ids";
import { errorDeServidor } from "@/lib/apiErrors";
import { Consultation, Patient, TipoConsultaId } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";
import { fechaDesdeISO, getSlotsForDate, isAvailableNow, toISODate } from "@/lib/availability";

// Nunca cachear/pre-renderizar: cada request depende de datos en vivo de Supabase.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    let consultations = await listConsultations();
    if (estado) {
      consultations = consultations.filter((c) => c.estado === estado);
    }
    return NextResponse.json(consultations);
  } catch (error) {
    console.error("ERROR LISTANDO CONSULTAS:", error);
    return NextResponse.json(
      {
        error: "No se pudieron listar las consultas.",
        detalle: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

const MAX_FOTOS_CREDENCIAL = 2;
// ~5MB de imagen en base64 pesa ~6.7MB de texto (factor ~4/3) — margen
// generoso para no rechazar una foto válida por el redondeo del encoding.
const MAX_LARGO_DATA_URL = 7_500_000;

function credencialFotosValidas(valor: unknown): valor is string[] {
  if (!Array.isArray(valor)) return false;
  if (valor.length > MAX_FOTOS_CREDENCIAL) return false;
  return valor.every(
    (foto) => typeof foto === "string" && foto.startsWith("data:image/") && foto.length <= MAX_LARGO_DATA_URL
  );
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    paciente: Patient;
    fecha: string;
    hora: string;
    esAhora?: boolean;
    tipoConsulta?: TipoConsultaId;
    credencialFotos?: unknown;
  };

  if (!body.paciente?.nombre || !body.paciente?.dni || !body.paciente?.whatsapp || !body.paciente?.email) {
    return NextResponse.json({ error: "Faltan datos del paciente" }, { status: 400 });
  }

  if (!body.fecha || !body.hora) {
    return NextResponse.json({ error: "Faltan fecha u hora" }, { status: 400 });
  }

  // El precio nunca viene del cliente — se busca del lado del servidor a
  // partir del tipo elegido, igual que ya se validaba fecha/hora contra la
  // disponibilidad real en vez de confiar en lo que mande el front.
  const tipo = doctorProfile.consultaOnline.tipos.find((t) => t.id === body.tipoConsulta);
  if (!tipo) {
    return NextResponse.json({ error: "Elegí un tipo de consulta válido." }, { status: 400 });
  }

  const credencialFotos = body.credencialFotos ?? [];
  if (!credencialFotosValidas(credencialFotos)) {
    return NextResponse.json(
      { error: "Alguna de las fotos de la credencial no es válida (formato o tamaño)." },
      { status: 400 }
    );
  }

  // El cliente arma la lista de horarios a partir de esta misma
  // configuración, pero nada impide que llegue acá una fecha/hora
  // fabricada a mano (o un cliente desactualizado con datos viejos) — el
  // horario que termina reservándose tiene que ser siempre uno que el
  // backend reconozca como real, no lo que el cliente diga que eligió.
  //
  // "Consultar ahora" es un caso aparte: no corresponde a un turno de la
  // grilla de 30 minutos, sino a que el médico esté disponible en este
  // preciso momento — se valida contra isAvailableNow(), no contra la
  // lista de slots.
  const config = await getAvailability();
  const now = new Date();

  if (body.esAhora) {
    if (body.fecha !== toISODate(now) || !isAvailableNow(config, now).disponible) {
      return NextResponse.json(
        { error: "La atención inmediata ya no está disponible. Elegí un horario." },
        { status: 400 }
      );
    }
  } else {
    const slotsDelDia = getSlotsForDate(config, fechaDesdeISO(body.fecha), 30, now);
    if (!slotsDelDia.includes(body.hora)) {
      return NextResponse.json(
        { error: "Ese horario ya no está disponible. Elegí otro." },
        { status: 400 }
      );
    }
  }

  const consultation: Consultation = {
    id: genId("cons"),
    doctorId: doctorProfile.id,
    paciente: body.paciente,
    fecha: body.fecha,
    hora: body.hora,
    esAhora: Boolean(body.esAhora),
    recordatorioEnviadoAt: null,
    documentacionEnviadaAt: null,
    recetaExternaUrl: null,
    tipoConsulta: tipo.id,
    credencialFotos,
    precio: tipo.precio,
    duracionMinutos: doctorProfile.consultaOnline.duracionMinutos,
    estado: "pendiente_pago",
    pago: { estado: "pendiente", metodo: "mock" },
    creadaEn: new Date().toISOString(),
    documentos: [],
    notificaciones: [],
    mensajes: [],
    avisoMensajeEnviadoAt: null,
  };

  try {
    // createConsultationConReserva intenta reservar (doctor, fecha, hora)
    // de forma atómica antes de crear la consulta. Si ya está tomado,
    // tira SlotOcupadoError — lo capturamos abajo como 409.
    const creada = await createConsultationConReserva(consultation);
    return NextResponse.json(creada, { status: 201 });
  } catch (error) {
    if (error instanceof SlotOcupadoError) {
      return NextResponse.json({ error: "slot_ocupado", mensaje: error.message }, { status: 409 });
    }
    return errorDeServidor(error, "No se pudo crear la consulta.");
  }
}