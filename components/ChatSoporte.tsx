"use client";

import { useEffect, useState } from "react";
import { MensajeSoporte, Patient } from "@/types";

interface Props {
  consultationId: string;
  paciente: Patient;
}

const POLL_MS = 12000;

function formatHora(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Chat simple entre paciente y médico dentro de UNA consulta ya creada —
 * sin cuentas de ningún lado, el id de la consulta (largo, no adivinable)
 * es la autorización. Vive colapsado por defecto; solo pollea mientras
 * está abierto, para no sumar tráfico de fondo en pantallas que ya pollean
 * la consulta por su cuenta (ej. /espera).
 *
 * Se usa igual en ResumenPendiente, ResumenRechazada y /espera — un solo
 * lugar para esta pieza, nada de UI duplicada entre esas tres pantallas.
 */
export function ChatSoporte({ consultationId, paciente }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeSoporte[] | null>(null);
  const [texto, setTexto] = useState("");
  const [telefono, setTelefono] = useState(paciente.whatsapp);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esPrimerMensaje = mensajes !== null && mensajes.length === 0;
  const hayNoLeidos = (mensajes ?? []).some((m) => m.autor === "medico" && !m.leidoPorPaciente);

  async function cargar() {
    try {
      const res = await fetch(`/api/consultations/${consultationId}`, { cache: "no-store" });
      if (!res.ok) return;
      const c = await res.json();
      setMensajes(c.mensajes ?? []);
    } catch {
      // reintenta en el próximo poll
    }
  }

  useEffect(() => {
    if (!abierto) return;
    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  // Al abrir, si hay mensajes del médico sin leer, se marcan leídos.
  useEffect(() => {
    if (!abierto || !mensajes) return;
    if (!mensajes.some((m) => m.autor === "medico" && !m.leidoPorPaciente)) return;
    fetch(`/api/consultations/${consultationId}/mensajes/leido-paciente`, { method: "POST" }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, mensajes]);

  async function enviar() {
    const textoLimpio = texto.trim();
    if (!textoLimpio || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/${consultationId}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: textoLimpio,
          ...(esPrimerMensaje ? { telefonoContacto: telefono.trim() || undefined } : {}),
        }),
      });
      if (!res.ok) {
        setError("No se pudo enviar el mensaje. Probá de nuevo.");
        return;
      }
      const actualizada = await res.json();
      setMensajes(actualizada.mensajes ?? []);
      setTexto("");
    } catch {
      setError("No se pudo enviar el mensaje. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="mt-6 flex w-full items-center justify-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        ¿Algo no anduvo? Escribinos acá
        {hayNoLeidos && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
      </button>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-line p-4 text-left">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Escribinos</p>
        <button onClick={() => setAbierto(false)} className="text-xs text-muted hover:text-ink">
          Cerrar
        </button>
      </div>

      {mensajes === null ? (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy border-t-transparent" />
        </div>
      ) : (
        <>
          {mensajes.length > 0 && (
            <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
              {mensajes.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.autor === "medico" ? "bg-skyfaint text-ink" : "ml-6 bg-navy text-white"
                  }`}
                >
                  <p>{m.texto}</p>
                  <p className={`mt-1 text-[11px] ${m.autor === "medico" ? "text-muted" : "text-white/70"}`}>
                    {m.autor === "medico" ? "Dr. Zyla" : "Vos"} · {formatHora(m.creadoEn)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {esPrimerMensaje && (
            <div className="mb-3 space-y-2">
              <p className="text-xs text-muted">
                Vas a escribir como <strong>{paciente.nombre}</strong> (DNI {paciente.dni}).
              </p>
              <div>
                <label className="mb-1 block text-xs text-muted">Teléfono de contacto</label>
                <input
                  className="input-field"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Tu WhatsApp o teléfono"
                />
              </div>
            </div>
          )}

          <textarea
            className="input-field min-h-[70px] resize-y text-sm"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí tu mensaje..."
          />

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <button
            className="btn-primary mt-3 w-full !py-2.5 text-sm"
            disabled={enviando || !texto.trim()}
            onClick={enviar}
          >
            {enviando ? "Enviando…" : "Enviar"}
          </button>
        </>
      )}
    </div>
  );
}
