'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Space_Grotesk, Fraunces } from 'next/font/google';

const space = Space_Grotesk({ subsets: ['latin'] });
const fraunces = Fraunces({ subsets: ['latin'] });

export default function Home() {
  const [todayCount, setTodayCount] = useState<number | null>(null);

  useEffect(() => {
    const loadTodayCount = async () => {
      try {
        const response = await fetch('/api/reservations');
        if (!response.ok) return;
        const data = await response.json();
        const today = new Date();
        const todayKey = today.toISOString().slice(0, 10);
        const count = Array.isArray(data)
          ? data.filter((r: any) => String(r.start_datetime).slice(0, 10) === todayKey).length
          : 0;
        setTodayCount(count);
      } catch (err) {
        console.error('Failed to load today count', err);
      }
    };
    loadTodayCount();
  }, []);

  return (
    <div className={`min-h-screen ${space.className} bg-[#f2f5fb]`}>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-[-160px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.45),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-140px] top-[40px] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_center,rgba(30,64,175,0.35),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-200px] left-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25),transparent_70%)] blur-3xl" />
      </div>

      <nav className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className={`text-2xl font-semibold tracking-tight ${fraunces.className}`}>Fietsmaatje</div>
          <div className="hidden md:flex items-center gap-3 text-sm font-semibold text-gray-600">
            <span className="px-3 py-1 rounded-full bg-white/80 shadow-sm">Vrijwilligers</span>
            <span className="px-3 py-1 rounded-full bg-white/80 shadow-sm">Beheer</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-sm font-semibold text-gray-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Duofiets reserveren zonder gedoe
            </div>
            <h1 className={`mt-6 text-5xl md:text-6xl font-semibold leading-tight ${fraunces.className}`}>
              Een zachte landing voor vrijwilligers, een strak overzicht voor beheer.
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              Een rustige flow, heldere keuzes en realtime inzicht. Alles wat je nodig hebt om
              duofietsen slim te plannen en betrouwbaar te beheren.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/volunteer/login"
                className="relative inline-flex items-center gap-3 rounded-2xl px-6 py-3 font-semibold text-white shadow-lg transition hover:shadow-2xl bg-[linear-gradient(135deg,#0f766e,#2563eb)]"
              >
                Vrijwilligersportaal
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20">→</span>
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-3 rounded-2xl px-6 py-3 font-semibold text-gray-900 bg-white/90 shadow-lg transition hover:shadow-2xl"
              >
                Beheerportaal
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">→</span>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm border border-white/80 surface-card">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Buffer</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">30 minuten</div>
              </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm border border-white/80 surface-card">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Open</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">Per locatie</div>
              </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm border border-white/80 surface-card">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Prijs</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">Vast tarief</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="relative overflow-hidden rounded-[32px] bg-white shadow-2xl border border-white/80 surface-card">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,118,110,0.18),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(37,99,235,0.18),transparent_55%)]" />
              <div className="relative p-8">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-500">Dashboard Snapshot</div>
                  <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">Live</div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/90 p-4 shadow-sm surface-card">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Vandaag</div>
                    <div className="mt-3 text-3xl font-semibold text-emerald-700">
                      {todayCount === null ? '...' : todayCount}
                    </div>
                    <div className="text-sm text-gray-600">ritten gepland</div>
                  </div>
                  <div className="rounded-2xl bg-white/90 p-4 shadow-sm surface-card">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Volgende</div>
                    <div className="mt-3 text-2xl font-semibold text-gray-900">14:30</div>
                    <div className="text-sm text-gray-600">Centrum</div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-800">
                  Rustige planning met duidelijke keuzes en minimale stappen.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/90 border border-white/80 p-5 shadow-lg surface-card">
                <div className="text-4xl">🚴</div>
                <div className={`mt-4 text-2xl font-semibold ${fraunces.className}`}>Vrijwilligers</div>
                <p className="mt-2 text-gray-600 text-sm">Snel boeken, helder overzicht, altijd rust.</p>
              </div>
              <div className="rounded-3xl bg-white/90 border border-white/80 p-5 shadow-lg surface-card">
                <div className="text-4xl">⚙️</div>
                <div className={`mt-4 text-2xl font-semibold ${fraunces.className}`}>Beheer</div>
                <p className="mt-2 text-gray-600 text-sm">Controle over locaties, uren en betalingen.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 staggered">
            <Link
              href="/volunteer/login"
              className="group relative overflow-hidden rounded-[32px] bg-white shadow-xl p-8 border border-white/70 transition hover:-translate-y-1 surface-card"
            >
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl transition group-hover:scale-110" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-5xl">🚴</div>
                  <span className="text-xs font-semibold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    VRIJWILLIGERS
                  </span>
                </div>
                <h2 className={`mt-5 text-3xl font-semibold ${fraunces.className} text-gray-900`}>Start een rit</h2>
                <p className="mt-2 text-gray-600">
                  Reserveer in een paar klikken en zie direct wat beschikbaar is.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  Naar reserveren
                  <span className="inline-block transition group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/login"
              className="group relative overflow-hidden rounded-[32px] bg-white shadow-xl p-8 border border-white/70 transition hover:-translate-y-1 surface-card"
            >
              <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl transition group-hover:scale-110" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-5xl">⚙️</div>
                  <span className="text-xs font-semibold tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    BEHEER
                  </span>
                </div>
                <h2 className={`mt-5 text-3xl font-semibold ${fraunces.className} text-gray-900`}>Beheer met rust</h2>
                <p className="mt-2 text-gray-600">
                  Houd locaties, ritten en betalingen helder en beheersbaar.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                  Naar beheer
                  <span className="inline-block transition group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="mt-16 rounded-[36px] bg-white/80 backdrop-blur border border-white/80 shadow-xl p-8 surface-card">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className={`text-3xl font-semibold ${fraunces.className}`}>Waarom dit werkt</h3>
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Rust • Ritme • Vertrouwen</div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
            <div className="rounded-2xl bg-white p-4 shadow-sm surface-card">
              <div className="text-sm font-semibold text-emerald-700">Beschikbaarheid</div>
              <p className="mt-2 text-sm">Realtime inzicht met buffer en heldere slots.</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm surface-card">
              <div className="text-sm font-semibold text-blue-700">Openingstijden</div>
              <p className="mt-2 text-sm">Per locatie beheerd, inclusief uitzonderingen.</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm surface-card">
              <div className="text-sm font-semibold text-indigo-700">Betalingen</div>
              <p className="mt-2 text-sm">Vaste prijs per rit en duidelijke transacties.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-8 text-center text-sm text-gray-500">
        &copy; 2026 Fietsmaatje. Samen op weg.
      </footer>
    </div>
  );
}
