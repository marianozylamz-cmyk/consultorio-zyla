"use client";

import { useEffect, useRef } from "react";

/**
 * Comportamiento básico de accesibilidad para modales tipo overlay:
 * - Cierra con Escape.
 * - Bloquea el scroll del fondo mientras está abierto.
 * - Pone el foco inicial en el primer elemento enfocable del modal.
 * - Devuelve el foco a quien lo abrió al cerrarse.
 *
 * No hace un trap de foco completo (no hace falta para modales cortos
 * de un puñado de campos) — cubre los casos que más se notan: perder
 * el foco al abrir, que el fondo se pueda seguir scrolleando, y que
 * Escape no haga nada.
 */
export function useModalA11y(onCerrar: () => void) {
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elementoPrevio = document.activeElement as HTMLElement | null;
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = contenedorRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = overflowOriginal;
      document.removeEventListener("keydown", onKeyDown);
      elementoPrevio?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Handler para el backdrop: cierra solo si el click fue en el fondo, no en el contenido. */
  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onCerrar();
  }

  return { contenedorRef, onBackdropClick };
}
