import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
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
    const dias = [];

    // Ancla en el mediodía de "hoy" en hora de Argentina, y avanza de a
    // milisegundos exactos (no con setDate() del sistema) para no arrastrar
    // el timezone del servidor a estos cálculos.
    const hoyAR = fechaDesdeISO(toISODate(new Date()));

    for (let i = 0; i < 7; i++) {
      const date = new Date(hoyAR.getTime() + i * UN_DIA_MS);
      const slots = getSlotsForDate(config, date);
      dias.push({
        fecha: toISODate(date),
        label: i === 0 ? "Hoy" : i === 1 ? "Mañana" : LABELS[weekdayFromDate(date)],
        slotsCount: slots.length,
      });
    }

    return NextResponse.json(dias);
  } catch (error) {
    return errorDeServidor(error, "No se pudieron cargar los próximos días.");
  }
}
