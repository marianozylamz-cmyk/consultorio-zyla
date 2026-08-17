import { NextResponse } from "next/server";
import { getConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { documentService } from "@/services/documentService";
import { notificationService } from "@/services/notificationService";
import { emailConfigurado } from "@/lib/email";

// El médico aprieta "Enviar por mail" una sola vez: este endpoint manda el
// mail real (con el documento adjunto) y recién si eso sale bien lo marca
// como enviado — así la lista nunca miente sobre si el paciente lo recibió.
export async function POST(_req: Request, { params }: { params: { id: string; docId: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    const doc = consultation.documentos.find((d) => d.id === params.docId);
    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    if (doc.enviado) {
      return NextResponse.json(consultation);
    }

    if (!emailConfigurado()) {
      return NextResponse.json(
        { error: "El envío de mails no está configurado todavía (falta el SMTP)." },
        { status: 503 }
      );
    }

    const { enviado } = await notificationService.sendDocumentToPatient(consultation, doc);
    if (!enviado) {
      return NextResponse.json({ error: "No se pudo enviar el mail. Intentá nuevamente." }, { status: 502 });
    }

    const actualizado = await documentService.marcarEnviado(params.id, params.docId);
    return NextResponse.json(actualizado);
  } catch (error) {
    return errorDeServidor(error, "No se pudo enviar el documento. Intentá nuevamente.");
  }
}
