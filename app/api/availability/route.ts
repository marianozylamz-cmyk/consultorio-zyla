import { NextResponse } from "next/server";
import { getAvailability, getHorasReservadasEnRango } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { doctorProfile } from "@/data/doctorProfile";
import {
  esAtencionEspecialHoy,
  getEffectiveScheduleForDate,
  getSlotsForDate,
  isAvailableNow,
  toISODate,
  fechaDesdeISO,
} from "@/lib/availability";

// Nunca cachear/pre-renderizar: cada request depende de datos en vivo de Supabase.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const config = await getAvailability();
    const now = new Date();

    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get("fecha");

    const fecha = fechaParam ? fechaDesdeISO(fechaParam) : now;

    // Esto representa ÚNICAMENTE la atención inmediata.
    // Solo corresponde a la fecha de hoy.
    const esHoy = toISODate(fecha) === toISODate(now);
    const { disponible, horarioHoy, dentroDeHorarioHabitual } = esHoy
      ? isAvailableNow(config, now)
      : { disponible: false, horarioHoy: null, dentroDeHorarioHabitual: false };

    // Esto representa ÚNICAMENTE la agenda normal, sin los horarios que
    // ya tiene otro paciente — turnos_reservados es la fuente de verdad
    // real de "ocupado", no algo que se pueda derivar solo del horario.
    const fechaISO = toISODate(fecha);
    const reservadas = await getHorasReservadasEnRango(doctorProfile.id, [fechaISO]);
    const horasOcupadas = reservadas.get(fechaISO) ?? new Set<string>();
    const slots = getSlotsForDate(config, fecha, 30, now).filter((h) => !horasOcupadas.has(h));

    // Rango horario NORMAL de la fecha consultada (agenda, no atención
    // inmediata). Se usa para mostrar texto tipo "17:00 a 19:00 hs." en
    // la landing sin hardcodear un horario fijo — varía según el día.
    const schedule = getEffectiveScheduleForDate(config, fecha);
    const rangoHorario = schedule.habilitado
      ? { inicio: schedule.inicio, fin: schedule.fin }
      : null;

    return NextResponse.json({
      // Atención inmediata: solo puede existir para HOY.
      disponibleAhora: disponible,

      // No se usa para mostrar la agenda normal.
      horarioHoy,

      // Si hoy estamos dentro del horario fijo de la agenda normal.
      dentroDeHorarioHabitual,

      // Fecha consultada.
      fecha: toISODate(fecha),

      // Turnos normales disponibles.
      slots,

      // Rango horario normal (agenda) de la fecha consultada.
      // null si ese día está cerrado.
      rangoHorario,

      // Estado del interruptor "atender ahora" (solo cuenta si se activó hoy).
      activo: esAtencionEspecialHoy(config, now),
    });
  } catch (error) {
    return errorDeServidor(
      error,
      "No se pudo cargar la disponibilidad."
    );
  }
}