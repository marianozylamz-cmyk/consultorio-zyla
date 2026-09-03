"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Consultation, AvailabilityConfig, Weekday } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";
import { IconBell } from "@/components/icons";
import {
  esAtencionEspecialHoy,
  estaDentroDelHorarioHabitual,
  formatFechaCortaAR,
  rangoHorarioValido,
  toISODate,
} from "@/lib/availability";
import { ExcepcionesEditor } from "@/components/ExcepcionesEditor";
import { ESTADO_LABEL } from "@/lib/estadoLabels";

const DIAS: { key: Weekday; label: string }[] = [
  { key: "lun", label: "Lunes" },
  { key: "mar", label: "Martes" },
  { key: "mie", label: "Miércoles" },
  { key: "jue", label: "Jueves" },
  { key: "vie", label: "Viernes" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

export default function AdminDashboard() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [availability, setAvailability] = useState<AvailabilityConfig | null>(null);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const previousWaitingIds = useRef<Set<string>>(new Set());
  const [huboAlertaSonora, setHuboAlertaSonora] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorPoll, setErrorPoll] = useState(false);
  const [atendiendoId, setAtendiendoId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function poll() {
      try {
        const [cRes, aRes] = await Promise.all([
          fetch("/api/consultations", { cache: "no-store" }),
          fetch("/api/admin/availability", { cache: "no-store" }),
        ]);

        if (!cRes.ok || !aRes.ok) {
          if (mounted) setErrorPoll(true);
          return;
        }

        const cJson: Consultation[] = await cRes.json();
        const aJson: AvailabilityConfig = await aRes.json();

        const hoyISOPoll = toISODate(new Date());
        const waitingNow = new Set(
          cJson.filter((c) => c.estado === "esperando" && (c.esAhora || c.fecha === hoyISOPoll)).map((c) => c.id)
        );
        const hayNuevas = [...waitingNow].some((id) => !previousWaitingIds.current.has(id));
        if (hayNuevas && previousWaitingIds.current.size >= 0) {
          setHuboAlertaSonora(true);
          // Simulación de sonido/alerta de navegador (BrowserNotificationService)
        }
        previousWaitingIds.current = waitingNow;

        if (mounted) {
          setConsultations(cJson);
          setAvailability(aJson);
          setErrorPoll(false);
        }
      } catch {
        if (mounted) setErrorPoll(true);
      } finally {
        if (mounted) setCargando(false);
      }
    }
    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const hoyISO = toISODate(new Date());
  // El banner urgente ("está esperando", con botón Atender) es para cuando
  // hay alguien esperando DE VERDAD en este momento — atención inmediata, o
  // un turno agendado que ya llegó a su fecha. Un turno confirmado para
  // dentro de unos días también queda en estado "esperando" (el pago ya se
  // aprobó), pero mostrarlo acá con el mismo cartel de urgencia confundía:
  // parecía que había un paciente esperando ahora mismo cuando en realidad
  // faltaban días.
  const esperandoAhora = consultations.filter(
    (c) => c.estado === "esperando" && (c.esAhora || c.fecha === hoyISO)
  );
  // No es solo "de hoy" pese al nombre viejo: incluye cualquier fecha, por
  // eso cada item de la lista siempre muestra fecha además de hora.
  const listado = consultations.filter((c) => c.estado !== "rechazada");

  async function toggleActivo() {
    if (!availability) return;
    const activoHoy = esAtencionEspecialHoy(availability, new Date());
    // Al activar, guardamos la fecha de HOY (no un booleano suelto): así
    // el interruptor deja de tener efecto solo a la medianoche si el
    // médico se olvida de apagarlo — ver esAtencionEspecialHoy.
    const res = await fetch("/api/admin/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activoDesde: activoHoy ? null : toISODate(new Date()) }),
    });
    setAvailability(await res.json());
  }

  async function actualizarExcepciones(excepciones: AvailabilityConfig["excepciones"]) {
    if (!availability) return;
    const res = await fetch("/api/admin/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excepciones }),
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
    if (atendiendoId) return;
    setAtendiendoId(id);
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "lista" }),
      });
      const updated = await res.json();
      setConsultations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } finally {
      setAtendiendoId(null);
    }
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
        {errorPoll && (
          <div className="animate-fadeIn rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No se pudo actualizar la información — reintentando automáticamente. Si persiste, revisá tu
            conexión.
          </div>
        )}

        {/* ALERTA NUEVA CONSULTA */}
        {esperandoAhora.length > 0 && (
          <div className="animate-fadeIn rounded-xl2 border border-amber-200 bg-amber-50 p-5">
            <div className="mb-3 flex items-center gap-2 text-amber-800">
              <IconBell className="h-5 w-5" />
              <span className="font-semibold">
                {esperandoAhora.length === 1 ? "Nueva consulta" : `${esperandoAhora.length} consultas esperando`}
              </span>
            </div>
            <div className="space-y-3">
              {esperandoAhora.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 rounded-xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-ink">{c.paciente.nombre} está esperando.</p>
                    <p className="text-sm text-muted">
                      {doctorProfile.consultaOnline.tipos.find((t) => t.id === c.tipoConsulta)?.nombre ??
                        c.tipoConsulta}{" "}
                      · {c.duracionMinutos} minutos · Pago confirmado: ${c.precio.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <button
                    className="btn-primary shrink-0"
                    disabled={atendiendoId === c.id}
                    onClick={() => atender(c.id)}
                  >
                    {atendiendoId === c.id ? "Atendiendo…" : "Atender"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

     {/* ESTADO ACTUAL */}
        {availability && (() => {
          const dentroDeHorario = estaDentroDelHorarioHabitual(availability, new Date());
          const activoHoy = esAtencionEspecialHoy(availability, new Date());
          return (
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

              {dentroDeHorario ? (
                // Dentro del horario fijo de hoy: ya está cubierto por la
                // agenda normal. El interruptor manual no aplica acá, así
                // que ni se muestra — evita confundirlo con la agenda.
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-lg font-medium text-ink">Disponible por horario habitual</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${activoHoy ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className="text-lg font-medium text-ink">
                      {activoHoy ? "Atendiendo fuera de horario (solo hoy)" : "No disponible"}
                    </span>
                  </div>
                  <button className="btn-secondary self-start !py-2 !px-4 text-xs sm:self-auto" onClick={toggleActivo}>
                    {activoHoy ? "Desactivar atención especial" : "Atender fuera de horario"}
                  </button>
                </div>
              )}

            {mostrarConfig && (
              <div className="animate-fadeIn space-y-6 border-t border-line pt-4">
                <div className="space-y-2">
                  {DIAS.map((d) => {
                    const cfg = availability.horarioSemanal[d.key];
                    const rangoInvalido = cfg.habilitado && !rangoHorarioValido(cfg.inicio, cfg.fin);
                    return (
                      <div key={d.key} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
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
                          className={`rounded-lg border px-2 py-1 text-xs disabled:opacity-40 ${
                            rangoInvalido ? "border-red-300" : "border-line"
                          }`}
                        />
                        <span className="text-muted">a</span>
                        <input
                          type="time"
                          value={cfg.fin}
                          disabled={!cfg.habilitado}
                          onChange={(e) => actualizarDia(d.key, { fin: e.target.value })}
                          className={`rounded-lg border px-2 py-1 text-xs disabled:opacity-40 ${
                            rangoInvalido ? "border-red-300" : "border-line"
                          }`}
                        />
                        {rangoInvalido && (
                          <span className="text-xs text-red-600">termina antes de empezar</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <ExcepcionesEditor
                  excepciones={availability.excepciones}
                  onGuardar={actualizarExcepciones}
                />
              </div>
          )}
            </div>
          );
        })()}

        {/* CONSULTAS DE HOY */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Consultas</h2>
          {cargando ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-card !h-16" />
              ))}
            </div>
          ) : listado.length === 0 ? (
            <div className="card text-center text-sm text-muted">Todavía no hay consultas registradas.</div>
          ) : (
            <div className="space-y-2.5">
              {listado.map((c) => {
                const estado = ESTADO_LABEL[c.estado];
                const esHoy = c.esAhora || c.fecha === hoyISO;
                return (
                  <Link
                    key={c.id}
                    href={`/admin/consulta/${c.id}`}
                    className="card flex items-center justify-between !p-4 transition-colors hover:border-navy/30"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {esHoy ? "Hoy" : formatFechaCortaAR(c.fecha)} · {c.hora} — {c.paciente.nombre}
                      </p>
                      <p className="text-sm text-muted">
                        {doctorProfile.consultaOnline.tipos.find((t) => t.id === c.tipoConsulta)?.nombre ??
                          c.tipoConsulta}{" "}
                        · ${c.precio.toLocaleString("es-AR")}
                      </p>
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