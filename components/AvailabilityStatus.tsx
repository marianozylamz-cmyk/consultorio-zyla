"use client";

import { useEffect, useState } from "react";

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

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
        disponibleAhora
          ? "bg-[#D4F1E8] text-[#1B6E5C]"
          : "bg-[#F4EFE4] text-muted"
      } ${compact ? "!py-1.5 !px-3 !text-xs" : ""}`}
    >
      <span
        className={`h-2 w-2 rounded-full transition-all duration-300 ${
          disponibleAhora
            ? "bg-[#1B6E5C] animate-pulseSoft"
            : "bg-[#7A8499]"
        }`}
        aria-hidden="true"
      />

      <span className="whitespace-nowrap">
        {disponibleAhora ? "Disponible ahora" : "No disponible ahora"}
      </span>
    </div>
  );
}