import { Consultation } from "@/types";

export const ESTADO_LABEL: Record<
  Consultation["estado"],
  { label: string; dotClassName: string; textClassName: string }
> = {
  pendiente_pago: { label: "Pendiente de pago", dotClassName: "bg-slate-300", textClassName: "text-muted" },
  esperando: { label: "Esperando", dotClassName: "bg-amber-500 animate-pulseSoft", textClassName: "text-amber-600" },
  lista: { label: "Lista para iniciar", dotClassName: "bg-emerald-500 animate-pulseSoft", textClassName: "text-emerald-600" },
  en_consulta: { label: "En consulta", dotClassName: "bg-navy", textClassName: "text-navy" },
  finalizada: { label: "Finalizada", dotClassName: "bg-slate-300", textClassName: "text-muted" },
  rechazada: { label: "Pago rechazado", dotClassName: "bg-red-500", textClassName: "text-red-500" },
};
