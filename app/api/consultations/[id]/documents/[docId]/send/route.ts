import { NextResponse } from "next/server";
import { getConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { documentService } from "@/services/documentService";

// ==========================================================
// El envío real del mail lo hace el cliente de correo del médico
// (mailto:), no este servidor — un mailto: no puede llevar un
// adjunto automático, así que no hay nada que este endpoint pueda
// "enviar" de verdad. Esto solo registra que el médico ya inició
// el envío (descargó el archivo + abrió su cliente de correo),
// para que la lista de documentos no lo vuelva a mostrar como
// pendiente. Ver enviarDocumento() en admin/consulta/[id]/page.tsx.
// ==========================================================

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

    const actualizado = await documentService.marcarEnviado(params.id, params.docId);
    return NextResponse.json(actualizado);
  } catch (error) {
    return errorDeServidor(error, "No se pudo registrar el envío. Intentá nuevamente.");
  }
}
