import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { getSlotsForDate, isAvailableNow, toISODate, fechaDesdeISO } from "@/lib/availability";

// Nunca cachear/pre-renderizar: cada request depende de datos en vivo de Supabase.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const config = await getAvailability();
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
  } catch (error) {
    return errorDeServidor(error, "No se pudo cargar la disponibilidad.");
  }
}
