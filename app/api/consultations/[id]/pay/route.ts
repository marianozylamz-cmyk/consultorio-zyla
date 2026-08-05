import { NextResponse } from "next/server";
import { getConsultation, updateConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { paymentService } from "@/services/paymentService";
import { notificationService } from "@/services/notificationService";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as { forzarResultado?: "aprobado" | "rechazado" };

    const resultado = await paymentService.procesarPago({
      consultationId: consultation.id,
      monto: consultation.precio,
      forzarResultado: body.forzarResultado,
    });

    if (!resultado.aprobado) {
      const updated = await updateConsultation(consultation.id, {
        estado: "rechazada",
        pago: { estado: "rechazado", metodo: "mock" },
      });
      return NextResponse.json({ resultado, consultation: updated });
    }

    const updated = await updateConsultation(consultation.id, {
      estado: "esperando",
      pago: { estado: "aprobado", metodo: "mock", fechaAprobacion: resultado.fecha },
    });

    if (updated) {
      const notificaciones = await notificationService.notifyDoctorNewConsultation(updated);
      await updateConsultation(consultation.id, { notificaciones });
    }

    const final = await getConsultation(consultation.id);
    return NextResponse.json({ resultado, consultation: final });
  } catch (error) {
    return errorDeServidor(error, "No se pudo procesar el pago.");
  }
}
