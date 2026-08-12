'use client';

export function PulseDivider({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex justify-center overflow-hidden py-4 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 480 40"
        className="h-8 w-full max-w-md text-[#1B6E5C]/20"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Línea base */}
        <path
          d="M0 20 L120 20 L140 15 L155 25 L170 20 L190 20 L210 18 L230 22 L250 20 L480 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}