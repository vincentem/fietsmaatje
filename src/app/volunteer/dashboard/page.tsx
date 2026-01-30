'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { Button } from '@/components/button';
import { Card, CardTitle, CardDescription } from '@/components/card';
import { BikeIcon, CalendarIcon, AlertIcon, BellIcon } from '@/components/nav-icons';

interface NextReservation {
  id: number;
  start_datetime: string;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [nextReservation, setNextReservation] = useState<NextReservation | null>(null);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/volunteer/login');
      return;
    }
    fetchDashboardSummary();
  }, [token, router]);

  const fetchDashboardSummary = async () => {
    try {
      const response = await fetch('/api/volunteer/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBalanceCents(typeof data.balance_cents === 'number' ? data.balance_cents : null);
        setTotalCompleted(typeof data.total_completed === 'number' ? data.total_completed : 0);
        setNextReservation(data.next_reservation ?? null);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { label: 'Reserveren', href: '/volunteer/find-bike', icon: <BikeIcon /> },
    { label: 'Reserveringen', href: '/volunteer/reservations', icon: <CalendarIcon /> },
    { label: 'Berichten', href: '/volunteer/notifications', icon: <BellIcon /> },
    { label: 'Probleem melden', href: '/volunteer/report-issue', icon: <AlertIcon /> },
  ];

  if (isLoading) {
    return (
      <>
        <SimpleNav items={navItems} />
        <main className="container-safe whitespace-breathing text-center">
          <p className="text-xl">Bezig met laden...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <SimpleNav items={navItems} />

      <main className="container-safe whitespace-breathing">
        <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-2xl surface-card">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute left-1/2 top-6 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
          </div>
          <div className="relative">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">Welkom terug</p>
                <h1 className="mt-2 text-3xl font-semibold text-gray-900">Hoi {user?.name}!</h1>
                <p className="mt-2 text-gray-600">
                  Je hebt {totalCompleted} ritten voltooid. Klaar voor een nieuwe?
                </p>
              </div>
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm surface-card">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Saldo</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-700">
                  EUR {((balanceCents ?? 0) / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Beschikbaar</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border border-white/70 bg-white/90 shadow-sm surface-card">
                <CardTitle className="text-xl">Volgende rit</CardTitle>
                {nextReservation ? (
                  <CardDescription className="text-gray-700">
                    <div className="text-2xl font-semibold text-blue-700">
                      {new Date(nextReservation.start_datetime).toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="mt-1 text-lg">
                      {new Date(nextReservation.start_datetime).toLocaleTimeString('nl-NL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </CardDescription>
                ) : (
                  <CardDescription className="text-gray-600">
                    Geen rit gepland. Plan een nieuwe rit om op pad te gaan.
                  </CardDescription>
                )}
              </Card>

              <Card className="border border-white/70 bg-white/90 shadow-sm surface-card">
                <CardTitle className="text-xl">Ritten</CardTitle>
                <CardDescription className="text-gray-700">
                  <div className="text-3xl font-semibold text-gray-900">{totalCompleted}</div>
                  <div className="text-sm text-gray-500">Voltooid tot nu toe</div>
                </CardDescription>
              </Card>

              <Card className="border border-white/70 bg-white/90 shadow-sm surface-card">
                <CardTitle className="text-xl">Beschikbaar vandaag</CardTitle>
                <CardDescription className="text-gray-700">
                  <div className="text-3xl font-semibold text-emerald-700">Open</div>
                  <div className="text-sm text-gray-500">Check beschikbare tijdsloten</div>
                </CardDescription>
              </Card>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 staggered">
            <button
              onClick={() => router.push('/volunteer/find-bike')}
              className="group rounded-[28px] border border-white/70 bg-white/90 p-6 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl surface-card"
            >
              <div className="text-3xl">🚴</div>
              <div className="mt-4 text-xl font-semibold text-gray-900">Reserveer een fiets</div>
              <p className="mt-2 text-sm text-gray-600">Zoek een tijdslot en bevestig je rit.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                Starten <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </button>

            <button
              onClick={() => router.push('/volunteer/reservations')}
              className="group rounded-[28px] border border-white/70 bg-white/90 p-6 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl surface-card"
            >
              <div className="text-3xl">🗓️</div>
              <div className="mt-4 text-xl font-semibold text-gray-900">Mijn reserveringen</div>
              <p className="mt-2 text-sm text-gray-600">Bekijk en beheer je aankomende ritten.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                Overzicht <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </button>

            <button
              onClick={() => router.push('/volunteer/report-issue')}
              className="group rounded-[28px] border border-white/70 bg-white/90 p-6 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl surface-card"
            >
              <div className="text-3xl">⚠️</div>
              <div className="mt-4 text-xl font-semibold text-gray-900">Probleem melden</div>
              <p className="mt-2 text-sm text-gray-600">Geef onderhoud snel en duidelijk door.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                Melden <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
