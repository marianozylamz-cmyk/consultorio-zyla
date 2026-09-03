'use client';

import { useState } from 'react';
import { doctorProfile } from '@/data/doctorProfile';
import { useModalA11y } from '@/lib/useModalA11y';

interface Props {
  consultationId: string;
  onCerrar: () => void;
  onCreado: () => void;
}

export function SolicitudEstudiosModal({ consultationId, onCerrar, onCreado }: Props) {
  const [estudios, setEstudios] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { contenedorRef, onBackdropClick } = useModalA11y(onCerrar);

  const matriculaFalta = !doctorProfile.matricula;

  async function generar() {
    if (!estudios.trim()) {
      setError('Escribí qué estudios pedís antes de generar el documento.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/${consultationId}/solicitud-estudios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudios, motivo: motivo || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'No se pudo generar el documento.');
        setEnviando(false);
        return;
      }
      onCreado();
    } catch (err) {
      console.error(err);
      setError('No se pudo generar el documento. Probá de nuevo.');
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2C3E50]/40 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={onBackdropClick}
    >
      <div
        ref={contenedorRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="solicitud-estudios-titulo"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="solicitud-estudios-titulo" className="text-2xl font-bold text-[#2C3E50]">
            Solicitar estudios complementarios
          </h2>
          <button
            onClick={onCerrar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-2xl leading-none text-muted transition-colors hover:bg-[#F4EFE4] hover:text-[#2C3E50]"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {matriculaFalta && (
          <div className="alert alert-warning mb-6">
            ⚠️ Falta cargar la matrícula del médico en{' '}
            <code className="text-red-600">data/doctorProfile.ts</code> — no se puede emitir un
            documento sin ese dato.
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#2C3E50]">
              Motivo / orientación diagnóstica
            </label>
            <input
              className="input-field"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#2C3E50]">
              Estudios solicitados <span className="text-[#AC615A] font-semibold">*</span>
            </label>
            <textarea
              className="input-field min-h-[160px] resize-y"
              value={estudios}
              onChange={(e) => setEstudios(e.target.value)}
              placeholder="Ej: Laboratorio completo, radiografía de tórax..."
              autoFocus
            />
          </div>
        </div>

        {error && <div className="alert alert-error mt-6">{error}</div>}

        <div className="mt-8 flex gap-3">
          <button onClick={onCerrar} className="btn-secondary flex-1" disabled={enviando}>
            Cancelar
          </button>
          <button onClick={generar} className="btn-primary flex-1" disabled={enviando || matriculaFalta}>
            {enviando ? 'Generando...' : 'Generar documento'}
          </button>
        </div>
      </div>
    </div>
  );
}
