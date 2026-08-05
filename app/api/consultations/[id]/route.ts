import { NextResponse } from "next/server";
import { getConsultation, updateConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { ConsultationStatus } from "@/types";

// Nunca cachear/pre-renderizar: cada request depende de datos en vivo de Supabase.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }
    return NextResponse.json(consultation);
  } catch (error) {
    return errorDeServidor(error, "No se pudo cargar la consulta.");
  }
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

  try {
    const consultation = await getConsultation(params.id);
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

    const updated = await updateConsultation(params.id, body);
    return NextResponse.json(updated);
  } catch (error) {
    return errorDeServidor(error, "No se pudo actualizar la consulta.");
  }
}
