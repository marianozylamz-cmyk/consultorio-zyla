import { NextResponse } from "next/server";
import { getConsultation } from "@/lib/store";
import { documentService } from "@/services/documentService";
import { notificationService } from "@/services/notificationService";

export async function POST(_req: Request, { params }: { params: { id: string; docId: string } }) {
  const consultation = getConsultation(params.id);
  if (!consultation) {
    return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
  }

  const doc = consultation.documentos.find((d) => d.id === params.docId);
  if (!doc) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  try {
    // El documento va adjunto directo al mail del paciente (decisión de producto:
    // sin link intermedio, para que sea exactamente como recibir un resultado
    // de laboratorio por mail — cero fricción).
    await notificationService.sendDocumentToPatient(consultation, doc);
  } catch (error) {
    console.error("[send-document] Error enviando el mail:", error);
    return NextResponse.json({ error: "No se pudo enviar el mail. Intentá nuevamente." }, { status: 502 });
  }

  const actualizado = await documentService.marcarEnviado(params.id, params.docId);

  return NextResponse.json(actualizado);
}
