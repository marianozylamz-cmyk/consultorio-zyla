import { NextResponse } from "next/server";
import { removeDocumentFromConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";

export async function DELETE(_req: Request, { params }: { params: { id: string; docId: string } }) {
  try {
    const updated = await removeDocumentFromConsultation(params.id, params.docId);
    if (!updated) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return errorDeServidor(error, "No se pudo eliminar el documento.");
  }
}
