import { NextResponse } from "next/server";
import { getAvailability, setAvailability } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
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

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as Partial<AvailabilityConfig>;
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
