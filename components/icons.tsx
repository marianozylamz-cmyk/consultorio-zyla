// ==========================================================
// Set de íconos lineales minimalistas (stroke, sin relleno)
// en tono navy. Se usan en Servicios y en Cómo funciona.
// Trazo consistente (1.6) para que se sientan de la misma familia.
// ==========================================================

const common = {
  fill: "none",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconStethoscope({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <path d="M5 3v6a4 4 0 0 0 8 0V3" />
      <path d="M9 13v2a5 5 0 0 0 10 0v-2.5" />
      <circle cx="19" cy="9" r="1.6" />
      <path d="M5 3H3.5M9 3H7.5M19 10.6V9" />
    </svg>
  );
}

export function IconBriefcaseMedical({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M12 11v4M10 13h4" />
    </svg>
  );
}

export function IconDocumentCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <path d="M9 13.5l2 2 4-4.2" />
    </svg>
  );
}

export function IconCalendarCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
      <path d="M9 14l2 2 4-4.2" />
    </svg>
  );
}

export function IconClipboardSearch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <path d="M8 4.5h8v2.5H8z" />
      <path d="M8 5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8" />
      <path d="M16 5h2a1 1 0 0 1 1 1v5" />
      <circle cx="16.5" cy="16.5" r="3" />
      <path d="M18.7 18.7L21 21" />
    </svg>
  );
}

export function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconCard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 14.5h4" />
    </svg>
  );
}

export function IconVideo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <rect x="3" y="6.5" width="12" height="11" rx="2" />
      <path d="M15 10.2l6-3v9.6l-6-3z" />
    </svg>
  );
}

export function IconPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

export function IconPhone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 5 6.1 1.5 1.5 0 0 1 6.5 3.5Z" />
    </svg>
  );
}

export function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function IconBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.4 5.4 1.4 5.4H4.6S6 14 6 10Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconSearch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} stroke="currentColor">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M19.5 19.5l-4.35-4.35" />
    </svg>
  );
}

// Glyph oficial de WhatsApp (relleno, no stroke) — reemplaza a la versión
// dibujada a mano que se repetía en varios archivos y que quedaba con el
// círculo cortado y sin la "colita" del globo.
export function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .105 5.36.102 11.943c0 2.096.549 4.142 1.595 5.945L0 24l6.256-1.635a11.928 11.928 0 0 0 5.783 1.474h.005c6.583 0 11.941-5.36 11.944-11.943a11.87 11.87 0 0 0-3.468-8.449M12.045 21.785h-.005a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m5.427-7.403c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
    </svg>
  );
}