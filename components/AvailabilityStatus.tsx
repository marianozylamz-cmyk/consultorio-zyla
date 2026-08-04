"use client";

import { useEffect, useState } from "react";

interface AvailabilityData {
  disponibleAhora: boolean;
  horarioHoy: { inicio: string; fin: string } | null;
  activo: boolean;
}

export function AvailabilityStatus({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<AvailabilityData | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/availability", { cache: "no-store" });
        const json = await res.json();
        if (mounted) setData(json);
      } catch {
        // silencioso: el estado simplemente no se actualiza
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!data) {
    return (
      <div className={compact ? "h-8 w-40 animate-pulse rounded-full bg-bgsoft" : "h-10 w-56 animate-pulse rounded-full bg-bgsoft"} />
    );
  }

  const disponible = data.disponibleAhora;

  return (
    <div
      className={`badge-live ${disponible ? "" : "bg-bgsoft text-muted"} ${compact ? "!py-1.5 !px-3 text-xs" : ""}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${disponible ? "bg-emerald-500 animate-pulseSoft" : "bg-slate-300"}`}
      />
      {disponible
        ? "Disponible para consultas online"
        : "Consultas online no disponibles actualmente"}
    </div>
  );
}
