"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doctorProfile } from "@/data/doctorProfile";
import { Consultation } from "@/types";
import { formatFechaLargaAR } from "@/lib/availability";
import { quitarMiConsulta } from "@/lib/misConsultas";

/**
 * Tarjeta de "ya tenías una reserva en curso" — para cuando el paciente
 * vuelve del checkout de Mercado Pago sin pagar (o vuelve a entrar más
 * tarde, desde el link del mail o desde este mismo navegador) y su
 * consulta sigue en pendiente_pago. Reusa el endpoint de checkout
 * existente, nunca crea una consulta nueva. Sondea cada 5s por si el
 * médico la marca pagada a mano o llega la confirmación de Mercado Pago
 * mientras el paciente está mirando esta pantalla.
 */
export function ResumenPendiente({
  consultation,
  onActualizado,
  onNuevaReserva,
}: {
  consultation: Consultation;
  onActualizado: (c: Consultation) => void;
  onNuevaReserva: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modoPago, setModoPago] = useState<"mercadopago" | "mock" | null>(null);

  const tipo = doctorProfile.consultaOnline.tipos.find((t) => t.id === consultation.tipoConsulta);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/consultations/${consultation.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const actual: Consultation = await res.json();
        if (actual.estado !== "pendiente_pago") onActualizado(actual);
      } catch {
        // reintenta en el próximo tick
      }
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultation.id]);

  async function continuarPago() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/${consultation.id}/checkout`, { method: "POST" });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setEnviando(false);
        return;
      }
      if (json.modo === "mercadopago" && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      setModoPago("mock");
      setEnviando(false);
    } catch {
      setError("No pudimos continuar con el pago. Probá de nuevo.");
      setEnviando(false);
    }
  }

  async function simularPagoMock(resultado: "aprobado" | "rechazado") {
    setEnviando(true);
    try {
      const res = await fetch(`/api/consultations/${consultation.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forzarResultado: resultado }),
      });
      const json = await res.json();
      if (json.consultation) onActualizado(json.consultation);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-line px-5 py-5">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/" className="text-sm text-muted hover:text-ink">
            ← Volver
          </Link>
          <div className="text-sm font-medium text-ink">Dr. Juan Manuel Zyla</div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 py-10">
        <h1 className="text-2xl font-semibold text-ink">Tenés un pago pendiente</h1>
        <p className="mt-1 text-[15px] text-muted">
          Ya habías empezado a reservar esta consulta. Completá el pago para confirmarla.
        </p>

        <div className="card mt-8 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Tipo de consulta</span>
            <span className="text-ink">{tipo?.nombre ?? consultation.tipoConsulta}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Fecha</span>
            <span className="text-ink">
              {consultation.esAhora ? "Ahora" : formatFechaLargaAR(consultation.fecha)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Hora</span>
            <span className="text-ink">{consultation.hora}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <span className="font-medium text-ink">Precio</span>
            <span className="font-semibold text-navy">${consultation.precio.toLocaleString("es-AR")}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {modoPago !== "mock" && (
            <button className="btn-primary w-full" disabled={enviando} onClick={continuarPago}>
              {enviando ? "Procesando…" : "Continuar con el pago"}
            </button>
          )}

          {modoPago === "mock" && (
            <>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                Mercado Pago no está configurado todavía — estás en modo de prueba local.
              </div>
              <button
                className="btn-primary w-full"
                disabled={enviando}
                onClick={() => simularPagoMock("aprobado")}
              >
                {enviando ? "Procesando pago…" : "(Demo) Simular pago aprobado"}
              </button>
              <button
                className="w-full text-center text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
                disabled={enviando}
                onClick={() => simularPagoMock("rechazado")}
              >
                (Demo) Simular pago rechazado
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Si ya pagaste por otro medio (transferencia, efectivo), el médico lo va a confirmar y esta
          pantalla se va a actualizar sola.
        </p>

        <button
          className="mt-8 w-full text-center text-sm text-muted hover:text-ink"
          onClick={() => {
            quitarMiConsulta(consultation.id);
            onNuevaReserva();
          }}
        >
          ¿No era esto? Hacer una reserva nueva
        </button>
      </div>
    </main>
  );
}
