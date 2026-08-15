import { createClient } from "@supabase/supabase-js";

// ==========================================================
// Cliente de Supabase para uso EXCLUSIVO del servidor (rutas de
// API). Esta app no hace ninguna consulta a Supabase desde el
// navegador — todo pasa por nuestras propias rutas de API. Por
// eso usamos la Service Role Key (bypassa RLS) en vez de la
// clave anónima: es el patrón correcto para un backend confiable
// que ya controla sus propias reglas de acceso.
//
// SUPABASE_SERVICE_ROLE_KEY NO lleva el prefijo NEXT_PUBLIC_ a
// propósito: Next.js solo expone al navegador las variables que
// empiezan con ese prefijo. Esta nunca debe llegar al cliente.
//
// Reutilizamos NEXT_PUBLIC_SUPABASE_URL para la URL del proyecto
// (no es un dato sensible, y ya está configurada) para no pedir
// una variable duplicada.
// ==========================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. " +
      "Ver .env.example — la Service Role Key se consigue en Supabase → Project Settings → API."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  // Next.js parchea el fetch global y por defecto cachea las respuestas GET
  // durante el render, incluso las que hace por dentro esta librería — el
  // `export const dynamic = "force-dynamic"` de las rutas no alcanza para
  // evitarlo de forma confiable. Sin esto, una consulta a Supabase podía
  // devolver disponibilidad vieja (ej. justo después de guardar un cambio
  // en Admin) hasta que el cache expirara solo.
  global: {
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  },
});
