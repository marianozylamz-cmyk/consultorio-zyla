"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Consultation } from "@/types";
import { formatFechaLargaAR } from "@/lib/availability";
import { linkWhatsAppConsultorio } from "@/lib/whatsapp";
import { IconWhatsApp } from "@/components/icons";

interface AvailabilityData {
  slots: string[];
}

interface UpcomingDay {
  fecha: string;
  label: string;
  slotsCount: number;
}

export default function ReprogramarPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const [diasDisponibles, setDiasDisponibles] = useState<UpcomingDay[] | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/consultations/${params.id}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((c: Consultation) => setConsultation(c))
      .catch(() => setError("No pudimos encontrar esta consulta."))
      .finally(() => setCargando(false));
  }, [params.id]);

  const puedeReprogramar = consultation && !consultation.esAhora && consultation.estado === "esperando";

  useEffect(() => {
    if (!puedeReprogramar || diasDisponibles) return;
    fetch("/api/availability/upcoming", { cache: "no-store" })
      .then((r) => r.json())
      .then((dias: UpcomingDay[]) => {
        setDiasDisponibles(dias);
        const conTurnos = dias.find((d) => d.slotsCount > 0);
        setFechaSeleccionada(conTurnos ? conTurnos.fecha : dias[0]?.fecha ?? null);
      })
      .catch(() => setDiasDisponibles([]));
  }, [puedeReprogramar, diasDisponibles]);

  useEffect(() => {
    if (!fechaSeleccionada) return;
    fetch(`/api/availability?fecha=${fechaSeleccionada}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setAvailability)
      .catch(() => setAvailability(null));
  }, [fechaSeleccionada]);

  async function confirmarNuevoHorario(hora: string) {
    if (!fechaSeleccionada || enviando) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const res = await fetch(`/api/consultations/${params.id}/reprogramar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: fechaSeleccionada, hora }),
      });
      if (res.status === 409) {
        setErrorEnvio("Ese horario se acaba de ocupar. Elegí otro, por favor.");
        const r = await fetch(`/api/availability?fecha=${fechaSeleccionada}`, { cache: "no-store" });
        setAvailability(await r.json());
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorEnvio(data.error ?? "No se pudo reprogramar. Intentá de nuevo.");
        return;
      }
      router.push(`/consulta/${params.id}/espera`);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </main>
    );
  }

  if (error || !consultation) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-muted">{error ?? "No pudimos encontrar esta consulta."}</p>
        <Link href="/" className="text-sm text-navy underline-offset-2 hover:underline">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="container-max max-w-xl py-12">
        <h1 className="text-2xl font-bold text-ink">Reprogramar mi turno</h1>
        <p className="mt-2 text-sm text-muted">
          Turno actual: <strong>{formatFechaLargaAR(consultation.fecha)}</strong> a las{" "}
          <strong>{consultation.hora} hs</strong>.
        </p>

        {!puedeReprogramar ? (
          <div className="card mt-8 bg-bgsoft text-sm text-ink/80">
            Este turno ya no se puede reprogramar desde acá.{" "}
            <a
              href={linkWhatsAppConsultorio(
                `Hola, soy ${consultation.paciente.nombre}. Quiero cambiar el día u horario de mi turno del ${consultation.fecha}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-[#1B6E5C] underline underline-offset-2"
            >
              <IconWhatsApp className="h-4 w-4" />
              Escribinos por WhatsApp
            </a>{" "}
            y te ayudamos.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {errorEnvio && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorEnvio}
              </div>
            )}

            {diasDisponibles && diasDisponibles.length > 0 && (
              <div>
                <p className="mb-3 text-sm font-medium text-ink">Elegir día</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {diasDisponibles.map((d) => (
                    <button
                      key={d.fecha}
                      onClick={() => setFechaSeleccionada(d.fecha)}
                      disabled={d.slotsCount === 0}
                      className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                        fechaSeleccionada === d.fecha
                          ? "border-navy bg-navy text-white"
                          : d.slotsCount === 0
                          ? "border-line text-muted/50"
                          : "border-line text-ink hover:border-navy/40 hover:bg-skyfaint"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 text-sm font-medium text-ink">
                Horarios{fechaSeleccionada ? ` — ${formatFechaLargaAR(fechaSeleccionada)}` : ""}
              </p>
              {!diasDisponibles || !availability ? (
                <div className="grid grid-cols-3 gap-2.5" aria-label="Cargando horarios">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-11 rounded-xl" />
                  ))}
                </div>
              ) : availability.slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5">
                  {availability.slots.map((hora) => (
                    <button
                      key={hora}
                      disabled={enviando}
                      onClick={() => confirmarNuevoHorario(hora)}
                      className="rounded-xl border border-line py-3 text-sm font-medium text-ink transition-colors hover:border-navy hover:bg-skyfaint disabled:opacity-50"
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              ) : diasDisponibles.every((d) => d.slotsCount === 0) ? (
                <div className="card bg-bgsoft text-sm text-ink/80">
                  No hay horarios disponibles en los próximos días. Escribinos por WhatsApp y te ayudamos.
                </div>
              ) : (
                <p className="text-sm text-muted">No hay horarios disponibles ese día. Probá otro día arriba.</p>
              )}
            </div>

            <Link href={`/consulta/${params.id}/espera`} className="inline-block text-sm text-muted hover:text-ink">
              ← Volver sin cambiar nada
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
