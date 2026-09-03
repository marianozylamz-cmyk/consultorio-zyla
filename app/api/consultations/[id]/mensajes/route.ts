import { NextResponse } from "next/server";
import { addMensajeToConsultation, getConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { genId } from "@/lib/ids";
import { MensajeSoporte } from "@/types";

const MAX_LARGO_TEXTO = 2000;

// ==========================================================
// El paciente manda un mensaje dentro de SU consulta (id largo y no
// adivinable como autorización de facto, mismo patrón que el resto del
// circuito público). No pasa por el middleware de admin a propósito —
// esto lo tiene que poder llamar cualquiera que tenga el link, sin login.
// ==========================================================

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as { texto?: string; telefonoContacto?: string };
    const texto = body.texto?.trim();
    if (!texto) {
      return NextResponse.json({ error: "Escribí un mensaje antes de enviar." }, { status: 400 });
    }
    if (texto.length > MAX_LARGO_TEXTO) {
      return NextResponse.json({ error: "El mensaje es demasiado largo." }, { status: 400 });
    }

    const mensaje: MensajeSoporte = {
      id: genId("msg"),
      autor: "paciente",
      texto,
      telefonoContacto: body.telefonoContacto?.trim() || undefined,
      creadoEn: new Date().toISOString(),
      leidoPorMedico: false,
      leidoPorPaciente: true,
    };

    const updated = await addMensajeToConsultation(params.id, mensaje);
    return NextResponse.json(updated);
  } catch (error) {
    return errorDeServidor(error, "No se pudo enviar el mensaje. Intentá nuevamente.");
  }
}
