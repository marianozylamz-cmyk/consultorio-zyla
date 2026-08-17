import { NextResponse } from "next/server";
import { consultarPago } from "@/lib/mercadopago";
import { getConsultation, liberarTurnoDeConsulta, updateConsultationSiEstadoEs } from "@/lib/store";
import { notificationService } from "@/services/notificationService";

// ==========================================================
// Mercado Pago pega acá cuando cambia el estado de un pago.
// IMPORTANTE: nunca confiamos en los query params de la
// redirección del navegador (back_urls) para dar por pagada una
// consulta — esos los puede manipular cualquiera. La única
// fuente de verdad es esta notificación + la consulta a la API
// de Mercado Pago con el paymentId, usando nuestro Access Token.
// ==========================================================

export async function POST(req: Request) {
  let paymentId: string | null = null;

  try {
    const url = new URL(req.url);
    // MP manda el id a veces por query params, a veces en el body, según el tipo de notificación.
    paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

    if (!paymentId) {
      const body = await req.json().catch(() => null);
      paymentId = body?.data?.id ?? null;
    }

    if (!paymentId) {
      // Notificación de un tipo que no nos interesa (ej. merchant_order); la aceptamos igual.
      return NextResponse.json({ recibido: true });
    }

    const pago = await consultarPago(paymentId);
    const consultationId = pago.external_reference;

    const consultation = await getConsultation(consultationId);
    if (!consultation) {
      console.warn(`[mp-webhook] Pago ${paymentId} referencia una consulta inexistente: ${consultationId}`);
      return NextResponse.json({ recibido: true });
    }

    if (pago.status === "approved") {
      // Update atómico condicionado al estado previo: si dos notificaciones
      // del mismo pago llegan casi en simultáneo (MP reintenta, o a veces
      // manda el mismo evento más de una vez por diseño), solo la primera
      // encuentra la fila todavía en "pendiente_pago" y hace el cambio —
      // la segunda no encuentra nada para actualizar y no dispara un mail
      // duplicado al médico/secretaria ni al paciente.
      const updated = await updateConsultationSiEstadoEs(consultation.id, "pendiente_pago", {
        estado: "esperando",
        pago: {
          ...consultation.pago,
          estado: "aprobado",
          metodo: "mercadopago",
          mpPaymentId: String(pago.id),
          fechaAprobacion: new Date().toISOString(),
        },
      });
      if (updated) {
        await notificationService.notifyDoctorNewConsultation(updated);
        if (!updated.esAhora) {
          await notificationService.notifyPatientBookingConfirmed(updated);
        }
      }
    } else if (pago.status === "rejected") {
      const updated = await updateConsultationSiEstadoEs(consultation.id, "pendiente_pago", {
        estado: "rechazada",
        pago: { ...consultation.pago, estado: "rechazado", metodo: "mercadopago", mpPaymentId: String(pago.id) },
      });
      if (updated) {
        // Sin esto, un pago rechazado con Mercado Pago real dejaba el
        // horario bloqueado para siempre — el pago mock y el PATCH
        // genérico ya liberaban el turno acá, este camino se había
        // quedado afuera.
        await liberarTurnoDeConsulta(updated.id);
      }
    }

    return NextResponse.json({ recibido: true });
  } catch (error) {
    console.error("[mp-webhook] Error procesando notificación:", error);
    // Devolvemos 200 igual: si le devolvemos error, Mercado Pago reintenta indefinidamente
    // la misma notificación rota. Preferimos loguearlo y revisar manualmente.
    return NextResponse.json({ recibido: true });
  }
}

// Silenciamos GET para evitar 405 ruidoso si alguien abre la URL en el navegador (algunos paneles de MP la testean con GET).
export async function GET() {
  return NextResponse.json({ ok: true });
}
