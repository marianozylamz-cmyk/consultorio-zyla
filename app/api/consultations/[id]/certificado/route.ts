import { NextResponse } from "next/server";
import { getConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { generarCertificadoPdf } from "@/lib/certificatePdf";
import { documentService } from "@/services/documentService";
import { doctorProfile } from "@/data/doctorProfile";
import { CertificateInput } from "@/types";

// ==========================================================
// Genera un certificado médico simple (PDF) con los datos que ya
// tenemos de la consulta + lo que complete Juan en el modal, y lo
// suma a `documentos` como cualquier otro archivo — así reutiliza
// el mismo circuito de "Enviar por mail" que ya existía, sin
// duplicar lógica.
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
            "Falta cargar la matrícula del médico antes de poder emitir certificados. Completar doctorProfile.matricula en data/doctorProfile.ts.",
        },
        { status: 412 }
      );
    }

    const input = (await req.json()) as CertificateInput;

    if (!input.diagnostico?.trim()) {
      return NextResponse.json({ error: "El diagnóstico es obligatorio." }, { status: 400 });
    }

    const pdfBuffer = await generarCertificadoPdf(consultation, input);
    const dataUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    const nombreArchivo = `certificado-${consultation.paciente.nombre.replace(/\s+/g, "_").toLowerCase()}-${consultation.fecha}.pdf`;

    const doc = await documentService.guardar({
      consultationId: consultation.id,
      nombre: nombreArchivo,
      tipo: "certificado",
      mimeType: "application/pdf",
      dataUrl,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return errorDeServidor(error, "No se pudo generar el certificado.");
  }
}
