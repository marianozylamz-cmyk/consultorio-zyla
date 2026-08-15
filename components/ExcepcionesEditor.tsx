"use client";

import { useState } from "react";
import { AvailabilityOverride } from "@/types";
import { formatFechaLargaAR, rangoHorarioValido, toISODate } from "@/lib/availability";

interface Props {
  excepciones: AvailabilityOverride[];
  onGuardar: (excepciones: AvailabilityOverride[]) => Promise<void>;
}

// ==========================================================
// Excepciones puntuales por fecha: feriados (cerrar un día que
// normalmente está habilitado) o aperturas especiales (abrir un
// día que normalmente está cerrado, ej. un domingo). No tocan el
// horario semanal recurrente — son ajustes de una fecha concreta.
// Ver AvailabilityOverride en types/index.ts y
// getEffectiveScheduleForDate en lib/availability.ts, que ya sabe
// leer esto; acá solo faltaba la pantalla para cargarlas.
// ==========================================================

export function ExcepcionesEditor({ excepciones, onGuardar }: Props) {
  const [fecha, setFecha] = useState("");
  const [modo, setModo] = useState<"cerrado" | "especial">("cerrado");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [guardando, setGuardando] = useState(false);

  const hoy = toISODate(new Date());
  const proximas = [...excepciones]
    .filter((e) => e.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // "Abrir con horario especial" exige inicio y fin explícitos — si se
  // dejara caer al horario habitual de ese día de la semana, un día
  // normalmente cerrado (que guarda 00:00–00:00 como placeholder) se
  // "abriría" sin que aparezca ningún turno, sin ningún aviso de por qué.
  const rangoIncompleto = modo === "especial" && (!inicio || !fin);
  const rangoInvalido = modo === "especial" && !!inicio && !!fin && !rangoHorarioValido(inicio, fin);
  const puedeAgregar = !!fecha && !rangoIncompleto && !rangoInvalido;

  async function agregar() {
    if (!puedeAgregar) return;
    setGuardando(true);
    try {
      const nueva: AvailabilityOverride =
        modo === "cerrado"
          ? { fecha, cerrado: true }
          : { fecha, cerrado: false, inicio, fin };
      // Si ya había una excepción para esa fecha, la reemplaza.
      const sinDuplicado = excepciones.filter((e) => e.fecha !== fecha);
      await onGuardar([...sinDuplicado, nueva]);
      setFecha("");
      setInicio("");
      setFin("");
      setModo("cerrado");
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(fechaAQuitar: string) {
    setGuardando(true);
    try {
      await onGuardar(excepciones.filter((e) => e.fecha !== fechaAQuitar));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="border-t border-line pt-4">
      <p className="mb-1 text-sm font-medium text-ink">Excepciones (feriados / aperturas puntuales)</p>
      <p className="mb-4 text-xs text-muted">
        Para una fecha concreta, sin afectar el horario semanal habitual. Ej: cerrar un lunes feriado, o
        abrir un domingo puntual.
      </p>

      {proximas.length > 0 && (
        <div className="mb-4 space-y-2">
          {proximas.map((e) => (
            <div
              key={e.fecha}
              className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium text-ink">{formatFechaLargaAR(e.fecha)}</span>{" "}
                <span className="text-muted">
                  {e.cerrado ? "— cerrado" : `— abierto ${e.inicio} a ${e.fin}`}
                </span>
              </div>
              <button
                className="text-xs text-muted underline-offset-2 hover:text-red-600 hover:underline"
                disabled={guardando}
                onClick={() => quitar(e.fecha)}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div>
          <label className="mb-1 block text-xs text-muted">Fecha</label>
          <input
            type="date"
            min={hoy}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-line px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">Tipo</label>
          <select
            value={modo}
            onChange={(e) => setModo(e.target.value as "cerrado" | "especial")}
            className="rounded-lg border border-line px-2 py-1.5 text-sm"
          >
            <option value="cerrado">Cerrar este día</option>
            <option value="especial">Abrir con horario especial</option>
          </select>
        </div>

        {modo === "especial" && (
          <>
            <div>
              <label className="mb-1 block text-xs text-muted">Desde</label>
              <input
                type="time"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="rounded-lg border border-line px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Hasta</label>
              <input
                type="time"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className="rounded-lg border border-line px-2 py-1.5 text-sm"
              />
            </div>
          </>
        )}

        <button
          className="btn-secondary !py-2 !px-4 text-xs"
          disabled={!puedeAgregar || guardando}
          onClick={agregar}
        >
          Agregar
        </button>
      </div>

      {modo === "especial" && (
        <p className="mt-2 text-xs text-muted">
          {rangoInvalido
            ? "El horario de cierre tiene que ser posterior al de inicio."
            : "Un día especial necesita su propio horario — aunque ese día normalmente esté cerrado."}
        </p>
      )}
    </div>
  );
}
