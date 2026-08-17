import { NextResponse } from "next/server";
import { getConsultation, marcarDocumentacionEnviada } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { emailConfigurado } from "@/lib/email";
import { notificationService } from "@/services/notificationService";

// ==========================================================
// Un solo email al paciente con TODOS los documentos disponibles de la
// consulta (certificado, observaciones, receta/indicaciones subidas,
// etc.), en vez de un mail por cada uno. El médico la llama una vez que
// terminó de preparar todo lo que corresponde a esa consulta.
// ==========================================================

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    if (consultation.documentos.length === 0) {
      return NextResponse.json({ error: "Todavía no hay ningún documento para enviar." }, { status: 400 });
    }

    if (!emailConfigurado()) {
      return NextResponse.json(
        { error: "El envío de mails no está configurado todavía (falta el SMTP)." },
        { status: 503 }
      );
    }

    const { enviado } = await notificationService.sendAllDocumentsToPatient(consultation);
    if (!enviado) {
      return NextResponse.json({ error: "No se pudo enviar el mail. Intentá nuevamente." }, { status: 502 });
    }

    const actualizada = await marcarDocumentacionEnviada(params.id);
    return NextResponse.json(actualizada);
  } catch (error) {
    return errorDeServidor(error, "No se pudo enviar la documentación. Intentá nuevamente.");
  }
}
