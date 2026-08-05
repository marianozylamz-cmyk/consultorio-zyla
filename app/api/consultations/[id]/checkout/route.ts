import { NextResponse } from "next/server";
import { getConsultation, updateConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { crearPreferenciaPago, mercadoPagoConfigurado } from "@/lib/mercadopago";
import { doctorProfile } from "@/data/doctorProfile";

// ==========================================================
// El paciente llega acá después de completar sus datos y elegir
// horario, justo antes de pagar. Si Mercado Pago está
// configurado (MERCADOPAGO_ACCESS_TOKEN), creamos una preferencia
// real de Checkout Pro y devolvemos la URL para redirigir.
// Si no, devolvemos modo "mock" para seguir probando en local
// sin cuenta de Mercado Pago.
// ==========================================================

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    if (!mercadoPagoConfigurado()) {
      return NextResponse.json({ modo: "mock" as const });
    }

    const preferencia = await crearPreferenciaPago({
      consultationId: consultation.id,
      titulo: `Consulta online — Dr. ${doctorProfile.nombre}`,
      precio: consultation.precio,
    });

    await updateConsultation(consultation.id, {
      pago: { ...consultation.pago, metodo: "mercadopago", mpPreferenceId: preferencia.id },
    });

    // En producción usar init_point; sandbox_init_point solo sirve con credenciales de prueba.
    const esProduccion = process.env.MERCADOPAGO_ENV === "production";
    const checkoutUrl = esProduccion ? preferencia.init_point : preferencia.sandbox_init_point;

    return NextResponse.json({ modo: "mercadopago" as const, checkoutUrl });
  } catch (error) {
    return errorDeServidor(error, "No se pudo iniciar el pago con Mercado Pago. Intentá nuevamente.");
  }
}
