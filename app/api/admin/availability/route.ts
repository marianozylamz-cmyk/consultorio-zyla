import { NextResponse } from "next/server";
import { getAvailability, setAvailability } from "@/lib/store";
import { AvailabilityConfig } from "@/types";

export async function GET() {
  return NextResponse.json(getAvailability());
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as Partial<AvailabilityConfig>;
  const current = getAvailability();
  const updated: AvailabilityConfig = {
    ...current,
    ...body,
    horarioSemanal: { ...current.horarioSemanal, ...(body.horarioSemanal ?? {}) },
    excepciones: body.excepciones ?? current.excepciones,
  };
  setAvailability(updated);
  return NextResponse.json(updated);
}
