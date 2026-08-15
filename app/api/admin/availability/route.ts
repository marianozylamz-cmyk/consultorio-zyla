import { NextResponse } from "next/server";
import { getAvailability, setAvailability } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { rangoHorarioValido } from "@/lib/availability";
import { AvailabilityConfig } from "@/types";

// Nunca cachear/pre-renderizar: cada request depende de datos en vivo de Supabase.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getAvailability());
  } catch (error) {
    return errorDeServidor(error, "No se pudo cargar la configuración de disponibilidad.");
  }
}

/**
 * Cada excepción "abierta" (cerrado: false) tiene que traer su propio
 * inicio/fin válidos — a diferencia del horario semanal (que se guarda
 * campo por campo mientras el médico tipea), acá se manda el array
 * completo de una sola vez, así que se puede validar de punta sin
 * arriesgar bloquear una edición a mitad de camino.
 */
function excepcionesValidas(excepciones: AvailabilityConfig["excepciones"]): boolean {
  return excepciones.every((e) => {
    if (e.cerrado) return true;
    return Boolean(e.inicio && e.fin && rangoHorarioValido(e.inicio, e.fin));
  });
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as Partial<AvailabilityConfig>;

    if (body.excepciones && !excepcionesValidas(body.excepciones)) {
      return NextResponse.json(
        { error: "Una excepción abierta necesita horario de inicio y fin válidos (fin posterior a inicio)." },
        { status: 400 }
      );
    }

    const current = await getAvailability();
    const updated: AvailabilityConfig = {
      ...current,
      ...body,
      horarioSemanal: { ...current.horarioSemanal, ...(body.horarioSemanal ?? {}) },
      excepciones: body.excepciones ?? current.excepciones,
    };
    const guardado = await setAvailability(updated);
    return NextResponse.json(guardado);
  } catch (error) {
    return errorDeServidor(error, "No se pudo guardar la disponibilidad.");
  }
}
