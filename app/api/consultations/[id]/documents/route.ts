import { NextResponse } from "next/server";
import { getConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { documentService } from "@/services/documentService";
import { DocumentType } from "@/types";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    const body = (await req.json()) as {
      nombre: string;
      tipo: DocumentType;
      mimeType: string;
      dataUrl: string;
    };

    if (!body.dataUrl || !body.nombre) {
      return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
    }

    const doc = await documentService.guardar({
      consultationId: params.id,
      nombre: body.nombre,
      tipo: body.tipo ?? "otro",
      mimeType: body.mimeType,
      dataUrl: body.dataUrl,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return errorDeServidor(error, "No se pudo subir el documento.");
  }
}
