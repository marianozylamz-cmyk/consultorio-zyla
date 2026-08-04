"use client";

import { useState } from "react";
import { doctorProfile } from "@/data/doctorProfile";
import { CertificateInput } from "@/types";

interface Props {
  consultationId: string;
  pacienteNombre: string;
  onCerrar: () => void;
  onCreado: () => void;
}

const CAMPO_INICIAL: CertificateInput = {
  motivo: "",
  diagnostico: "",
  tratamiento: "",
  periodoInvalidez: "",
  destinatario: "",
  observaciones: "",
};

export function CertificadoModal({ consultationId, pacienteNombre, onCerrar, onCreado }: Props) {
  const [datos, setDatos] = useState<CertificateInput>(CAMPO_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matriculaFalta = !doctorProfile.matricula;

  function actualizar(campo: keyof CertificateInput, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  async function crear() {
    if (!datos.diagnostico.trim()) {
      setError("El diagnóstico es obligatorio.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/${consultationId}/certificado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo generar el certificado.");
        setEnviando(false);
        return;
      }
      onCreado();
    } catch {
      setError("No se pudo generar el certificado. Probá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-5">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-soft sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Crear certificado</h2>
          <button onClick={onCerrar} className="text-2xl leading-none text-muted hover:text-ink">
            ×
          </button>
        </div>

        {matriculaFalta && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Falta cargar la matrícula del médico (<code>data/doctorProfile.ts</code>) — no se puede emitir un
            certificado sin ese dato.
          </div>
        )}

        {/* Datos que ya se completan solos */}
        <div className="mb-5 rounded-xl bg-bgsoft p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Se completa automático</p>
          <div className="grid grid-cols-2 gap-y-1.5 text-ink/80">
            <span className="text-muted">Paciente</span>
            <span>{pacienteNombre}</span>
            <span className="text-muted">Modalidad</span>
            <span>Consulta virtual</span>
            <span className="text-muted">Médico</span>
            <span>Dr. {doctorProfile.nombre}</span>
            <span className="text-muted">Matrícula</span>
            <span>{doctorProfile.matricula ?? "— sin cargar —"}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Motivo de consulta</label>
            <input
              className="input-field"
              value={datos.motivo}
              onChange={(e) => actualizar("motivo", e.target.value)}
              placeholder="Ej: control clínico, síntomas respiratorios..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Diagnóstico <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={datos.diagnostico}
              onChange={(e) => actualizar("diagnostico", e.target.value)}
              placeholder="Diagnóstico del paciente"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Tratamiento indicado</label>
            <textarea
              className="input-field min-h-[70px] resize-y"
              value={datos.tratamiento}
              onChange={(e) => actualizar("tratamiento", e.target.value)}
              placeholder="Indicaciones para el paciente"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Período de invalidez laboral</label>
            <input
              className="input-field"
              value={datos.periodoInvalidez}
              onChange={(e) => actualizar("periodoInvalidez", e.target.value)}
              placeholder="Ej: del 03/08 al 06/08 (3 días) — dejar vacío si no corresponde"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Empresa / institución destino</label>
            <input
              className="input-field"
              value={datos.destinatario}
              onChange={(e) => actualizar("destinatario", e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Observaciones</label>
            <textarea
              className="input-field min-h-[60px] resize-y"
              value={datos.observaciones}
              onChange={(e) => actualizar("observaciones", e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button onClick={onCerrar} className="btn-secondary flex-1" disabled={enviando}>
            Cancelar
          </button>
          <button onClick={crear} className="btn-primary flex-1" disabled={enviando || matriculaFalta}>
            {enviando ? "Generando…" : "Generar certificado"}
          </button>
        </div>
      </div>
    </div>
  );
}
