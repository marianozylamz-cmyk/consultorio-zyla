"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Consultation } from "@/types";
import { agregarMiConsulta, quitarMiConsulta } from "@/lib/misConsultas";
import { ResumenPendiente } from "./ResumenPendiente";
import { ResumenRechazada } from "./ResumenRechazada";

type Fase =
  | { tipo: "cargando" }
  | { tipo: "no_encontrada" }
  | { tipo: "redirigiendo" }
  | { tipo: "pendiente"; consultation: Consultation }
  | { tipo: "rechazada"; consultation: Consultation };

interface Props {
  consultationId: string;
  /** Se llama cuando no hay nada que trackear (no se pudo resolver, o el paciente pidió empezar de cero). */
  onNuevaReserva: () => void;
  /**
   * Se llama en vez del mensaje default de "no encontramos tu consulta"
   * cuando la consulta no existe/ya no aplica — /consulta la usa para caer
   * de nuevo al wizard sin mostrar error (un id viejo en localStorage no
   * es un problema real); el link del mail (/consulta/[id]/seguimiento) la
   * deja sin definir y usa el mensaje default, porque ahí sí es un error
   * real de verdad (link roto o muy viejo).
   */
  onNoEncontrada?: () => void;
}

/**
 * Resuelve y muestra el estado real de UNA consulta puntual — sea porque
 * se llegó acá por el link "Ver mi turno" del mail de confirmación (con el
 * id en la URL) o porque /consulta la encontró en el localStorage de este
 * navegador. Es el único lugar que decide qué pantalla corresponde a cada
 * estado, para que ambas puertas de entrada muestren siempre lo mismo:
 *
 * - esperando/lista/en_consulta/finalizada -> reusa /consulta/[id]/espera,
 *   que ya resuelve sala de espera, videollamada y cierre con documentos.
 * - pendiente_pago -> ResumenPendiente (resumen + continuar pago).
 * - rechazada -> ResumenRechazada (cierre + reservar de nuevo).
 *
 * Cada vez que resuelve a un estado activo, guarda la consulta en el
 * localStorage de este dispositivo (agregarMiConsulta) — así, entrar por
 * el link del mail en un celular nuevo también deja memoria local para la
 * próxima vez, sin necesitar el mail de nuevo.
 */
export function SeguimientoConsulta({ consultationId, onNuevaReserva, onNoEncontrada }: Props) {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>({ tipo: "cargando" });

  function aplicar(consultation: Consultation) {
    if (consultation.estado === "finalizada") {
      quitarMiConsulta(consultation.id);
      setFase({ tipo: "redirigiendo" });
      router.replace(`/consulta/${consultation.id}/espera`);
      return;
    }
    if (consultation.estado === "rechazada") {
      quitarMiConsulta(consultation.id);
      setFase({ tipo: "rechazada", consultation });
      return;
    }

    agregarMiConsulta({
      id: consultation.id,
      fecha: consultation.fecha,
      hora: consultation.hora,
      tipoConsulta: consultation.tipoConsulta,
    });

    if (consultation.estado === "esperando" || consultation.estado === "lista" || consultation.estado === "en_consulta") {
      setFase({ tipo: "redirigiendo" });
      router.replace(`/consulta/${consultation.id}/espera`);
      return;
    }
    setFase({ tipo: "pendiente", consultation });
  }

  async function consultar() {
    try {
      const res = await fetch(`/api/consultations/${consultationId}`, { cache: "no-store" });
      if (!res.ok) {
        quitarMiConsulta(consultationId);
        if (onNoEncontrada) onNoEncontrada();
        else setFase({ tipo: "no_encontrada" });
        return;
      }
      aplicar(await res.json());
    } catch {
      if (onNoEncontrada) onNoEncontrada();
      else setFase({ tipo: "no_encontrada" });
    }
  }

  useEffect(() => {
    consultar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  // Mismo fix que el bug de "vuelve de Mercado Pago y queda pegado": si el
  // navegador restaura esta página desde bfcache (persisted), el efecto de
  // arriba no vuelve a correr solo — hay que forzar una re-consulta.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) consultar();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  if (fase.tipo === "cargando" || fase.tipo === "redirigiendo") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </main>
    );
  }

  if (fase.tipo === "no_encontrada") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-muted">No pudimos encontrar esa consulta.</p>
        <Link href="/consulta" className="text-sm text-navy underline-offset-2 hover:underline">
          Reservar una consulta
        </Link>
      </main>
    );
  }

  if (fase.tipo === "pendiente") {
    return (
      <ResumenPendiente consultation={fase.consultation} onActualizado={aplicar} onNuevaReserva={onNuevaReserva} />
    );
  }

  return <ResumenRechazada consultation={fase.consultation} onNuevaReserva={onNuevaReserva} />;
}
