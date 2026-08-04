import { NextResponse } from "next/server";
import { getConsultation, updateConsultation } from "@/lib/store";
import { ConsultationStatus } from "@/types";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const consultation = getConsultation(params.id);
  if (!consultation) {
    return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
  }
  return NextResponse.json(consultation);
}

const VALID_TRANSITIONS: Record<ConsultationStatus, ConsultationStatus[]> = {
  pendiente_pago: ["esperando", "rechazada"],
  esperando: ["lista"],
  lista: ["en_consulta"],
  en_consulta: ["finalizada"],
  finalizada: [],
  rechazada: [],
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as { estado?: ConsultationStatus };
  const consultation = getConsultation(params.id);
  if (!consultation) {
    return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
  }

  if (body.estado) {
    const permitido = VALID_TRANSITIONS[consultation.estado]?.includes(body.estado);
    if (!permitido) {
      return NextResponse.json(
        { error: `No se puede pasar de "${consultation.estado}" a "${body.estado}"` },
        { status: 400 }
      );
    }
  }

  const updated = updateConsultation(params.id, body);
  return NextResponse.json(updated);
}
