'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { Alert } from '@/components/alert';
import { Card, CardTitle, CardDescription } from '@/components/card';
import { HomeIcon, BikeIcon, CalendarIcon, AlertIcon, BellIcon } from '@/components/nav-icons';
import { format } from 'date-fns';

interface UserNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  payload: any;
  status: 'unread' | 'read';
  created_at: string;
  read_at?: string | null;
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
    loadNotifications();
  }, [token, router]);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/user-notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Berichten laden mislukt');
        return;
      }
      setItems(await response.json());
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError('Berichten laden mislukt');
    } finally {
      setIsLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      const response = await fetch(`/api/user-notifications/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'read', read_at: new Date().toISOString() } : n)));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const renderDetails = (payload: any) => {
    if (!payload) return null;
    if (payload.reservation) {
      const r = payload.reservation;
      return (
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          <div>Locatie: {r.location_name || `#${r.location_id}`}</div>
          <div>Fiets: {r.bike_name || `#${r.bike_id}`}</div>
          <div>
            Tijd: {format(new Date(r.start_datetime), 'dd MMM, HH:mm')} – {format(new Date(r.end_datetime), 'HH:mm')}
          </div>
        </div>
      );
    }
    if (payload.payment) {
      const p = payload.payment;
      return (
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          <div>Bedrag: EUR {(p.amount_cents / 100).toFixed(2)}</div>
          <div>Methode: {p.method || 'onbekend'}</div>
          <div>Status: {p.status}</div>
          {p.transaction_id && <div>Transactie: #{p.transaction_id}</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <SimpleNav items={navItems} />
      <main className="container-safe whitespace-breathing">
        <section className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-xl surface-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Berichten</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">Updates & meldingen</h1>
              <p className="mt-2 text-gray-600">Boekingen, betalingen en belangrijke updates.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500 shadow-sm">
              {items.filter((i) => i.status === 'unread').length} nieuw
            </span>
          </div>
        </section>

        {error && <Alert type="error">{error}</Alert>}

        {isLoading ? (
          <p className="text-lg mt-6">Berichten laden...</p>
        ) : items.length === 0 ? (
          <Card className="mt-6 text-center py-12 surface-card">
            <CardTitle>Geen berichten</CardTitle>
            <CardDescription>Je ziet hier updates over boekingen en betalingen.</CardDescription>
          </Card>
        ) : (
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="surface-card">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                      {item.status === 'unread' && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Nieuw
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{item.body}</p>
                    {renderDetails(item.payload)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(new Date(item.created_at), 'dd MMM, HH:mm')}
                  </div>
                </div>
                {item.status === 'unread' && (
                  <button
                    onClick={() => markRead(item.id)}
                    className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:text-gray-900"
                  >
                    Markeer als gelezen
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
