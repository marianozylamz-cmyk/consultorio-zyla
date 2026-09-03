import { NextResponse } from "next/server";
import { getConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { generarSolicitudEstudiosPdf } from "@/lib/certificatePdf";
import { documentService } from "@/services/documentService";
import { doctorProfile } from "@/data/doctorProfile";
import { SolicitudEstudiosInput } from "@/types";

// ==========================================================
// Genera un PDF de "Solicitud de estudios complementarios" con texto
// libre del médico — mismo circuito que certificado/observaciones: se
// suma a `documentos` y sale por el mismo "Enviar documentación al
// paciente" que ya existe, sin duplicar lógica de envío.
// ==========================================================

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    if (!doctorProfile.matricula) {
      return NextResponse.json(
        {
          error:
            "Falta cargar la matrícula del médico antes de poder emitir documentos. Completar doctorProfile.matricula en data/doctorProfile.ts.",
        },
        { status: 412 }
      );
    }

    const input = (await req.json().catch(() => ({}))) as SolicitudEstudiosInput;
    if (!input.estudios?.trim()) {
      return NextResponse.json({ error: "Los estudios solicitados son obligatorios." }, { status: 400 });
    }

    const pdfBuffer = await generarSolicitudEstudiosPdf(consultation, input);
    const dataUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    const nombreArchivo = `solicitud-estudios-${consultation.paciente.nombre.replace(/\s+/g, "_").toLowerCase()}-${consultation.fecha}.pdf`;

    const doc = await documentService.guardar({
      consultationId: consultation.id,
      nombre: nombreArchivo,
      tipo: "solicitud_estudios",
      mimeType: "application/pdf",
      dataUrl,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return errorDeServidor(error, "No se pudo generar la solicitud de estudios.");
  }
}
