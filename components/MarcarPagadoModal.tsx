'use client';

import { useState } from 'react';
import { useModalA11y } from '@/lib/useModalA11y';

interface Props {
  consultationId: string;
  onCerrar: () => void;
  onConfirmado: () => void;
}

const SUGERENCIAS = ['Transferencia', 'Efectivo', 'Cortesía'];

export function MarcarPagadoModal({ consultationId, onCerrar, onConfirmado }: Props) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { contenedorRef, onBackdropClick } = useModalA11y(onCerrar);

  async function confirmar() {
    if (!motivo.trim()) {
      setError('Escribí el motivo antes de confirmar.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/${consultationId}/marcar-pagado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'No se pudo marcar el pago.');
        setEnviando(false);
        return;
      }
      onConfirmado();
    } catch (err) {
      console.error(err);
      setError('No se pudo marcar el pago. Probá de nuevo.');
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
        aria-labelledby="marcar-pagado-titulo"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="marcar-pagado-titulo" className="text-2xl font-bold text-[#2C3E50]">
            Marcar como pagado
          </h2>
          <button
            onClick={onCerrar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-2xl leading-none text-muted transition-colors hover:bg-[#F4EFE4] hover:text-[#2C3E50]"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="mb-5 text-sm text-muted">
          Usalo cuando el pago se resolvió por fuera de Mercado Pago (transferencia, efectivo en el
          consultorio, cortesía). Queda registrado el motivo.
        </p>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#2C3E50]">
              Motivo <span className="text-[#AC615A] font-semibold">*</span>
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMotivo(s)}
                  className="rounded-full border border-line px-3 py-1 text-xs font-medium text-[#2C3E50] transition-colors hover:border-[#1B6E5C] hover:bg-[#F4EFE4]"
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              className="input-field"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Transferencia bancaria"
              autoFocus
            />
          </div>
        </div>

        {error && <div className="alert alert-error mt-6">{error}</div>}

        <div className="mt-8 flex gap-3">
          <button onClick={onCerrar} className="btn-secondary flex-1" disabled={enviando}>
            Cancelar
          </button>
          <button onClick={confirmar} className="btn-primary flex-1" disabled={enviando}>
            {enviando ? 'Confirmando...' : 'Confirmar pago manual'}
          </button>
        </div>
      </div>
    </div>
  );
}
