"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Consultation } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";
import { IconCheck, IconWhatsApp } from "@/components/icons";
import { formatFechaLargaAR } from "@/lib/availability";
import { linkWhatsAppConsultorio } from "@/lib/whatsapp";

// Si a los 3 minutos el médico todavía no atendió, mostramos una salida —
// sin esto, un paciente esperando de más no tiene ninguna alternativa
// dentro de la página más que quedarse mirando el spinner.
const ESPERA_LARGA_MS = 3 * 60 * 1000;

export default function SalaDeEspera({ params }: { params: { id: string } }) {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [error, setError] = useState(false);
  const [esperaLarga, setEsperaLarga] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function poll() {
      try {
        const res = await fetch(`/api/consultations/${params.id}`, { cache: "no-store" });
        if (!res.ok) {
          if (mounted) setError(true);
          return;
        }
        const json = await res.json();
        if (mounted) setConsultation(json);
      } catch {
        if (mounted) setError(true);
      }
    }
    poll();
    const interval = setInterval(poll, 3000);
    const timeoutLarga = setTimeout(() => {
      if (mounted) setEsperaLarga(true);
    }, ESPERA_LARGA_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(timeoutLarga);
    };
  }, [params.id]);

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-muted">No pudimos encontrar esta consulta.</p>
        <Link href="/" className="text-sm text-navy underline-offset-2 hover:underline">
          Volver al inicio
        </Link>
      </main>
    );
  }

  if (!consultation) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </main>
    );
  }

  const lista = consultation.estado === "lista" || consultation.estado === "en_consulta";

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5">
      <div className="w-full max-w-md animate-fadeIn text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
          <IconCheck className="h-4 w-4" />
          Consulta confirmada
        </div>

        <h1 className="text-xl font-semibold text-ink">Dr. {doctorProfile.nombre}</h1>
        <p className="mt-1 text-[15px] text-muted">{doctorProfile.especialidad}</p>

        <div className="card mt-8 divide-y divide-line text-left">
          <div className="grid grid-cols-2 gap-y-2.5 pb-4 text-sm">
            <span className="text-muted">Fecha</span>
            <span className="text-right text-ink">{formatFechaLargaAR(consultation.fecha)}</span>
            <span className="text-muted">Hora</span>
            <span className="text-right text-ink">{consultation.hora} hs.</span>
            <span className="text-muted">Médico</span>
            <span className="text-right text-ink">Dr. {doctorProfile.nombre}</span>
          </div>

          <div className="pt-4">
            {lista ? (
              <>
                <div className="mb-3 flex items-center justify-center gap-2 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulseSoft" />
                  <span className="text-sm font-medium">El Dr. Zyla está listo para atenderte.</span>
                </div>
                <a
                  href={doctorProfile.videollamadaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full"
                >
                  Entrar a la consulta
                </a>
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-center gap-2 text-amber-600">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulseSoft" />
                  <span className="text-sm font-medium">Esperando al médico</span>
                </div>
                <p className="text-sm text-muted">
                  El Dr. Zyla fue notificado. Quedate en esta página: el botón para entrar va a
                  aparecer apenas esté listo para atenderte.
                </p>
                {esperaLarga && (
                  <div className="mt-4 animate-fadeIn rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    ¿Está tardando más de lo esperado?{" "}
                    <a
                      href={linkWhatsAppConsultorio(
                        `Hola, soy ${consultation.paciente.nombre}. Reservé una consulta online para el ${consultation.fecha} a las ${consultation.hora} y sigo esperando que me atiendan.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium underline underline-offset-2"
                    >
                      <IconWhatsApp className="h-4 w-4" />
                      Escribinos por WhatsApp
                    </a>
                    .
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <Link href="/" className="mt-6 inline-block text-sm text-muted hover:text-ink">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}