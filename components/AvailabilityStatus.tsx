"use client";

import { useEffect, useState } from "react";
import { IconCalendarCheck, IconClock } from "./icons";

interface AvailabilityData {
  disponibleAhora: boolean;
}

export function AvailabilityStatus({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/availability", {
          cache: "no-store",
        });

        const json = await res.json();

        if (mounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading availability:", err);

        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    // Actualizar cada 15 segundos.
    const interval = setInterval(load, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || !data) {
    return (
      <div
        className={`skeleton rounded-full ${
          compact ? "h-8 w-40" : "h-10 w-56"
        }`}
      />
    );
  }

  const disponibleAhora = data.disponibleAhora;
  const Icon = disponibleAhora ? IconCalendarCheck : IconClock;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
        disponibleAhora
          ? "border-[#1B6E5C]/20 bg-[#D4F1E8]/70 text-[#1B6E5C]"
          : "border-[#E5E9F0] bg-[#F4EFE4] text-muted"
      } ${compact ? "!py-1.5 !px-3 !text-xs" : ""}`}
    >
      <Icon className={`shrink-0 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />

      <span className="whitespace-nowrap">
        {disponibleAhora ? "Consultas disponibles ahora" : "Fuera de horario"}
      </span>
    </div>
  );
}