import { NextResponse } from "next/server";
import { createConsultation, genId, genToken, listConsultations } from "@/lib/store";
import { Consultation, Patient } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado");
  let consultations = listConsultations();
  if (estado) {
    consultations = consultations.filter((c) => c.estado === estado);
  }
  return NextResponse.json(consultations);
}

export async function POST(req: Request) {
  const body = (await req.json()) as { paciente: Patient; fecha: string; hora: string };

  if (!body.paciente?.nombre || !body.paciente?.dni || !body.paciente?.whatsapp || !body.paciente?.email) {
    return NextResponse.json({ error: "Faltan datos del paciente" }, { status: 400 });
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
    salaVideoId: genToken(),
    pago: { estado: "pendiente", metodo: "mock" },
    creadaEn: new Date().toISOString(),
    documentos: [],
    notificaciones: [],
  };

  createConsultation(consultation);
  return NextResponse.json(consultation, { status: 201 });
}
