"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Consultation, DocumentFile, DocumentType } from "@/types";
import { CertificadoModal } from "@/components/CertificadoModal";
import { SolicitudSecretariaModal } from "@/components/SolicitudSecretariaModal";
import { IconCheck } from "@/components/icons";
import { doctorProfile } from "@/data/doctorProfile";

const TIPOS: { value: DocumentType; label: string }[] = [
  { value: "receta", label: "Receta" },
  { value: "certificado", label: "Certificado" },
  { value: "indicaciones", label: "Indicaciones" },
  { value: "otro", label: "Otro" },
];

const TIPO_LABEL: Record<DocumentType, string> = {
  receta: "Receta",
  certificado: "Certificado",
  indicaciones: "Indicaciones",
  otro: "Documento",
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Dispara la descarga del archivo (ya lo tenemos completo en memoria como data URL). */
function descargarArchivo(doc: DocumentFile) {
  const a = document.createElement("a");
  a.href = doc.dataUrl;
  a.download = doc.nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function AdminConsultaDetalle({ params }: { params: { id: string } }) {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<DocumentType>("receta");
  const [subiendo, setSubiendo] = useState(false);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [mostrarCertificado, setMostrarCertificado] = useState(false);
  const [mostrarSecretaria, setMostrarSecretaria] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState<"atender" | "llamada" | "finalizar" | null>(null);
  const [avisoEnvio, setAvisoEnvio] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function cargar() {
    const res = await fetch(`/api/consultations/${params.id}`, { cache: "no-store" });
    if (res.ok) setConsultation(await res.json());
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function cambiarEstado(accion: "atender" | "llamada" | "finalizar", estado: Consultation["estado"]) {
    if (accionEnCurso) return;
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

  // Un mailto: no puede llevar un adjunto automático (limitación real del
  // estándar, no de esta app) — así que el flujo es: descargar el archivo,
  // abrir el cliente de correo del médico con todo prellenado, y que el
  // médico adjunte a mano el archivo que se acaba de descargar.
  async function enviarDocumento(doc: DocumentFile) {
    if (!consultation) return;
    setEnviandoId(doc.id);
    try {
      descargarArchivo(doc);

      const asunto = `${TIPO_LABEL[doc.tipo]} — Dr. ${doctorProfile.nombre}`;
      const cuerpo = [
        `Hola ${consultation.paciente.nombre},`,
        "",
        `Te envío tu ${TIPO_LABEL[doc.tipo].toLowerCase()} de la consulta del ${consultation.fecha}.`,
        `Encontrás el archivo "${doc.nombre}" recién descargado en tu dispositivo — lo adjunto a este mail.`,
        "",
        "Saludos,",
        `Dr. ${doctorProfile.nombre}`,
      ].join("\n");

      window.location.href = `mailto:${consultation.paciente.email}?subject=${encodeURIComponent(
        asunto
      )}&body=${encodeURIComponent(cuerpo)}`;

      setAvisoEnvio(
        `Se descargó "${doc.nombre}" y se abrió tu cliente de correo — no te olvides de adjuntarlo antes de enviar.`
      );

      await fetch(`/api/consultations/${params.id}/documents/${doc.id}/send`, { method: "POST" });
      await cargar();
    } finally {
      setEnviandoId(null);
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
              <button className="btn-secondary !py-2.5" onClick={() => setMostrarSecretaria(true)}>
                Solicitar receta a secretaría
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-muted">DNI</div>
            <div className="text-ink">{c.paciente.dni}</div>
            <div className="text-muted">WhatsApp</div>
            <div className="text-ink">{c.paciente.whatsapp}</div>
            <div className="text-muted">Email</div>
            <div className="text-ink">{c.paciente.email}</div>
            <div className="text-muted">Fecha</div>
            <div className="text-ink">{c.fecha} · {c.hora}</div>
            <div className="text-muted">Precio</div>
            <div className="text-ink">${c.precio.toLocaleString("es-AR")}</div>
            <div className="text-muted">Pago</div>
            <div className="text-ink capitalize">{c.pago.estado}</div>
          </div>
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
            <div className="mb-4 animate-fadeIn rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {avisoEnvio}
            </div>
          )}

          {c.documentos.length === 0 ? (
            <p className="text-sm text-muted">Todavía no se subieron documentos.</p>
          ) : (
            <div className="space-y-2">
              {c.documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{doc.nombre}</p>
                    <p className="text-xs text-muted capitalize">{doc.tipo}</p>
                  </div>
                  {doc.enviado ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <IconCheck className="h-3.5 w-3.5" />
                      Enviado por mail
                    </span>
                  ) : (
                    <button
                      className="btn-secondary !py-2 !px-4 text-xs"
                      disabled={enviandoId === doc.id}
                      onClick={() => enviarDocumento(doc)}
                    >
                      {enviandoId === doc.id ? "Enviando…" : "Enviar por mail"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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

      {mostrarSecretaria && (
        <SolicitudSecretariaModal consultation={c} onCerrar={() => setMostrarSecretaria(false)} />
      )}
    </main>
  );
}