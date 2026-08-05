import { NextResponse } from "next/server";
import { consultarPago } from "@/lib/mercadopago";
import { getConsultation, updateConsultation } from "@/lib/store";
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

    if (pago.status === "approved" && consultation.estado === "pendiente_pago") {
      const updated = await updateConsultation(consultation.id, {
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
      }
    } else if (pago.status === "rejected" && consultation.estado === "pendiente_pago") {
      await updateConsultation(consultation.id, {
        estado: "rechazada",
        pago: { ...consultation.pago, estado: "rechazado", metodo: "mercadopago", mpPaymentId: String(pago.id) },
      });
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
