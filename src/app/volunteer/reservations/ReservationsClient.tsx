'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { Button } from '@/components/button';
import { Card, CardTitle, CardDescription } from '@/components/card';
import { Alert } from '@/components/alert';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { HomeIcon, BikeIcon, CalendarIcon, AlertIcon, PinIcon, BellIcon } from '@/components/nav-icons';

interface Reservation {
  id: number;
  bike_id: number;
  bike_name?: string;
  location_id: number;
  location_name?: string;
  start_datetime: string;
  end_datetime: string;
  status: 'BOOKED' | 'COMPLETED' | 'CANCELED';
}

const STATUS_CONFIG: Record<
  Reservation['status'],
  {
    label: string;
    badgeClass: string;
    dotClass: string;
    accentClass: string;
    pillColor: string;
  }
> = {
  BOOKED: {
    label: 'Geboekt',
    badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    dotClass: 'bg-emerald-500',
    accentClass: 'from-emerald-50/70 via-transparent to-transparent',
    pillColor: 'text-emerald-700',
  },
  COMPLETED: {
    label: 'Afgerond',
    badgeClass: 'bg-blue-100 text-blue-900 border border-blue-200',
    dotClass: 'bg-blue-500',
    accentClass: 'from-blue-50/70 via-transparent to-transparent',
    pillColor: 'text-blue-700',
  },
  CANCELED: {
    label: 'Geannuleerd',
    badgeClass: 'bg-gray-200 text-gray-800 border border-gray-300',
    dotClass: 'bg-gray-500',
    accentClass: 'from-gray-100/80 via-transparent to-transparent',
    pillColor: 'text-gray-700',
  },
};

type InfoPillProps = {
  icon: ReactNode;
  label: string;
  value: string;
  accentClass?: string;
};

