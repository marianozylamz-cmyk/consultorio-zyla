import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted">Error 404</p>
      <h1 className="text-2xl font-semibold text-ink">No encontramos esta página</h1>
      <p className="max-w-sm text-sm text-muted">
        El link puede estar vencido o mal escrito. Volvé al inicio para agendar tu consulta.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Volver al inicio
      </Link>
    </main>
  );
}
