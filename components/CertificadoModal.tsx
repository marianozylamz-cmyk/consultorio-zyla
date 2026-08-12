'use client';

import { useState } from 'react';
import { doctorProfile } from '@/data/doctorProfile';
import { CertificateInput } from '@/types';

interface Props {
  consultationId: string;
  pacienteNombre: string;
  pacienteEmail: string; // NUEVO: para enviar certificado por email
  onCerrar: () => void;
  onCreado: () => void;
}

const CAMPO_INICIAL: CertificateInput = {
  motivo: '',
  diagnostico: '',
  tratamiento: '',
  periodoInvalidez: '',
  destinatario: '',
  observaciones: '',
};

export function CertificadoModal({
  consultationId,
  pacienteNombre,
  pacienteEmail,
  onCerrar,
  onCreado,
}: Props) {
  const [datos, setDatos] = useState<CertificateInput>(CAMPO_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const matriculaFalta = !doctorProfile.matricula;

  function actualizar(campo: keyof CertificateInput, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  async function crear() {
    if (!datos.diagnostico.trim()) {
      setError('El diagnóstico es obligatorio.');
      return;
    }
    setEnviando(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/consultations/${consultationId}/certificado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...datos,
          pacienteEmail, // NUEVO: para que el backend envíe por email
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'No se pudo generar el certificado.');
        setEnviando(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onCreado();
      }, 1500);
    } catch (err) {
      console.error(err);
      setError('No se pudo generar el certificado. Probá de nuevo.');
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2C3E50]/40 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] sm:max-w-lg sm:rounded-2xl">
        {/* ENCABEZADO */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#2C3E50]">Generar certificado</h2>
          <button
            onClick={onCerrar}
            className="text-2xl leading-none text-[#7A8499] transition-colors hover:text-[#2C3E50] hover:bg-[#F4EFE4] w-8 h-8 flex items-center justify-center rounded-lg"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* ALERTA: Matrícula falta */}
        {matriculaFalta && (
          <div className="alert alert-warning mb-6">
            ⚠️ Falta cargar la matrícula del médico en{' '}
            <code className="text-red-600">data/doctorProfile.ts</code> — no se puede emitir un
            certificado sin ese dato.
          </div>
        )}

        {/* ÉXITO */}
        {success && (
          <div className="alert alert-success mb-6 animate-fadeIn">
            ✓ Certificado generado y enviado a <strong>{pacienteEmail}</strong>
          </div>
        )}

        {/* Datos prefabricados */}
        <div className="mb-6 rounded-xl bg-[#F4EFE4] p-4 text-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#7A8499]">
            Se completa automático
          </p>
          <div className="grid grid-cols-2 gap-y-2.5 text-[#172033]">
            <span className="text-xs font-semibold text-[#7A8499]">Paciente</span>
            <span className="font-semibold">{pacienteNombre}</span>
            <span className="text-xs font-semibold text-[#7A8499]">Email</span>
            <span className="font-semibold text-[#1B6E5C] break-all">{pacienteEmail}</span>
            <span className="text-xs font-semibold text-[#7A8499]">Médico</span>
            <span className="font-semibold">Dr. {doctorProfile.nombre}</span>
            <span className="text-xs font-semibold text-[#7A8499]">Matrícula</span>
            <span className="font-semibold">{doctorProfile.matricula ?? '—'}</span>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#2C3E50]">
              Motivo de consulta
            </label>
            <input
              className="input-field"
              value={datos.motivo}
              onChange={(e) => actualizar('motivo', e.target.value)}
              placeholder="Ej: control clínico, síntomas respiratorios..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#2C3E50]">
              Diagnóstico <span className="text-[#E8837A] font-semibold">*</span>
            </label>
            <textarea
              className="input-field min-h-[100px] resize-y"
              value={datos.diagnostico}
              onChange={(e) => actualizar('diagnostico', e.target.value)}
              placeholder="Describe el diagnóstico del paciente..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#2C3E50]">
              Tratamiento indicado
            </label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={datos.tratamiento}
              onChange={(e) => actualizar('tratamiento', e.target.value)}
              placeholder="Medicamentos e indicaciones..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#2C3E50]">
              Período de invalidez laboral
            </label>
            <input
              className="input-field"
              value={datos.periodoInvalidez}
              onChange={(e) => actualizar('periodoInvalidez', e.target.value)}
              placeholder="Ej: del 03/08 al 06/08 (3 días) — dejar vacío si no corresponde"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#2C3E50]">
              Empresa / institución destino
            </label>
            <input
              className="input-field"
              value={datos.destinatario}
              onChange={(e) => actualizar('destinatario', e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#2C3E50]">Observaciones</label>
            <textarea
              className="input-field min-h-[70px] resize-y"
              value={datos.observaciones}
              onChange={(e) => actualizar('observaciones', e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        {/* ERRORES */}
        {error && !success && (
          <div className="alert alert-error mt-6">
            {error}
          </div>
        )}

        {/* BOTONES */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={onCerrar}
            className="btn-secondary flex-1"
            disabled={enviando || success}
          >
            Cancelar
          </button>
          <button
            onClick={crear}
            className="btn-primary flex-1"
            disabled={enviando || matriculaFalta || success}
          >
            {enviando ? 'Generando...' : success ? '✓ Enviado' : 'Generar y enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}