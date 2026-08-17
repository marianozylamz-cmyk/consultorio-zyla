import { NextResponse } from "next/server";
import { createConsultationConReserva, getAvailability, listConsultations, SlotOcupadoError } from "@/lib/store";
import { genId } from "@/lib/ids";
import { errorDeServidor } from "@/lib/apiErrors";
import { Consultation, Patient } from "@/types";
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

export async function POST(req: Request) {
  const body = (await req.json()) as { paciente: Patient; fecha: string; hora: string; esAhora?: boolean };

  if (!body.paciente?.nombre || !body.paciente?.dni || !body.paciente?.whatsapp || !body.paciente?.email) {
    return NextResponse.json({ error: "Faltan datos del paciente" }, { status: 400 });
  }

  if (!body.fecha || !body.hora) {
    return NextResponse.json({ error: "Faltan fecha u hora" }, { status: 400 });
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
    precio: doctorProfile.consultaOnline.precio,
    duracionMinutos: doctorProfile.consultaOnline.duracionMinutos,
    estado: "pendiente_pago",
    pago: { estado: "pendiente", metodo: "mock" },
    creadaEn: new Date().toISOString(),
    documentos: [],
    notificaciones: [],
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