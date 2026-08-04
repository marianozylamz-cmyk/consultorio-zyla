import { NextResponse } from "next/server";
import { getConsultation, updateConsultation } from "@/lib/store";
import { paymentService } from "@/services/paymentService";
import { notificationService } from "@/services/notificationService";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const consultation = getConsultation(params.id);
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
    const updated = updateConsultation(consultation.id, {
      estado: "rechazada",
      pago: { estado: "rechazado", metodo: "mock" },
    });
    return NextResponse.json({ resultado, consultation: updated });
  }

  const updated = updateConsultation(consultation.id, {
    estado: "esperando",
    pago: { estado: "aprobado", metodo: "mock", fechaAprobacion: resultado.fecha },
  });

  if (updated) {
    const notificaciones = await notificationService.notifyDoctorNewConsultation(updated);
    updateConsultation(consultation.id, { notificaciones });
  }

  return NextResponse.json({ resultado, consultation: getConsultation(consultation.id) });
}
