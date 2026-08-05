import { NextResponse } from "next/server";

/** Respuesta 500 consistente cuando falla una operación contra Supabase (o cualquier dependencia externa). */
export function errorDeServidor(error: unknown, mensaje = "Ocurrió un error inesperado. Probá de nuevo.") {
  console.error(error);
  return NextResponse.json({ error: mensaje }, { status: 500 });
}
