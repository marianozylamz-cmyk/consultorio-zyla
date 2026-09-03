import { NextResponse } from "next/server";
import { responderComoMedico } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { genId } from "@/lib/ids";
import { notificationService } from "@/services/notificationService";
import { MensajeSoporte } from "@/types";

const MAX_LARGO_TEXTO = 2000;

// ==========================================================
// El médico responde en el chat de una consulta. Detrás del guard de
// Basic Auth del panel (ver esRutaDeMedico en middleware.ts) — un
// paciente no puede llamar esta ruta.
//
// Responder marca automáticamente como leídos todos los mensajes del
// paciente (ver responderComoMedico en lib/store.ts), y dispara el mail
// de aviso al paciente salvo que ya se haya mandado uno en los últimos
// 5 minutos para esta misma consulta.
// ==========================================================

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json().catch(() => ({}))) as { texto?: string };
    const texto = body.texto?.trim();
    if (!texto) {
      return NextResponse.json({ error: "Escribí un mensaje antes de enviar." }, { status: 400 });
    }
    if (texto.length > MAX_LARGO_TEXTO) {
      return NextResponse.json({ error: "El mensaje es demasiado largo." }, { status: 400 });
    }

    const mensaje: MensajeSoporte = {
      id: genId("msg"),
      autor: "medico",
      texto,
      creadoEn: new Date().toISOString(),
      leidoPorMedico: true,
      leidoPorPaciente: false,
    };

    const resultado = await responderComoMedico(params.id, mensaje);
    if (!resultado) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    if (resultado.debeAvisar) {
      try {
        await notificationService.notifyNuevoMensaje(resultado.consultation);
      } catch (error) {
        // El mensaje ya quedó guardado — que falle el aviso por mail no
        // tiene que hacer fallar la respuesta en sí.
        console.error(`No se pudo mandar el aviso de nuevo mensaje para ${params.id}:`, error);
      }
    }

    return NextResponse.json(resultado.consultation);
  } catch (error) {
    return errorDeServidor(error, "No se pudo enviar la respuesta. Intentá nuevamente.");
  }
}
