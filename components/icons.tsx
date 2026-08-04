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