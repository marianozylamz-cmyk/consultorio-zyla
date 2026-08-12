import { NextResponse } from "next/server";
import { createConsultationConReserva, listConsultations, SlotOcupadoError } from "@/lib/store";
import { genId } from "@/lib/ids";
import { errorDeServidor } from "@/lib/apiErrors";
import { Consultation, Patient } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";

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
  const body = (await req.json()) as { paciente: Patient; fecha: string; hora: string };

  if (!body.paciente?.nombre || !body.paciente?.dni || !body.paciente?.whatsapp || !body.paciente?.email) {
    return NextResponse.json({ error: "Faltan datos del paciente" }, { status: 400 });
  }

  if (!body.fecha || !body.hora) {
    return NextResponse.json({ error: "Faltan fecha u hora" }, { status: 400 });
  }

  const consultation: Consultation = {
    id: genId("cons"),
    doctorId: doctorProfile.id,
    paciente: body.paciente,
    fecha: body.fecha,
    hora: body.hora,
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