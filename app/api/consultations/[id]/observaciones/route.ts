import { NextResponse } from "next/server";
import { getConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { generarObservacionesPdf } from "@/lib/certificatePdf";
import { documentService } from "@/services/documentService";
import { doctorProfile } from "@/data/doctorProfile";
import { nombreArchivoDocumento } from "@/lib/documentLabels";

// ==========================================================
// Genera un PDF de "Observaciones médicas" con el texto libre que
// escribe el médico — reemplaza la dependencia de preparar un archivo
// aparte para esto. Mismo circuito que certificado: se suma a
// `documentos` como cualquier otro archivo.
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

    const body = (await req.json().catch(() => ({}))) as { texto?: string };
    if (!body.texto?.trim()) {
      return NextResponse.json({ error: "El texto de las observaciones es obligatorio." }, { status: 400 });
    }

    const pdfBuffer = await generarObservacionesPdf(consultation, body.texto.trim());
    const dataUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    const nombreArchivo = nombreArchivoDocumento("observaciones", consultation.paciente.nombre);

    const doc = await documentService.guardar({
      consultationId: consultation.id,
      nombre: nombreArchivo,
      tipo: "observaciones",
      mimeType: "application/pdf",
      dataUrl,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return errorDeServidor(error, "No se pudo generar el documento de observaciones.");
  }
}
