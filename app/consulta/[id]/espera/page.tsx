"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Consultation, DocumentFile } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";
import { IconCheck, IconWhatsApp } from "@/components/icons";
import { formatFechaLargaAR } from "@/lib/availability";
import { linkWhatsAppConsultorio } from "@/lib/whatsapp";
import { DOCUMENT_TYPE_LABEL } from "@/lib/documentLabels";

// Si a los 3 minutos el médico todavía no atendió, mostramos una salida —
// sin esto, un paciente esperando de más no tiene ninguna alternativa
// dentro de la página más que quedarse mirando el spinner.
const ESPERA_LARGA_MS = 3 * 60 * 1000;

// Después de finalizada, si a los 5 minutos todavía no hay ni documentos
// ni mail enviado, mostramos la misma salida de WhatsApp — para que el
// paciente no se quede mirando la pantalla sin saber si tiene que esperar
// más o escribir.
const ESPERA_DOCS_MS = 5 * 60 * 1000;

/** Lista de documentos con descarga directa — no depende de que llegue el mail. */
function ListaDocumentos({
  documentos,
  recetaExternaUrl,
}: {
  documentos: DocumentFile[];
  recetaExternaUrl: string | null;
}) {
  if (documentos.length === 0 && !recetaExternaUrl) return null;
  return (
    <div className="mt-6 space-y-2 text-left">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">Tu documentación</p>
      {documentos.map((doc) => (
        <a
          key={doc.id}
          href={doc.dataUrl}
          download={doc.nombre}
          className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm transition-colors hover:border-navy/30"
        >
          <span className="text-ink">{DOCUMENT_TYPE_LABEL[doc.tipo]}</span>
          <span className="font-medium text-navy">Descargar</span>
        </a>
      ))}
      {recetaExternaUrl && (
        <a
          href={recetaExternaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm transition-colors hover:border-navy/30"
        >
          <span className="text-ink">Receta</span>
          <span className="font-medium text-navy">Ver</span>
        </a>
      )}
    </div>
  );
}

export default function SalaDeEspera({ params }: { params: { id: string } }) {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [error, setError] = useState(false);
  const [esperaLarga, setEsperaLarga] = useState(false);
  const [esperaDocsLarga, setEsperaDocsLarga] = useState(false);

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

  // Arranca recién cuando la consulta llega a "finalizada" — no desde que
  // se abre la página, que puede ser mucho antes de que termine la llamada.
  useEffect(() => {
    if (consultation?.estado !== "finalizada") return;
    const t = setTimeout(() => setEsperaDocsLarga(true), ESPERA_DOCS_MS);
    return () => clearTimeout(t);
  }, [consultation?.estado]);

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

  // Consulta ya finalizada: el paciente puede volver a esta misma página
  // (por el mail, por historial del navegador, al cerrar Google Meet, etc.)
  // — sin esto quedaba viendo un estado de espera que ya no correspondía a
  // nada, sin saber qué hacer.
  if (consultation.estado === "finalizada") {
    const hayAlgoParaMostrar = consultation.documentos.length > 0 || Boolean(consultation.recetaExternaUrl);
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12">
        <div className="w-full max-w-md animate-fadeIn text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
            <IconCheck className="h-4 w-4" />
            Consulta terminada
          </div>
          <h1 className="text-xl font-semibold text-ink">
            La consulta con el Dr. {doctorProfile.nombre} ha finalizado.
          </h1>
          <p className="mt-4 text-[15px] text-muted">
            {hayAlgoParaMostrar
              ? "Ya podés descargar tu documentación acá abajo."
              : consultation.documentacionEnviadaAt
              ? "La documentación fue enviada a tu correo electrónico."
              : "El médico está preparando la documentación correspondiente. En unos minutos vas a poder descargarla acá, o te va a llegar por correo."}
          </p>

          <ListaDocumentos documentos={consultation.documentos} recetaExternaUrl={consultation.recetaExternaUrl} />

          {!hayAlgoParaMostrar && !consultation.documentacionEnviadaAt && esperaDocsLarga && (
            <div className="mt-6 animate-fadeIn rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
              ¿Todavía no te llegó nada?{" "}
              <a
                href={linkWhatsAppConsultorio(
                  `Hola, soy ${consultation.paciente.nombre}. Terminé mi consulta con el Dr. Zyla y todavía no recibí la documentación.`
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

          <Link href="/" className="btn-primary mt-8 inline-block">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const lista = consultation.estado === "lista";
  const enCurso = consultation.estado === "en_consulta";

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12">
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
            {lista && (
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
                <p className="mt-3 text-xs text-muted">
                  Al entrar, escribí tu nombre y apellido — así el Dr. Zyla sabe que sos vos.
                </p>
              </>
            )}

            {enCurso && (
              <>
                <div className="mb-3 flex items-center justify-center gap-2 text-navy">
                  <span className="h-2 w-2 rounded-full bg-navy" />
                  <span className="text-sm font-medium">Tu consulta está en curso</span>
                </div>
                <a
                  href={doctorProfile.videollamadaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full"
                >
                  Volver a la videollamada
                </a>
                <p className="mt-3 text-sm text-muted">
                  ¿Ya terminaste de hablar con el Dr. Zyla? Podés cerrar Google Meet tranquilo — quedate
                  en esta página. En cuanto el médico cierre la consulta vas a poder descargar tu
                  documentación acá mismo, o te va a llegar por correo.
                </p>
              </>
            )}

            {!lista && !enCurso && (
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

        <ListaDocumentos documentos={consultation.documentos} recetaExternaUrl={consultation.recetaExternaUrl} />

        <Link href="/" className="mt-6 inline-block text-sm text-muted hover:text-ink">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
