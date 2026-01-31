'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { Button } from '@/components/button';
import { Card, CardTitle, CardDescription } from '@/components/card';
import { Alert } from '@/components/alert';
import { format } from 'date-fns';
import { HomeIcon, BikeIcon, CalendarIcon, AlertIcon, PinIcon, BellIcon } from '@/components/nav-icons';

interface Reservation {
  id: number;
  bike_id: number;
  bike_name?: string;
  location_id: number;
  location_name?: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
}

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
        <div className="space-y-4 mt-6">
          {activeTab.map((res) => {
            const startDate = new Date(res.start_datetime);
            const endDate = new Date(res.end_datetime);
            const isUpcoming = startDate > now && res.status === 'BOOKED';
            const statusColor =
              res.status === 'BOOKED'
                ? 'bg-blue-50 border-blue-200'
                : res.status === 'COMPLETED'
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200';
            const statusLabel =
              res.status === 'BOOKED'
                ? 'Geboekt'
                : res.status === 'COMPLETED'
                ? 'Voltooid'
                : 'Geannuleerd';

            return (
              <Card key={res.id} className={`${statusColor} border border-white/70 shadow-lg surface-card`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-4">
                  <div className="min-w-0">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {format(startDate, 'MMMM d')}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
                      {format(startDate, 'h:mm a')} tot {format(endDate, 'h:mm a')}
                    </div>
                    {res.location_name && (
                      <div className="text-base sm:text-lg text-gray-600 mt-3 break-words flex items-center gap-2">
                        <span className="text-gray-500"><PinIcon /></span>
                        <span>{res.location_name}</span>
                      </div>
                    )}
                    {res.bike_name && (
                      <div className="text-base sm:text-lg text-gray-600 break-words flex items-center gap-2">
                        <span className="text-gray-500"><BikeIcon /></span>
                        <span>{res.bike_name}</span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`self-start sm:self-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full text-base sm:text-lg font-bold whitespace-nowrap ${
                      res.status === 'BOOKED'
                        ? 'bg-blue-600 text-white'
                        : res.status === 'COMPLETED'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-400 text-white'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Cancel Confirmation Dialog */}
                {confirmCancel === res.id && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mt-6">
                    <p className="text-xl font-bold text-red-900 mb-4">
                      Weet je het zeker? Je kunt alleen tot 24 uur voor je rit annuleren.
                    </p>
                    <div className="flex gap-4">
                      <Button
                        variant="danger"
                        onClick={() => handleCancelReservation(res.id)}
                        className="flex-1"
                      >
                        Ja, reservering annuleren
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmCancel(null)}
                        className="flex-1"
                      >
                        Reservering behouden
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {isUpcoming && confirmCancel !== res.id && (
                  <Button
                    variant="danger"
                    onClick={() => setConfirmCancel(res.id)}
                    size="lg"
                    className="mt-6"
                  >
                    Deze rit annuleren
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </>
  );
}