function InfoPill({ icon, label, value, accentClass = 'text-gray-900' }: InfoPillProps) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
        <span className="text-gray-300">{icon}</span>
        {label}
      </div>
      <p className={`mt-2 text-lg font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const formatDutchDate = (date: Date) => capitalize(format(date, "EEEE d MMMM", { locale: nl }));
const formatDutchMonth = (date: Date) => format(date, 'MMM', { locale: nl }).toUpperCase();
const formatDutchDay = (date: Date) => format(date, 'd', { locale: nl });
const formatDutchTime = (date: Date) => format(date, 'HH:mm', { locale: nl });

export default function ReservationsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);

  const navItems = [
    { label: 'Start', href: '/volunteer/dashboard', icon: <HomeIcon /> },
    { label: 'Reserveren', href: '/volunteer/find-bike', icon: <BikeIcon /> },
    { label: 'Reserveringen', href: '/volunteer/reservations', icon: <CalendarIcon /> },
    { label: 'Berichten', href: '/volunteer/notifications', icon: <BellIcon /> },
    { label: 'Probleem melden', href: '/volunteer/report-issue', icon: <AlertIcon /> },
  ];

  useEffect(() => {
    if (!token) {
      router.push('/volunteer/login');
      return;
    }

    if (searchParams.get('success')) {
      setSuccessMessage(searchParams.get('success') || '');
    }

    fetchReservations();
  }, [token, router, searchParams]);

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/reservations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setReservations(await response.json());
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setConfirmCancel(null);
        fetchReservations();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const now = new Date();
  const upcomingReservations = reservations
    .filter((r) => new Date(r.start_datetime) > now && r.status === 'BOOKED')
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  const pastReservations = reservations
    .filter((r) => new Date(r.start_datetime) <= now || r.status === 'COMPLETED' || r.status === 'CANCELED')
    .sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());

  if (isLoading) {
    return (
      <>
        <SimpleNav items={navItems} />
        <main className="container-safe whitespace-breathing text-center">
          <p className="text-xl">Reserveringen laden...</p>
        </main>
      </>
    );
  }

  const activeTab = tab === 'upcoming' ? upcomingReservations : pastReservations;

  return (
    <>
      <SimpleNav items={navItems} />

      <main className="container-safe whitespace-breathing">
        <section className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-xl surface-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Reserveringen</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">Mijn reserveringen</h1>
              <p className="mt-2 text-gray-600">Overzicht van komende en afgeronde ritten.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTab('upcoming')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === 'upcoming'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 shadow-sm hover:text-gray-900'
                }`}
              >
                Aankomend ({upcomingReservations.length})
              </button>
              <button
                onClick={() => setTab('past')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === 'past'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 shadow-sm hover:text-gray-900'
                }`}
              >
                Verleden ({pastReservations.length})
              </button>
            </div>
          </div>
        </section>

        {successMessage && (
          <Alert type="success" onDismiss={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {/* Empty State */}
        {activeTab.length === 0 && (
          <Card className="text-center py-12 border border-white/70 bg-white/90 shadow-lg surface-card">
            <CardTitle className="mb-4 text-2xl">
              {tab === 'upcoming' ? 'Geen aankomende ritten' : 'Geen eerdere ritten'}
            </CardTitle>
            <CardDescription className="mb-8 text-gray-600">
              {tab === 'upcoming'
                ? 'Je hebt nog geen ritten gereserveerd. Zin om te fietsen?'
                : 'Je hebt nog geen ritten afgerond.'}
            </CardDescription>
            {tab === 'upcoming' && (
              <Button onClick={() => router.push('/volunteer/find-bike')}>
                Reserveer je eerste fiets
              </Button>
            )}
          </Card>
        )}

        {/* Reservations List */}
        <div className="mt-6 space-y-5">
          {activeTab.map((res) => {
            const startDate = new Date(res.start_datetime);
            const endDate = new Date(res.end_datetime);
            const isUpcoming = startDate > now && res.status === 'BOOKED';
            const statusConfig = STATUS_CONFIG[res.status] ?? STATUS_CONFIG.BOOKED;
            const locationLabel = res.location_name || `Locatie #${res.location_id}`;
            const bikeLabel = res.bike_name || `Fiets #${res.bike_id}`;

            return (
              <Card
                key={res.id}
                className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-xl surface-card"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${statusConfig.accentClass}`} />
                <div className="relative">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="rounded-3xl bg-white/90 px-4 py-3 text-center shadow-sm surface-card">
                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                          {formatDutchMonth(startDate)}
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{formatDutchDay(startDate)}</div>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">Tijdslot</p>
                        <p className="text-2xl font-semibold text-gray-900">{formatDutchDate(startDate)}</p>
                        <p className="text-lg text-gray-600">
                          {formatDutchTime(startDate)} - {formatDutchTime(endDate)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold ${statusConfig.badgeClass}`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dotClass}`} />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InfoPill
                      icon={<PinIcon />}
                      label="Locatie"
                      value={locationLabel}
                      accentClass={statusConfig.pillColor}
                    />
                    <InfoPill icon={<BikeIcon />} label="Fiets" value={bikeLabel} />
                    <InfoPill icon={<CalendarIcon />} label="Status" value={statusConfig.label} />
                  </div>

                  {confirmCancel === res.id ? (
                    <div className="mt-6 rounded-3xl border-2 border-red-200 bg-red-50 p-6">
                      <p className="text-lg font-semibold text-red-900">
                        Weet je het zeker? Annuleren kan tot 24 uur van tevoren.
                      </p>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Button
                          variant="danger"
                          onClick={() => handleCancelReservation(res.id)}
                          className="flex-1"
                        >
                          Ja, annuleren
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setConfirmCancel(null)}
                          className="flex-1"
                        >
                          Toch behouden
                        </Button>
                      </div>
                    </div>
                  ) : (
                    isUpcoming && (
                      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-500">Wil je deze rit niet meer rijden?</p>
                        <Button
                          variant="danger"
                          onClick={() => setConfirmCancel(res.id)}
                          size="lg"
                          className="sm:w-auto"
                        >
                          Deze rit annuleren
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </>
  );
}
