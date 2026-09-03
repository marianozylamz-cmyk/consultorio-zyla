"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Consultation, DocumentType } from "@/types";
import { CertificadoModal } from "@/components/CertificadoModal";
import { ObservacionesModal } from "@/components/ObservacionesModal";
import { SolicitudEstudiosModal } from "@/components/SolicitudEstudiosModal";
import { SolicitudSecretariaModal } from "@/components/SolicitudSecretariaModal";
import { IconCheck } from "@/components/icons";
import { doctorProfile } from "@/data/doctorProfile";
import { formatFechaLargaAR, toISODate } from "@/lib/availability";
import { DOCUMENT_TYPE_LABEL } from "@/lib/documentLabels";
import { fileToDataUrl } from "@/lib/files";

const TIPOS: { value: DocumentType; label: string }[] = [
  { value: "receta", label: "Receta" },
  { value: "certificado", label: "Certificado" },
  { value: "indicaciones", label: "Indicaciones" },
  { value: "solicitud_estudios", label: "Solicitud de estudios" },
  { value: "otro", label: "Otro" },
];

export default function AdminConsultaDetalle({ params }: { params: { id: string } }) {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<DocumentType>("receta");
  const [subiendo, setSubiendo] = useState(false);
  const [mostrarCertificado, setMostrarCertificado] = useState(false);
  const [mostrarObservaciones, setMostrarObservaciones] = useState(false);
  const [mostrarSolicitudEstudios, setMostrarSolicitudEstudios] = useState(false);
  const [mostrarSecretaria, setMostrarSecretaria] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState<"atender" | "llamada" | "finalizar" | null>(null);
  const [enviandoDocumentacion, setEnviandoDocumentacion] = useState(false);
  const [avisoEnvio, setAvisoEnvio] = useState<string | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [recetaUrlInput, setRecetaUrlInput] = useState("");
  const [guardandoReceta, setGuardandoReceta] = useState(false);
  const [errorReceta, setErrorReceta] = useState<string | null>(null);
  const [recetaLinkCopiado, setRecetaLinkCopiado] = useState(false);
  const [enviandoReceta, setEnviandoReceta] = useState(false);
  const [recetaEnviada, setRecetaEnviada] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Para emergencias: si el paciente no puede entrar desde su sala de
  // espera, el médico puede pasarle este mismo link por WhatsApp a mano —
  // es una URL fija, no hay nada que "romper" al compartirla.
  async function copiarLinkVideollamada() {
    await navigator.clipboard.writeText(doctorProfile.videollamadaUrl);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  }

  async function cargar() {
    const res = await fetch(`/api/consultations/${params.id}`, { cache: "no-store" });
    if (res.ok) setConsultation(await res.json());
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    setRecetaUrlInput(consultation?.recetaExternaUrl ?? "");
  }, [consultation?.recetaExternaUrl]);

  async function cambiarEstado(accion: "atender" | "llamada" | "finalizar", estado: Consultation["estado"]) {
    if (accionEnCurso || !consultation) return;

    // "Atender" en un turno agendado revela el botón de videollamada en la
    // sala de espera del paciente de inmediato — si es un turno para dentro
    // de unos días y no para hoy, confirmamos antes de hacerlo: sin esto,
    // un click apurado en la fila equivocada del panel adelanta la consulta
    // sin que corresponda todavía.
    if (accion === "atender" && !consultation.esAhora && consultation.fecha !== toISODate(new Date())) {
      const confirmar = window.confirm(
        `Este turno es para el ${formatFechaLargaAR(consultation.fecha)} a las ${consultation.hora} hs, no hoy. ¿Atender igual?`
      );
      if (!confirmar) return;
    }

    setAccionEnCurso(accion);
    try {
      await fetch(`/api/consultations/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (accion === "llamada") {
        window.open(doctorProfile.videollamadaUrl, "_blank", "noopener,noreferrer");
      }
      await cargar();
    } finally {
      setAccionEnCurso(null);
    }
  }

  async function subirArchivo(file: File) {
    setSubiendo(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await fetch(`/api/consultations/${params.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: file.name,
          tipo: tipoSeleccionado,
          mimeType: file.type,
          dataUrl,
        }),
      });
      await cargar();
    } finally {
      setSubiendo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function enviarDocumentacion(esReenvio: boolean) {
    if (esReenvio) {
      const confirmar = window.confirm(
        "La documentación ya se había enviado. ¿Volver a mandarla con todo lo que esté disponible ahora?"
      );
      if (!confirmar) return;
    }
    setEnviandoDocumentacion(true);
    setAvisoEnvio(null);
    try {
      const res = await fetch(`/api/consultations/${params.id}/enviar-documentacion`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAvisoEnvio(data.error ?? "No se pudo enviar la documentación.");
        return;
      }
      await cargar();
    } finally {
      setEnviandoDocumentacion(false);
    }
  }

  async function guardarRecetaExterna() {
    if (!recetaUrlInput.trim() || guardandoReceta) return;
    setGuardandoReceta(true);
    setErrorReceta(null);
    try {
      const res = await fetch(`/api/consultations/${params.id}/receta-externa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: recetaUrlInput.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorReceta(data.error ?? "No se pudo guardar el link.");
        return;
      }
      await cargar();
    } finally {
      setGuardandoReceta(false);
    }
  }

  async function copiarRecetaExterna() {
    if (!consultation?.recetaExternaUrl) return;
    await navigator.clipboard.writeText(consultation.recetaExternaUrl);
    setRecetaLinkCopiado(true);
    setTimeout(() => setRecetaLinkCopiado(false), 2000);
  }

  async function enviarRecetaExterna() {
    if (enviandoReceta) return;
    setEnviandoReceta(true);
    setErrorReceta(null);
    try {
      const res = await fetch(`/api/consultations/${params.id}/receta-externa/enviar`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorReceta(data.error ?? "No se pudo enviar el mail.");
        return;
      }
      setRecetaEnviada(true);
      setTimeout(() => setRecetaEnviada(false), 3000);
    } finally {
      setEnviandoReceta(false);
    }
  }

  if (!consultation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bgsoft">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </main>
    );
  }

  const c = consultation;
  const puedeAtender = c.estado === "esperando";
  const puedeLlamar = c.estado === "lista" || c.estado === "en_consulta";
  const enCurso = c.estado === "en_consulta";
  const puedeCertificar = c.estado === "lista" || c.estado === "en_consulta" || c.estado === "finalizada";
  const yaEnviada = Boolean(c.documentacionEnviadaAt);

  return (
    <main className="min-h-screen bg-bgsoft">
      <div className="border-b border-line bg-white px-5 py-5">
        <div className="mx-auto max-w-2xl">
          <Link href="/admin" className="text-sm text-muted hover:text-ink">
            ← Volver al panel
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
        <div className="card">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold text-ink">{c.paciente.nombre}</h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {puedeAtender && (
                <button
                  className="btn-primary !py-2.5"
                  disabled={accionEnCurso !== null}
                  onClick={() => cambiarEstado("atender", "lista")}
                >
                  {accionEnCurso === "atender" ? "Atendiendo…" : "Atender"}
                </button>
              )}
              {puedeLlamar && (
                <button
                  className="btn-primary !py-2.5"
                  disabled={accionEnCurso !== null}
                  onClick={() => cambiarEstado("llamada", "en_consulta")}
                >
                  {enCurso ? "Volver a la videollamada" : "Iniciar videollamada"}
                </button>
              )}
              {puedeLlamar && (
                <button className="btn-secondary !py-2.5" onClick={copiarLinkVideollamada}>
                  {linkCopiado ? "¡Copiado!" : "Copiar link de videollamada"}
                </button>
              )}
              {enCurso && (
                <button
                  className="btn-secondary !py-2.5"
                  disabled={accionEnCurso !== null}
                  onClick={() => cambiarEstado("finalizar", "finalizada")}
                >
                  {accionEnCurso === "finalizar" ? "Finalizando…" : "Finalizar consulta"}
                </button>
              )}
              {puedeCertificar && (
                <button className="btn-secondary !py-2.5" onClick={() => setMostrarCertificado(true)}>
                  Crear certificado
                </button>
              )}
              {puedeCertificar && (
                <button className="btn-secondary !py-2.5" onClick={() => setMostrarObservaciones(true)}>
                  Crear observaciones
                </button>
              )}
              {puedeCertificar && (
                <button className="btn-secondary !py-2.5" onClick={() => setMostrarSolicitudEstudios(true)}>
                  Solicitar estudios complementarios
                </button>
              )}
              <button className="btn-secondary !py-2.5" onClick={() => setMostrarSecretaria(true)}>
                Solicitar receta a secretaría
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-muted">DNI</div>
            <div className="text-ink break-all">{c.paciente.dni}</div>
            <div className="text-muted">WhatsApp</div>
            <div className="text-ink break-all">{c.paciente.whatsapp}</div>
            <div className="text-muted">Email</div>
            <div className="text-ink break-all">{c.paciente.email}</div>
            <div className="text-muted">Fecha</div>
            <div className="text-ink">{c.fecha} · {c.hora}</div>
            <div className="text-muted">Tipo</div>
            <div className="text-ink">
              {doctorProfile.consultaOnline.tipos.find((t) => t.id === c.tipoConsulta)?.nombre ?? c.tipoConsulta}
            </div>
            <div className="text-muted">Precio</div>
            <div className="text-ink">${c.precio.toLocaleString("es-AR")}</div>
            <div className="text-muted">Pago</div>
            <div className="text-ink capitalize">{c.pago.estado}</div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Credencial de obra social
          </h2>
          {c.credencialFotos.length === 0 ? (
            <p className="text-sm text-muted">El paciente no subió credencial de obra social.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {c.credencialFotos.map((foto, i) => (
                <a
                  key={i}
                  href={foto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-line"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto}
                    alt={`Credencial de obra social ${i + 1}`}
                    className="h-28 w-28 object-cover transition-opacity hover:opacity-80"
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Documentos</h2>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className="input-field sm:w-44"
              value={tipoSeleccionado}
              onChange={(e) => setTipoSeleccionado(e.target.value as DocumentType)}
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={subiendo}
              onChange={(e) => e.target.files?.[0] && subirArchivo(e.target.files[0])}
              className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-navy-light"
            />
          </div>

          {avisoEnvio && (
            <div className="mb-4 animate-fadeIn rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {avisoEnvio}
            </div>
          )}

          {c.documentos.length === 0 ? (
            <p className="text-sm text-muted">Todavía no se generaron documentos.</p>
          ) : (
            <div className="space-y-2">
              {c.documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{doc.nombre}</p>
                    <p className="text-xs text-muted">{DOCUMENT_TYPE_LABEL[doc.tipo]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 border-t border-line pt-5">
            {yaEnviada ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <IconCheck className="h-4 w-4" />
                  Documentación enviada
                </span>
                <button
                  className="btn-secondary !py-2 !px-4 text-xs self-start sm:self-auto"
                  disabled={enviandoDocumentacion}
                  onClick={() => enviarDocumentacion(true)}
                >
                  {enviandoDocumentacion ? "Enviando…" : "Reenviar"}
                </button>
              </div>
            ) : (
              <button
                className="btn-primary w-full"
                disabled={enviandoDocumentacion || c.documentos.length === 0}
                onClick={() => enviarDocumentacion(false)}
              >
                {enviandoDocumentacion ? "Enviando…" : "Enviar documentación al paciente"}
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Receta (MisRx)</h2>

          <a
            href="https://misrx.com.ar/login"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mb-4 inline-flex"
          >
            Abrir MisRx
          </a>
          <p className="mb-4 text-xs text-muted">
            Generá la receta en MisRx y después pegá acá el link que te da, para que quede asociado a
            esta consulta.
          </p>

          {c.recetaExternaUrl && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <a
                href={c.recetaExternaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm font-medium text-navy hover:underline"
              >
                {c.recetaExternaUrl}
              </a>
              <div className="flex flex-wrap gap-2">
                <a
                  href={c.recetaExternaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary !py-2 !px-3 text-xs"
                >
                  Ver
                </a>
                <button className="btn-secondary !py-2 !px-3 text-xs" onClick={copiarRecetaExterna}>
                  {recetaLinkCopiado ? "¡Copiado!" : "Copiar"}
                </button>
                <button
                  className="btn-secondary !py-2 !px-3 text-xs"
                  disabled={enviandoReceta}
                  onClick={enviarRecetaExterna}
                >
                  {enviandoReceta ? "Enviando…" : recetaEnviada ? "✓ Enviado" : "Enviar por mail al paciente"}
                </button>
              </div>
            </div>
          )}

          {errorReceta && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorReceta}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="input-field"
              type="url"
              placeholder="https://misrx.com.ar/prestacion?token=..."
              value={recetaUrlInput}
              onChange={(e) => setRecetaUrlInput(e.target.value)}
            />
            <button
              className="btn-secondary shrink-0"
              disabled={guardandoReceta || !recetaUrlInput.trim()}
              onClick={guardarRecetaExterna}
            >
              {guardandoReceta ? "Guardando…" : c.recetaExternaUrl ? "Actualizar link" : "Guardar link"}
            </button>
          </div>
        </div>
      </div>

      {mostrarCertificado && (
        <CertificadoModal
          consultationId={c.id}
          pacienteNombre={c.paciente.nombre}
          pacienteEmail={c.paciente.email}
          onCerrar={() => setMostrarCertificado(false)}
          onCreado={() => {
            setMostrarCertificado(false);
            cargar();
          }}
        />
      )}

      {mostrarObservaciones && (
        <ObservacionesModal
          consultationId={c.id}
          onCerrar={() => setMostrarObservaciones(false)}
          onCreado={() => {
            setMostrarObservaciones(false);
            cargar();
          }}
        />
      )}

      {mostrarSolicitudEstudios && (
        <SolicitudEstudiosModal
          consultationId={c.id}
          onCerrar={() => setMostrarSolicitudEstudios(false)}
          onCreado={() => {
            setMostrarSolicitudEstudios(false);
            cargar();
          }}
        />
      )}

      {mostrarSecretaria && (
        <SolicitudSecretariaModal consultation={c} onCerrar={() => setMostrarSecretaria(false)} />
      )}
    </main>
  );
}
