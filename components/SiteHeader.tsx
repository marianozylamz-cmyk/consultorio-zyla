import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="group">
          <div className="text-[15px] font-semibold leading-tight text-ink">Juan Manuel Zyla</div>
          <div className="text-xs text-muted">Médico</div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-ink/80 md:flex">
          <Link href="/#sobre-mi" className="hover:text-navy">
            Sobre mí
          </Link>
          <Link href="/#servicios" className="hover:text-navy">
            Servicios
          </Link>
          <Link href="/#consultas-online" className="hover:text-navy">
            Consultas online
          </Link>
        </nav>

        <Link href="/consulta" className="btn-primary !py-2.5 !px-5 text-[13px]">
          Solicitar consulta
        </Link>
      </div>
    </header>
  );
}
