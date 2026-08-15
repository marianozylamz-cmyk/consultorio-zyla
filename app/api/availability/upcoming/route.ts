import { NextResponse } from "next/server";
import { getAvailability, getHorasReservadasEnRango } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { doctorProfile } from "@/data/doctorProfile";
import { getSlotsForDate, toISODate, weekdayFromDate, fechaDesdeISO } from "@/lib/availability";
import { Weekday } from "@/types";

const LABELS: Record<Weekday, string> = {
  lun: "Lunes",
  mar: "Martes",
  mie: "Miércoles",
  jue: "Jueves",
  vie: "Viernes",
  sab: "Sábado",
  dom: "Domingo",
};

const UN_DIA_MS = 24 * 60 * 60 * 1000;

// Nunca cachear/pre-renderizar: cada request depende de datos en vivo de Supabase.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getAvailability();
    const now = new Date();

    // Ancla en el mediodía de "hoy" en hora de Argentina, y avanza de a
    // milisegundos exactos (no con setDate() del sistema) para no arrastrar
    // el timezone del servidor a estos cálculos.
    const hoyAR = fechaDesdeISO(toISODate(now));
    const fechas = Array.from({ length: 7 }, (_, i) => new Date(hoyAR.getTime() + i * UN_DIA_MS));
    const fechasISO = fechas.map(toISODate);

    // Una sola consulta para los 7 días, en vez de una por día — y evita
    // contar como "disponible" un horario que ya tiene otro paciente.
    const reservadas = await getHorasReservadasEnRango(doctorProfile.id, fechasISO);

    const dias = fechas.map((date, i) => {
      const fecha = fechasISO[i];
      const horasOcupadas = reservadas.get(fecha) ?? new Set<string>();
      const slots = getSlotsForDate(config, date, 30, now).filter((h) => !horasOcupadas.has(h));
      return {
        fecha,
        label: i === 0 ? "Hoy" : i === 1 ? "Mañana" : LABELS[weekdayFromDate(date)],
        slotsCount: slots.length,
      };
    });

    return NextResponse.json(dias);
  } catch (error) {
    return errorDeServidor(error, "No se pudieron cargar los próximos días.");
  }
}
