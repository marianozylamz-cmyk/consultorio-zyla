"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doctorProfile } from "@/data/doctorProfile";
import { Patient, TipoConsultaId } from "@/types";
import { formatFechaLargaAR, horaActualArgentina } from "@/lib/availability";
import { fileToDataUrl } from "@/lib/files";

type Step = "tipo" | "datos" | "horario" | "checkout";

const TIPOS_IMAGEN_CREDENCIAL = ["image/jpeg", "image/jpg", "image/png"];
const MAX_MB_CREDENCIAL = 5;
const MAX_FOTOS_CREDENCIAL = 2;

interface AvailabilityData {
  disponibleAhora: boolean;
  horarioHoy: { inicio: string; fin: string } | null;
  slots: string[];
  fecha: string;
}

interface UpcomingDay {
  fecha: string;
  label: string;
  slotsCount: number;
}

export default function ConsultaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("tipo");

  const [tipoConsultaId, setTipoConsultaId] = useState<TipoConsultaId | null>(null);
  const tipoSeleccionado = doctorProfile.consultaOnline.tipos.find((t) => t.id === tipoConsultaId) ?? null;

  const [paciente, setPaciente] = useState<Patient>({ nombre: "", dni: "", whatsapp: "", email: "" });
  const [errores, setErrores] = useState<Partial<Record<keyof Patient, string>>>({});

  const [credencialFotos, setCredencialFotos] = useState<string[]>([]);
  const [errorCredencial, setErrorCredencial] = useState<string | null>(null);

  const [diasDisponibles, setDiasDisponibles] = useState<UpcomingDay[] | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [horaElegida, setHoraElegida] = useState<string | null>(null);
  const [esAhora, setEsAhora] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [rechazado, setRechazado] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [modoPago, setModoPago] = useState<"mercadopago" | "mock" | null>(null);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  const hoyISO = diasDisponibles?.[0]?.fecha ?? null;

  // Al entrar al paso "horario": traemos el resumen de los próximos 7 días
  // y arrancamos parados en hoy si tiene turnos, o en el primer día que sí tenga.
  useEffect(() => {
    if (step !== "horario" || diasDisponibles) return;
    fetch("/api/availability/upcoming", { cache: "no-store" })
      .then((r) => r.json())
      .then((dias: UpcomingDay[]) => {
        setDiasDisponibles(dias);
        const conTurnos = dias.find((d) => d.slotsCount > 0);
        setFechaSeleccionada(conTurnos ? conTurnos.fecha : dias[0].fecha);
      })
      .catch(() => setDiasDisponibles([]));
  }, [step, diasDisponibles]);

  // Cada vez que cambia el día seleccionado, traemos sus horarios puntuales.
  useEffect(() => {
    if (!fechaSeleccionada) return;
    fetch(`/api/availability?fecha=${fechaSeleccionada}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setAvailability)
      .catch(() => setAvailability(null));
  }, [fechaSeleccionada]);

  async function agregarFotoCredencial(file: File) {
    setErrorCredencial(null);
    if (!TIPOS_IMAGEN_CREDENCIAL.includes(file.type)) {
      setErrorCredencial("Solo se aceptan imágenes JPG o PNG.");
      return;
    }
    if (file.size > MAX_MB_CREDENCIAL * 1024 * 1024) {
      setErrorCredencial(`Esa foto pesa más de ${MAX_MB_CREDENCIAL}MB. Subí una más liviana.`);
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setCredencialFotos((prev) => [...prev, dataUrl].slice(0, MAX_FOTOS_CREDENCIAL));
  }

  function quitarFotoCredencial(index: number) {
    setCredencialFotos((prev) => prev.filter((_, i) => i !== index));
  }

  function validarDatos(): boolean {
    const nuevosErrores: Partial<Record<keyof Patient, string>> = {};
    if (!paciente.nombre.trim()) nuevosErrores.nombre = "Ingresá tu nombre y apellido";
    if (!/^\d{7,9}$/.test(paciente.dni.trim())) nuevosErrores.dni = "DNI inválido";
    if (!/^\+?\d{8,15}$/.test(paciente.whatsapp.replace(/\s/g, ""))) nuevosErrores.whatsapp = "WhatsApp inválido";
    if (!/^\S+@\S+\.\S+$/.test(paciente.email.trim())) nuevosErrores.email = "Email inválido";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  /** Actualiza un campo y limpia su error apenas el usuario lo empieza a corregir. */
  function actualizarCampo(campo: keyof Patient, valor: string) {
    setPaciente((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: undefined } : prev));
  }

  function elegirAhora() {
    setEsAhora(true);
    setHoraElegida(horaActualArgentina());
    setStep("checkout");
  }

  function elegirSlot(hora: string) {
    setEsAhora(false);
    setHoraElegida(hora);
    setStep("checkout");
  }

 async function refrescarHorariosDelDia() {
    if (!fechaSeleccionada) return;
    try {
      const r = await fetch(`/api/availability?fecha=${fechaSeleccionada}`, { cache: "no-store" });
      setAvailability(await r.json());
    } catch {
      // si falla el refresco no es crítico, el usuario puede reintentar el paso
    }
  }

  async function iniciarPago() {
    if (!horaElegida) return;
    setEnviando(true);
    setRechazado(false);
    setErrorPago(null);
    try {
      let id = consultationId;
      if (!id) {
        const createRes = await fetch("/api/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paciente,
            fecha: availability?.fecha ?? fechaSeleccionada ?? hoyISO,
            hora: horaElegida,
            esAhora,
            tipoConsulta: tipoConsultaId,
            credencialFotos,
          }),
        });

        if (createRes.status === 409) {
          // Otro paciente reservó este horario primero.
          setErrorPago("Ese horario se acaba de ocupar. Elegí otro, por favor.");
          setHoraElegida(null);
          setStep("horario");
          await refrescarHorariosDelDia();
          setEnviando(false);
          return;
        }

        if (!createRes.ok) {
          const errJson = await createRes.json().catch(() => ({}));
          setErrorPago(errJson.error ?? "No pudimos crear la consulta. Probá de nuevo.");
          setEnviando(false);
          return;
        }

        const consultation = await createRes.json();
        id = consultation.id;
        setConsultationId(id);
      }

      const checkoutRes = await fetch(`/api/consultations/${id}/checkout`, { method: "POST" });
      const checkoutJson = await checkoutRes.json();

      if (checkoutJson.error) {
        setErrorPago(checkoutJson.error);
        setEnviando(false);
        return;
      }

      if (checkoutJson.modo === "mercadopago" && checkoutJson.checkoutUrl) {
        // Salimos de la app hacia el checkout hospedado de Mercado Pago.
        window.location.href = checkoutJson.checkoutUrl;
        return;
      }

      // Sin Mercado Pago configurado todavía: modo de prueba local.
      setModoPago("mock");
      setEnviando(false);
    } catch {
      setErrorPago("No pudimos iniciar el pago. Probá de nuevo.");
      setEnviando(false);
    }
  }

  async function simularPagoMock(resultado: "aprobado" | "rechazado") {
    if (!consultationId) return;
    setEnviando(true);
    setRechazado(false);
    try {
      const payRes = await fetch(`/api/consultations/${consultationId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forzarResultado: resultado }),
      });
      const payJson = await payRes.json();

      if (payJson.resultado.aprobado) {
        router.push(`/consulta/${consultationId}/espera`);
      } else {
        setRechazado(true);
        setEnviando(false);
      }
    } catch {
      setEnviando(false);
    }
  }

  const pasos: { key: Step; label: string }[] = [
    { key: "tipo", label: "Tipo" },
    { key: "datos", label: "Tus datos" },
    { key: "horario", label: "Horario" },
    { key: "checkout", label: "Pago" },
  ];

  const esHoy = fechaSeleccionada === hoyISO;

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

      <div className="mx-auto max-w-lg px-5 py-10">
        <div className="mb-8 flex items-center gap-2">
          {pasos.map((p, i) => (
            <div key={p.key} className="flex flex-1 items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full ${
                  pasos.findIndex((x) => x.key === step) >= i ? "bg-navy" : "bg-line"
                }`}
              />
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-semibold text-ink">Solicitar consulta online</h1>
        <p className="mt-1 text-[15px] text-muted">
          Consulta médica particular de {doctorProfile.consultaOnline.duracionMinutos} minutos.
        </p>
        {tipoSeleccionado && (
          <p className="mt-3 text-3xl font-semibold text-navy">
            ${tipoSeleccionado.precio.toLocaleString("es-AR")}
          </p>
        )}

        {/* PASO 0: TIPO DE CONSULTA */}
        {step === "tipo" && (
          <div className="mt-10 animate-fadeIn space-y-3">
            <p className="text-sm font-medium text-ink">Elegí el tipo de consulta</p>
            {doctorProfile.consultaOnline.tipos.map((tipo) => (
              <button
                key={tipo.id}
                onClick={() => {
                  setTipoConsultaId(tipo.id);
                  setStep("datos");
                }}
                className="card hover-lift block w-full text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{tipo.nombre}</p>
                    <p className="mt-1 text-sm text-muted">{tipo.descripcion}</p>
                  </div>
                  <p className="shrink-0 text-xl font-semibold text-navy">
                    ${tipo.precio.toLocaleString("es-AR")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* PASO 1: DATOS */}
        {step === "datos" && (
          <div className="mt-10 animate-fadeIn space-y-4">
            <div>
              <label htmlFor="campo-nombre" className="mb-1.5 block text-sm font-medium text-ink">
                Nombre y apellido
              </label>
              <input
                id="campo-nombre"
                className="input-field"
                value={paciente.nombre}
                onChange={(e) => actualizarCampo("nombre", e.target.value)}
                placeholder="José Pérez"
                autoComplete="name"
                aria-invalid={Boolean(errores.nombre)}
                aria-describedby={errores.nombre ? "error-nombre" : undefined}
              />
              {errores.nombre && (
                <p id="error-nombre" role="alert" className="mt-1 text-xs text-red-600">
                  {errores.nombre}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="campo-dni" className="mb-1.5 block text-sm font-medium text-ink">
                DNI
              </label>
              <input
                id="campo-dni"
                className="input-field"
                value={paciente.dni}
                onChange={(e) => actualizarCampo("dni", e.target.value)}
                placeholder="30123456"
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={Boolean(errores.dni)}
                aria-describedby={errores.dni ? "error-dni" : undefined}
              />
              {errores.dni && (
                <p id="error-dni" role="alert" className="mt-1 text-xs text-red-600">
                  {errores.dni}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="campo-whatsapp" className="mb-1.5 block text-sm font-medium text-ink">
                WhatsApp
              </label>
              <input
                id="campo-whatsapp"
                type="tel"
                className="input-field"
                value={paciente.whatsapp}
                onChange={(e) => actualizarCampo("whatsapp", e.target.value)}
                placeholder="+54 9 11 1234-5678"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(errores.whatsapp)}
                aria-describedby={errores.whatsapp ? "error-whatsapp" : undefined}
              />
              {errores.whatsapp && (
                <p id="error-whatsapp" role="alert" className="mt-1 text-xs text-red-600">
                  {errores.whatsapp}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="campo-email" className="mb-1.5 block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="campo-email"
                type="email"
                className="input-field"
                value={paciente.email}
                onChange={(e) => actualizarCampo("email", e.target.value)}
                placeholder="jose@email.com"
                inputMode="email"
                autoComplete="email"
                aria-invalid={Boolean(errores.email)}
                aria-describedby={errores.email ? "error-email" : undefined}
              />
              {errores.email && (
                <p id="error-email" role="alert" className="mt-1 text-xs text-red-600">
                  {errores.email}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Credencial de obra social <span className="font-normal text-muted">(opcional)</span>
              </label>
              <p className="mb-2 text-xs text-muted">Podés subir hasta 2 fotos (por ejemplo, frente y dorso).</p>

              {credencialFotos.length > 0 && (
                <div className="mb-3 space-y-2">
                  {credencialFotos.map((foto, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-line px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={foto} alt={`Credencial ${i + 1}`} className="h-10 w-10 rounded-lg object-cover" />
                        <span className="text-sm text-ink">Foto {i + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => quitarFotoCredencial(i)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {credencialFotos.length < MAX_FOTOS_CREDENCIAL && (
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) agregarFotoCredencial(file);
                    e.target.value = "";
                  }}
                  className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-navy-light"
                />
              )}

              {errorCredencial && <p className="mt-1.5 text-xs text-red-600">{errorCredencial}</p>}
            </div>

            <button
              className="btn-primary mt-4 w-full"
              onClick={() => validarDatos() && setStep("horario")}
            >
              Continuar
            </button>
            <p className="text-center text-xs text-muted">No necesitás crear una cuenta.</p>
            <button className="w-full text-center text-sm text-muted hover:text-ink" onClick={() => setStep("tipo")}>
              ← Volver
            </button>
          </div>
        )}

        {/* PASO 2: HORARIO */}
        {step === "horario" && (
          <div className="mt-10 animate-fadeIn space-y-6">
            {esHoy && availability?.disponibleAhora && (
              <div className="card border-emerald-100 bg-emerald-50/40">
                <div className="mb-1 flex items-center gap-2 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">El Dr. Zyla está atendiendo consultas online.</span>
                </div>
                <p className="mb-4 text-sm text-muted">Tiempo estimado de espera: aprox. 5 minutos.</p>
                <button className="btn-primary w-full" onClick={elegirAhora}>
                  Consultar ahora
                </button>
              </div>
            )}

            {/* Selector de día */}
            {diasDisponibles && diasDisponibles.length > 0 && (
              <div>
                <p className="mb-3 text-sm font-medium text-ink">Elegir día</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {diasDisponibles.map((d) => (
                    <button
                      key={d.fecha}
                      onClick={() => {
                        setFechaSeleccionada(d.fecha);
                      }}
                      disabled={d.slotsCount === 0}
                      className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                        fechaSeleccionada === d.fecha
                          ? "border-navy bg-navy text-white"
                          : d.slotsCount === 0
                          ? "border-line text-muted/50"
                          : "border-line text-ink hover:border-navy/40 hover:bg-skyfaint"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 text-sm font-medium text-ink">
                Horarios{fechaSeleccionada ? ` — ${formatFechaLargaAR(fechaSeleccionada)}` : ""}
              </p>
              {!diasDisponibles || !availability ? (
                <div className="grid grid-cols-3 gap-2.5" aria-label="Cargando horarios">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-11 rounded-xl" />
                  ))}
                </div>
              ) : availability.slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5">
                  {availability.slots.map((hora) => (
                    <button
                      key={hora}
                      onClick={() => elegirSlot(hora)}
                      className="rounded-xl border border-line py-3 text-sm font-medium text-ink transition-colors hover:border-navy hover:bg-skyfaint"
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              ) : diasDisponibles.every((d) => d.slotsCount === 0) ? (
                <div className="card bg-bgsoft text-sm text-ink/80">
                  No hay horarios disponibles en los próximos días. Escribinos por WhatsApp y te avisamos
                  apenas se abra un turno.
                </div>
              ) : (
                <p className="text-sm text-muted">No hay horarios disponibles ese día. Probá otro día arriba.</p>
              )}
            </div>

            <button className="text-sm text-muted hover:text-ink" onClick={() => setStep("datos")}>
              ← Volver a mis datos
            </button>
          </div>
        )}

        {/* PASO 3: CHECKOUT */}
        {step === "checkout" && horaElegida && (
          <div className="mt-10 animate-fadeIn space-y-6">
            <div className="card space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Consulta médica online</span>
                <span className="font-medium text-ink">Dr. Juan Manuel Zyla</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Tipo de consulta</span>
                <span className="text-ink">{tipoSeleccionado?.nombre ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Duración</span>
                <span className="text-ink">{doctorProfile.consultaOnline.duracionMinutos} minutos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Fecha</span>
                <span className="text-ink">{availability?.fecha ? formatFechaLargaAR(availability.fecha) : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Hora</span>
                <span className="text-ink">{esAhora ? `Ahora (${horaElegida})` : horaElegida}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-4 text-sm">
                <span className="text-muted">Paciente</span>
                <span className="text-ink">{paciente.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">WhatsApp</span>
                <span className="text-ink">{paciente.whatsapp}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Email</span>
                <span className="text-ink">{paciente.email}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-4 text-base">
                <span className="font-medium text-ink">Precio</span>
                <span className="font-semibold text-navy">
                  ${(tipoSeleccionado?.precio ?? 0).toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            {rechazado && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                El pago fue rechazado. Podés intentar nuevamente.
              </div>
            )}

            {errorPago && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorPago}
              </div>
            )}

            <div className="space-y-3">
              {modoPago !== "mock" && (
                <button className="btn-primary w-full" disabled={enviando} onClick={iniciarPago}>
                  {enviando ? "Procesando…" : "Pagar y solicitar consulta"}
                </button>
              )}

              {modoPago === "mock" && (
                <>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    Mercado Pago no está configurado todavía — estás en modo de prueba local.
                  </div>
                  <button
                    className="btn-primary w-full"
                    disabled={enviando}
                    onClick={() => simularPagoMock("aprobado")}
                  >
                    {enviando ? "Procesando pago…" : "(Demo) Simular pago aprobado"}
                  </button>
                  <button
                    className="w-full text-center text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
                    disabled={enviando}
                    onClick={() => simularPagoMock("rechazado")}
                  >
                    (Demo) Simular pago rechazado
                  </button>
                </>
              )}
            </div>

            <p className="text-center text-xs text-muted">
              Pago seguro procesado por Mercado Pago. Podés pagar con tarjeta de crédito o débito,
              o con dinero en cuenta de Mercado Pago — no hace falta tener cuenta para pagar con tarjeta.
            </p>

            <button className="text-sm text-muted hover:text-ink" onClick={() => setStep("horario")}>
              ← Elegir otro horario
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
