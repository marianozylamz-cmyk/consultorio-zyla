"use client";

import { useEffect, useState } from "react";

interface UpcomingDay {
  fecha: string;
  label: string;
  slotsCount: number;
}

interface RangoHorario {
  inicio: string;
  fin: string;
}

export function HorarioResumen() {
  const [texto, setTexto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const upcomingRes = await fetch("/api/availability/upcoming", {
          cache: "no-store",
        });
        const dias: UpcomingDay[] = await upcomingRes.json();

        const diaConTurno = dias.find((d) => d.slotsCount > 0);

        if (!diaConTurno) {
          if (mounted) {
            setTexto(null);
            setLoading(false);
          }
          return;
        }

        const rangoRes = await fetch(
          `/api/availability?fecha=${diaConTurno.fecha}`,
          { cache: "no-store" }
        );
        const rangoJson: { rangoHorario: RangoHorario | null } =
          await rangoRes.json();

        if (mounted) {
          if (rangoJson.rangoHorario) {
            const { inicio, fin } = rangoJson.rangoHorario;
            const prefijo =
              diaConTurno.label === "Hoy" ? "Hoy" : diaConTurno.label;
            setTexto(`${prefijo} ${inicio} a ${fin} hs.`);
          } else {
            setTexto(null);
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setTexto(null);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="skeleton h-7 w-32 rounded" />;
  }

  return (
    <p className="text-xl font-bold text-[#1B6E5C]">
      {texto ?? "Consultá horarios disponibles"}
    </p>
  );
}