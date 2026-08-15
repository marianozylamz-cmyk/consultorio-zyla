import { NextResponse } from "next/server";
import { getConsultation, liberarTurnoDeConsulta, updateConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { ConsultationStatus } from "@/types";

// Nunca cachear/pre-renderizar: cada request depende de datos en vivo de Supabase.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }
    return NextResponse.json(consultation);
  } catch (error) {
    return errorDeServidor(error, "No se pudo cargar la consulta.");
  }
}

// "pendiente_pago" -> "esperando" (o sea, marcar una consulta como pagada)
// queda afuera a propósito: eso solo lo tienen que poder hacer el webhook
// de Mercado Pago y el pago mock, que llaman a updateConsultation directo
// y ya guardan el detalle real de `pago` — nunca esta ruta genérica, para
// que ni siquiera una sesión de admin comprometida pueda "aprobar" un
// pago que nunca ocurrió.
const VALID_TRANSITIONS: Record<ConsultationStatus, ConsultationStatus[]> = {
  pendiente_pago: ["rechazada"],
  esperando: ["lista"],
  lista: ["en_consulta"],
  en_consulta: ["finalizada"],
  finalizada: [],
  rechazada: [],
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // Whitelist explícito: esta ruta solo puede cambiar `estado`. El body
  // puede traer cualquier otra cosa (precio, pago, datos del paciente) y
  // se ignora — antes se pasaba entero a updateConsultation() sin
  // validar, lo que permitía reescribir cualquier campo de la consulta.
  const body = (await req.json()) as { estado?: ConsultationStatus };
  const patch: { estado?: ConsultationStatus } = {};

  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    if (body.estado) {
      const permitido = VALID_TRANSITIONS[consultation.estado]?.includes(body.estado);
      if (!permitido) {
        return NextResponse.json(
          { error: `No se puede pasar de "${consultation.estado}" a "${body.estado}"` },
          { status: 400 }
        );
      }
      patch.estado = body.estado;
    }

    const updated = await updateConsultation(params.id, patch);

    // Si la consulta se rechaza, el turno tiene que volver a quedar
    // disponible para otro paciente — si no, queda bloqueado para
    // siempre aunque nadie la vaya a pagar. El pago mock ya hace esto
    // mismo; acá cubrimos el resto de los caminos que pueden llegar a
    // "rechazada" (ej. una acción manual de administración).
    if (body.estado === "rechazada") {
      await liberarTurnoDeConsulta(params.id);
    }

    return NextResponse.json(updated);
  } catch (error) {
    return errorDeServidor(error, "No se pudo actualizar la consulta.");
  }
}
