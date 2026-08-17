import { NextResponse } from "next/server";
import { getAvailability, getConsultation, reprogramarConsulta, SlotOcupadoError } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { fechaDesdeISO, getSlotsForDate } from "@/lib/availability";
import { notificationService } from "@/services/notificationService";

// Nunca cachear/pre-renderizar: cada request depende de datos en vivo de Supabase.
export const dynamic = "force-dynamic";

// ==========================================================
// Self-service de "reprogramar mi turno" para el paciente, sin cuentas:
// el id de la consulta (no adivinable, ver lib/ids.ts) funciona como
// autorización de facto, igual que el resto del flujo público
// (checkout, pay, GET de la consulta). No pasa por el middleware de
// admin a propósito — esto lo tiene que poder llamar el paciente.
// ==========================================================
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    if (consultation.esAhora) {
      return NextResponse.json(
        { error: "Una atención inmediata no se puede reprogramar. Reservá un turno nuevo." },
        { status: 400 }
      );
    }

    if (consultation.estado !== "esperando") {
      return NextResponse.json(
        { error: "Este turno ya no se puede reprogramar. Escribinos por WhatsApp si necesitás ayuda." },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { fecha?: string; hora?: string };
    if (!body.fecha || !body.hora) {
      return NextResponse.json({ error: "Faltan fecha u hora" }, { status: 400 });
    }

    // Mismo chequeo que al crear una consulta: el horario elegido tiene que
    // ser uno real reconocido por el backend, no lo que mande el cliente.
    const config = await getAvailability();
    const slotsDelDia = getSlotsForDate(config, fechaDesdeISO(body.fecha), 30, new Date());
    if (!slotsDelDia.includes(body.hora)) {
      return NextResponse.json({ error: "Ese horario ya no está disponible. Elegí otro." }, { status: 400 });
    }

    const actualizada = await reprogramarConsulta(consultation, body.fecha, body.hora);

    await notificationService.notifyDoctorNewConsultation(actualizada);
    await notificationService.notifyPatientBookingConfirmed(actualizada);

    return NextResponse.json(actualizada);
  } catch (error) {
    if (error instanceof SlotOcupadoError) {
      return NextResponse.json({ error: "slot_ocupado", mensaje: error.message }, { status: 409 });
    }
    return errorDeServidor(error, "No se pudo reprogramar el turno. Intentá nuevamente.");
  }
}
