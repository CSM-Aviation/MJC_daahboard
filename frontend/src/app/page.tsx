import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <img
        src="/mjcLogoWith inc.png"
        alt="Madera Jet Center"
        className="h-16"
      />
      <p className="text-lg text-gray-600">Office Dashboard System</p>
      <div className="flex gap-4">
        <Link
          href="/display"
          className="rounded-lg bg-[var(--mjc-primary)] px-6 py-3 text-white hover:bg-[var(--mjc-primary-light)] transition-colors"
        >
          TV Display
        </Link>
        <Link
          href="/admin/login"
          className="rounded-lg border-2 border-[var(--mjc-primary)] px-6 py-3 text-[var(--mjc-primary)] hover:bg-[var(--mjc-primary)] hover:text-white transition-colors"
        >
          Admin Panel
        </Link>
      </div>
    </main>
  );
}
