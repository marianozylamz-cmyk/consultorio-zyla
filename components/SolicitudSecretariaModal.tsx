"use client";

import { useState } from "react";
import { doctorProfile } from "@/data/doctorProfile";
import { Consultation } from "@/types";
import { useModalA11y } from "@/lib/useModalA11y";
import { linkWhatsAppConsultorio } from "@/lib/whatsapp";
import { IconWhatsApp } from "@/components/icons";

interface Props {
  consultation: Consultation;
  onCerrar: () => void;
}

// ==========================================================
// La secretaría sigue trabajando manualmente — esto NO automatiza
// nada, solo arma el mensaje de WhatsApp con los datos ya
// conocidos para que Juan no tenga que tipearlos de nuevo.
// ==========================================================

export function SolicitudSecretariaModal({ consultation, onCerrar }: Props) {
  const [medicamento, setMedicamento] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const { contenedorRef, onBackdropClick } = useModalA11y(onCerrar);

  // Este mensaje lo manda el MÉDICO a la secretaria desde su propio
  // WhatsApp — no puede estar redactado como si lo escribiera el paciente.
  function construirMensaje() {
    const lineas = [
      "Hola, necesito que le envíes una receta a:",
      "",
      `Paciente: ${consultation.paciente.nombre}`,
      `DNI: ${consultation.paciente.dni}`,
      `WhatsApp: ${consultation.paciente.whatsapp}`,
      `Email: ${consultation.paciente.email}`,
      "",
      `Le indiqué: ${medicamento}.`,
    ];
    if (indicaciones) lineas.push(indicaciones);
    lineas.push(
      "",
      "Por favor, preparale/enviale la receta correspondiente.",
      "Si necesitás algún dato adicional o información de su obra social, podés comunicarte con el paciente."
    );
    return lineas.join("\n");
  }

  function enviar() {
    if (!medicamento.trim()) return;
    window.open(linkWhatsAppConsultorio(construirMensaje()), "_blank");
    onCerrar();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-5"
      onClick={onBackdropClick}
    >
      <div
        ref={contenedorRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="secretaria-titulo"
        className="w-full rounded-t-2xl bg-white p-5 shadow-soft sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="secretaria-titulo" className="text-lg font-semibold text-ink">Solicitar receta a secretaría</h2>
          <button onClick={onCerrar} className="text-2xl leading-none text-muted hover:text-ink" aria-label="Cerrar">
            ×
          </button>
        </div>

        <p className="mb-4 text-sm text-muted">
          Se arma el mensaje con los datos del paciente y se abre WhatsApp para que se lo mandes directo a
          secretaría ({doctorProfile.consultorio.whatsapp}).
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Medicamento solicitado</label>
            <input
              className="input-field"
              value={medicamento}
              onChange={(e) => setMedicamento(e.target.value)}
              placeholder="Ej: Amoxicilina 500mg x 21"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Indicaciones</label>
            <textarea
              className="input-field min-h-[70px] resize-y"
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              placeholder="Ej: cada 8hs por 7 días"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onCerrar} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={!medicamento.trim()}
            className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
          >
            <IconWhatsApp className="h-4 w-4" />
            Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
