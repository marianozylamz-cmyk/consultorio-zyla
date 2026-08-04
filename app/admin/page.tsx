"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Consultation, AvailabilityConfig, Weekday } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";
import { IconBell } from "@/components/icons";

const DIAS: { key: Weekday; label: string }[] = [
  { key: "lun", label: "Lunes" },
  { key: "mar", label: "Martes" },
  { key: "mie", label: "Miércoles" },
  { key: "jue", label: "Jueves" },
  { key: "vie", label: "Viernes" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

const ESTADO_LABEL: Record<Consultation["estado"], { label: string; dotClassName: string; textClassName: string }> = {
  pendiente_pago: { label: "Pendiente de pago", dotClassName: "bg-slate-300", textClassName: "text-muted" },
  esperando: { label: "Esperando", dotClassName: "bg-amber-500 animate-pulseSoft", textClassName: "text-amber-600" },
  lista: { label: "Lista para iniciar", dotClassName: "bg-emerald-500 animate-pulseSoft", textClassName: "text-emerald-600" },
  en_consulta: { label: "En consulta", dotClassName: "bg-navy", textClassName: "text-navy" },
  finalizada: { label: "Finalizada", dotClassName: "bg-slate-300", textClassName: "text-muted" },
  rechazada: { label: "Pago rechazado", dotClassName: "bg-red-500", textClassName: "text-red-500" },
};

export default function AdminDashboard() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [availability, setAvailability] = useState<AvailabilityConfig | null>(null);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const previousWaitingIds = useRef<Set<string>>(new Set());
  const [huboAlertaSonora, setHuboAlertaSonora] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function poll() {
      try {
        const [cRes, aRes] = await Promise.all([
          fetch("/api/consultations", { cache: "no-store" }),
          fetch("/api/admin/availability", { cache: "no-store" }),
        ]);
        const cJson: Consultation[] = await cRes.json();
        const aJson: AvailabilityConfig = await aRes.json();

        const waitingNow = new Set(cJson.filter((c) => c.estado === "esperando").map((c) => c.id));
        const hayNuevas = [...waitingNow].some((id) => !previousWaitingIds.current.has(id));
        if (hayNuevas && previousWaitingIds.current.size >= 0) {
          setHuboAlertaSonora(true);
          // Simulación de sonido/alerta de navegador (BrowserNotificationService)
        }
        previousWaitingIds.current = waitingNow;

        if (mounted) {
          setConsultations(cJson);
          setAvailability(aJson);
        }
      } catch {
        // silencioso
      }
    }
    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const esperando = consultations.filter((c) => c.estado === "esperando");
  const hoy = consultations.filter((c) => c.estado !== "rechazada");

  async function toggleActivo() {
    if (!availability) return;
    const res = await fetch("/api/admin/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !availability.activo }),
    });
    setAvailability(await res.json());
  }

  async function actualizarDia(dia: Weekday, patch: Partial<AvailabilityConfig["horarioSemanal"][Weekday]>) {
    if (!availability) return;
    const nuevo = {
      ...availability,
      horarioSemanal: {
        ...availability.horarioSemanal,
        [dia]: { ...availability.horarioSemanal[dia], ...patch },
      },
    };
    const res = await fetch("/api/admin/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo),
    });
    setAvailability(await res.json());
  }

  async function atender(id: string) {
    const res = await fetch(`/api/consultations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "lista" }),
    });
    const updated = await res.json();
    setConsultations((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  return (
    <main className="min-h-screen bg-bgsoft">
      <div className="border-b border-line bg-white px-5 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Consultorio Online</h1>
            <p className="text-sm text-muted">Dr. {doctorProfile.nombre}</p>
          </div>
          <Link href="/" className="text-sm text-muted hover:text-ink">
            Ver web pública
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        {/* ALERTA NUEVA CONSULTA */}
        {esperando.length > 0 && (
          <div className="animate-fadeIn rounded-xl2 border border-amber-200 bg-amber-50 p-5">
            <div className="mb-3 flex items-center gap-2 text-amber-800">
              <IconBell className="h-5 w-5" />
              <span className="font-semibold">
                {esperando.length === 1 ? "Nueva consulta" : `${esperando.length} consultas esperando`}
              </span>
            </div>
            <div className="space-y-3">
              {esperando.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 rounded-xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-ink">{c.paciente.nombre} está esperando.</p>
                    <p className="text-sm text-muted">
                      Consulta de {c.duracionMinutos} minutos · Pago confirmado: ${c.precio.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <button className="btn-primary shrink-0" onClick={() => atender(c.id)}>
                    Atender
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ESTADO ACTUAL */}
        {availability && (
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Estado actual</span>
              <button
                className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
                onClick={() => setMostrarConfig((v) => !v)}
              >
                {mostrarConfig ? "Ocultar configuración" : "Configurar horarios"}
              </button>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${availability.activo ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="text-lg font-medium text-ink">
                  {availability.activo ? "Disponible" : "No disponible"}
                </span>
              </div>
              <button className="btn-secondary !py-2 !px-4 text-xs" onClick={toggleActivo}>
                {availability.activo ? "Desactivar disponibilidad" : "Activar disponibilidad"}
              </button>
            </div>

            {mostrarConfig && (
              <div className="animate-fadeIn space-y-2 border-t border-line pt-4">
                {DIAS.map((d) => {
                  const cfg = availability.horarioSemanal[d.key];
                  return (
                    <div key={d.key} className="flex items-center gap-3 text-sm">
                      <label className="flex w-24 items-center gap-2 text-ink">
                        <input
                          type="checkbox"
                          checked={cfg.habilitado}
                          onChange={(e) => actualizarDia(d.key, { habilitado: e.target.checked })}
                        />
                        {d.label}
                      </label>
                      <input
                        type="time"
                        value={cfg.inicio}
                        disabled={!cfg.habilitado}
                        onChange={(e) => actualizarDia(d.key, { inicio: e.target.value })}
                        className="rounded-lg border border-line px-2 py-1 text-xs disabled:opacity-40"
                      />
                      <span className="text-muted">a</span>
                      <input
                        type="time"
                        value={cfg.fin}
                        disabled={!cfg.habilitado}
                        onChange={(e) => actualizarDia(d.key, { fin: e.target.value })}
                        className="rounded-lg border border-line px-2 py-1 text-xs disabled:opacity-40"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONSULTAS DE HOY */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Consultas</h2>
          {hoy.length === 0 ? (
            <div className="card text-center text-sm text-muted">Todavía no hay consultas registradas.</div>
          ) : (
            <div className="space-y-2.5">
              {hoy.map((c) => {
                const estado = ESTADO_LABEL[c.estado];
                return (
                  <Link
                    key={c.id}
                    href={`/admin/consulta/${c.id}`}
                    className="card flex items-center justify-between !p-4 transition-colors hover:border-navy/30"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {c.hora} — {c.paciente.nombre}
                      </p>
                      <p className="text-sm text-muted">${c.precio.toLocaleString("es-AR")}</p>
                    </div>
                    <span className={`flex items-center gap-2 text-sm font-medium ${estado.textClassName}`}>
                      <span className={`h-2 w-2 rounded-full ${estado.dotClassName}`} />
                      {estado.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}