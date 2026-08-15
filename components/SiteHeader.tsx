'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AvailabilityStatus } from './AvailabilityStatus';

interface SiteHeaderProps {
  fixed?: boolean;
}

export function SiteHeader({ fixed = true }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerClass = fixed
    ? 'sticky top-0 z-40 border-b border-[#E5E9F0] bg-white/95 backdrop-blur-md'
    : 'border-b border-[#E5E9F0] bg-white';

  const navLinks = [
    { label: 'Sobre mí', href: '/#sobre-mi' },
    { label: 'Servicios', href: '/#servicios' },
    { label: 'Cómo funciona', href: '/#como-funciona' },
  ];

  return (
    <header className={headerClass}>
      <div className="container-max flex items-center justify-between py-4">
        {/* LOGO / BRANDING */}
        <Link href="/" className="group flex flex-col gap-0.5 transition-all duration-300">
          <div className="text-[15px] font-bold tracking-tight text-[#2C3E50] group-hover:text-[#1B6E5C] transition-colors">
            Dr. Juan Zyla
          </div>
          <div className="text-xs text-muted group-hover:text-[#1B6E5C]/70 transition-colors">
            Medicina Clínica
          </div>
        </Link>

        {/* NAV DESKTOP */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-[#1B6E5C] hover:font-semibold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* AVAILABILITY + CTA */}
        <div className="flex items-center gap-3">
          {/* Disponibilidad (solo en desktop) */}
          <div className="hidden sm:block">
            <AvailabilityStatus compact />
          </div>

          {/* Botón CTA principal */}
          <Link
            href="/consulta"
            className="btn-primary !py-2.5 !px-5 text-xs font-semibold whitespace-nowrap"
          >
            Agendar
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-[#2C3E50] hover:bg-[#F4EFE4] transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E9F0] bg-white animate-fadeIn">
          <nav className="container-max flex flex-col gap-3 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2.5 text-sm font-medium text-muted hover:text-[#1B6E5C] hover:bg-[#F4EFE4] rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[#E5E9F0] pt-3 mt-2">
              <AvailabilityStatus compact />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}