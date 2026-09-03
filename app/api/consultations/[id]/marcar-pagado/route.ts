import { NextResponse } from "next/server";
import { getConsultation, updateConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { decodificarBasicAuth } from "@/lib/adminAuth";

// ==========================================================
// Camino manual para cuando el pago se resolvió por fuera de Mercado
// Pago (transferencia, efectivo en el consultorio, cortesía). Esta
// ruta está detrás del mismo guard de HTTP Basic Auth que el resto
// del panel (ver esRutaDeMedico en middleware.ts) — un paciente
// anónimo no puede llamarla.
//
// A diferencia del checkout real/mock, NO dispara
// notifyDoctorNewConsultation: el médico ya sabe que la está
// marcando él mismo, notificarlo de su propia acción no tiene sentido.
// ==========================================================

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    if (consultation.estado !== "pendiente_pago") {
      return NextResponse.json({ error: "Esta consulta ya no está pendiente de pago." }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as { motivo?: string };
    const motivo = body.motivo?.trim();
    if (!motivo) {
      return NextResponse.json({ error: "El motivo es obligatorio." }, { status: 400 });
    }

    const usuario = decodificarBasicAuth(req)?.usuario;

    const updated = await updateConsultation(consultation.id, {
      estado: "esperando",
      pago: {
        ...consultation.pago,
        estado: "aprobado",
        metodo: "manual",
        notaManual: motivo,
        marcadoPorAdmin: usuario,
        fechaAprobacion: new Date().toISOString(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return errorDeServidor(error, "No se pudo marcar la consulta como pagada.");
  }
}
