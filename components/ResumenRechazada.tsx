"use client";

import Link from "next/link";
import { doctorProfile } from "@/data/doctorProfile";
import { Consultation } from "@/types";
import { ChatSoporte } from "./ChatSoporte";

/** Pantalla de cierre para cuando el pago nunca se confirmó (rechazado, o expiró sin completarse). */
export function ResumenRechazada({
  consultation,
  onNuevaReserva,
}: {
  consultation: Consultation;
  onNuevaReserva: () => void;
}) {
  const tipo = doctorProfile.consultaOnline.tipos.find((t) => t.id === consultation.tipoConsulta);
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

      <div className="mx-auto max-w-lg px-5 py-10 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700">
          No pudimos confirmar el pago
        </div>
        <h1 className="text-xl font-semibold text-ink">
          Tu reserva de {tipo?.nombre ?? "consulta"} no se pudo confirmar
        </h1>
        <p className="mt-3 text-[15px] text-muted">
          El horario quedó liberado para otro paciente. Si todavía querés tu consulta, hacé una reserva
          nueva.
        </p>
        <button className="btn-primary mt-8 w-full" onClick={onNuevaReserva}>
          Hacer una reserva nueva
        </button>

        <ChatSoporte consultationId={consultation.id} paciente={consultation.paciente} />
      </div>
    </main>
  );
}
