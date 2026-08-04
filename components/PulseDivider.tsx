// ==========================================================
// Elemento de firma de la página: una línea de pulso (ECG) muy
// sutil, en un solo tono, que separa secciones. Es el único
// guiño "médico" explícito de todo el diseño — todo lo demás
// se mantiene deliberadamente sobrio alrededor de este detalle.
// ==========================================================

export function PulseDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center overflow-hidden ${className}`} aria-hidden="true">
      <svg viewBox="0 0 480 40" className="h-8 w-full max-w-md text-navy/15" preserveAspectRatio="none">
        <path
          d="M0 20 H150 L165 20 L175 5 L188 35 L198 20 L212 20 L222 12 L232 28 L242 20 L480 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
