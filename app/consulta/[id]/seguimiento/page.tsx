"use client";

import { useRouter } from "next/navigation";
import { SeguimientoConsulta } from "@/components/SeguimientoConsulta";

// ==========================================================
// Punto de entrada del link "Ver mi turno" del mail de confirmación —
// funciona desde cualquier dispositivo, no depende del localStorage del
// navegador que reservó (el id de la consulta ya es largo y no
// adivinable, mismo patrón que /consulta/[id]/espera). Toda la lógica de
// qué mostrar según el estado vive en SeguimientoConsulta, para que este
// link y el seguimiento por localStorage de /consulta muestren siempre
// exactamente lo mismo.
// ==========================================================
export default function SeguimientoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  return <SeguimientoConsulta consultationId={params.id} onNuevaReserva={() => router.push("/consulta")} />;
}
