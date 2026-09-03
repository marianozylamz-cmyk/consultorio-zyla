import { NextResponse } from "next/server";
import { marcarMensajesLeidosPorPaciente } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";

// Público, igual que POST /mensajes — el paciente marca como leídos los
// mensajes del médico apenas abre el panel de chat en su navegador.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const updated = await marcarMensajesLeidosPorPaciente(params.id);
    if (!updated) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return errorDeServidor(error, "No se pudo actualizar.");
  }
}
