import { NextResponse } from "next/server";
import { getConsultation, updateConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";

// ==========================================================
// Guarda (o reemplaza) el link a la receta que el médico generó a mano
// en un sistema externo (ej. MisRx). No genera nada, no valida el
// dominio a propósito — solo confirma que sea una URL bien formada,
// para no guardar texto suelto que después no abra en ningún lado.
// ==========================================================

function esUrlValida(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as { url?: string };
    const url = body.url?.trim();

    if (!url || !esUrlValida(url)) {
      return NextResponse.json({ error: "Pegá una URL válida (tiene que empezar con http:// o https://)." }, { status: 400 });
    }

    const actualizada = await updateConsultation(params.id, { recetaExternaUrl: url });
    return NextResponse.json(actualizada);
  } catch (error) {
    return errorDeServidor(error, "No se pudo guardar el link de la receta.");
  }
}
