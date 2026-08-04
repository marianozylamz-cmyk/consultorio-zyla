import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/store";
import { getSlotsForDate, isAvailableNow, toISODate, fechaDesdeISO } from "@/lib/availability";

export async function GET(req: Request) {
  const config = getAvailability();
  const now = new Date();
  const { disponible, horarioHoy } = isAvailableNow(config, now);

  const { searchParams } = new URL(req.url);
  const fechaParam = searchParams.get("fecha");
  const fecha = fechaParam ? fechaDesdeISO(fechaParam) : now;

  const slots = getSlotsForDate(config, fecha);

  return NextResponse.json({
    disponibleAhora: disponible,
    horarioHoy,
    fecha: toISODate(fecha),
    slots,
    activo: config.activo,
  });
}
