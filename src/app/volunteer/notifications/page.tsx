'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { Alert } from '@/components/alert';
import { Card, CardTitle, CardDescription } from '@/components/card';
import { Button } from '@/components/button';
import {
  HomeIcon,
  BikeIcon,
  CalendarIcon,
  AlertIcon,
  BellIcon,
  PinIcon,
} from '@/components/nav-icons';

type NotificationPayload = {
  reservation?: {
    id: number;
    location_id: number;
    location_name?: string | null;
    bike_id: number;
    bike_name?: string | null;
    bike_code?: string | null;
    start_datetime: string;
    end_datetime: string;
    status: string;
  };
  payment?: {
    transaction_id?: number;
    amount_cents: number;
    status: string;
    method?: string | null;
  };
};

interface UserNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  payload?: NotificationPayload | null;
  status: 'unread' | 'read';
  created_at: string;
  read_at?: string | null;
}

type FilterValue = 'all' | 'unread';

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: 'all', label: 'Alle berichten' },
  { value: 'unread', label: 'Ongelezen' },
];

const TYPE_META = {
  booking: {
    label: 'Reservering',
    icon: '🗓️',
    gradient: 'from-sky-50/80 via-transparent to-transparent',
  },
  payment: {
    label: 'Betaling',
    icon: '💶',
    gradient: 'from-amber-50/70 via-transparent to-transparent',
  },
  default: {
    label: 'Bericht',
    icon: '🔔',
    gradient: 'from-slate-50/80 via-transparent to-transparent',
  },
};

const parsePayload = (payload: unknown): NotificationPayload | null => {
  if (!payload) return null;
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
  return payload as NotificationPayload;
};

const getTypeMeta = (type: string) => {
  if (type.startsWith('booking')) return TYPE_META.booking;
  if (type.startsWith('payment')) return TYPE_META.payment;
  return TYPE_META.default;
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');

  const navItems = [
    { label: 'Start', href: '/volunteer/dashboard', icon: <HomeIcon /> },
    { label: 'Reserveren', href: '/volunteer/find-bike', icon: <BikeIcon /> },
    { label: 'Reserveringen', href: '/volunteer/reservations', icon: <CalendarIcon /> },
    { label: 'Berichten', href: '/volunteer/notifications', icon: <BellIcon /> },
    { label: 'Probleem melden', href: '/volunteer/report-issue', icon: <AlertIcon /> },
  ];

  const unreadCount = useMemo(
    () => items.filter((item) => item.status === 'unread').length,
    [items]
  );

  useEffect(() => {
    if (!token) {
      router.push('/volunteer/login');
      return;
    }
    loadNotifications();
  }, [token, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('notifications:refresh', { detail: { unread: unreadCount } })
    );
  }, [unreadCount]);

  const loadNotifications = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/user-notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Berichten laden mislukt');
        return;
      }
      const data = await response.json();
      const normalized: UserNotification[] = Array.isArray(data)
        ? data.map((item) => ({
            ...item,
            payload: parsePayload(item.payload),
          }))
        : [];
      normalized.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setItems(normalized);
      setError('');
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError('Berichten laden mislukt');
    } finally {
      setIsLoading(false);
    }
  };

  const markNotificationRead = async (id: number) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/user-notifications/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      setItems((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, status: 'read', read_at: new Date().toISOString() }
            : notification
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = items.filter((item) => item.status === 'unread').map((item) => item.id);
    await Promise.all(unreadIds.map((id) => markNotificationRead(id)));
  };

  const visibleItems =
    filter === 'all' ? items : items.filter((notification) => notification.status === 'unread');
  const lastUpdatedLabel =
    items.length > 0
      ? formatDistanceToNow(new Date(items[0].created_at), { locale: nl, addSuffix: true })
      : 'Nog geen berichten';

  const showEmptyState = !isLoading && items.length === 0;
  const showFilteredEmpty = !isLoading && items.length > 0 && visibleItems.length === 0;

  return (
    <>
      <SimpleNav items={navItems} />
      <main className="container-safe whitespace-breathing">
        <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-2xl surface-card">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute left-4 -bottom-10 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Berichten</p>
              <h1 className="mt-2 text-4xl font-semibold text-gray-900">Updates & meldingen</h1>
              <p className="mt-2 max-w-2xl text-lg text-gray-600">
                Volg reserveringen, betalingen en serviceberichten vanuit één overzicht.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 rounded-[28px] border border-white/70 bg-white/90 p-5 text-sm text-gray-500 shadow-lg surface-card sm:grid-cols-3">
              <HeroStat label="Nieuwe berichten" value={unreadCount} accent="text-emerald-600" />
              <HeroStat label="Totaal" value={items.length} accent="text-blue-600" />
              <HeroStat label="Laatste update" value={lastUpdatedLabel} accent="text-gray-700" />
            </div>
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 rounded-full border border-white/70 bg-white/80 p-1 shadow-sm surface-card">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === option.value
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
                {option.value === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="md"
              fullWidth={false}
              onClick={loadNotifications}
              disabled={isLoading}
            >
              {isLoading ? 'Laden...' : 'Vernieuwen'}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="primary"
                size="md"
                fullWidth={false}
                onClick={handleMarkAllRead}
              >
                Markeer alles als gelezen
              </Button>
            )}
          </div>
        </section>

        {error && (
          <div className="mt-6">
            <Alert type="error" onDismiss={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {isLoading && (
          <Card className="mt-6 border border-white/70 bg-white/90 p-8 text-center text-gray-600 surface-card">
            <p>Berichten laden...</p>
          </Card>
        )}

        {showEmptyState && (
          <Card className="mt-6 border border-white/70 bg-white/95 p-10 text-center surface-card">
            <CardTitle className="text-2xl">Geen berichten</CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              Je ontvangt hier meldingen over reserveringen, betalingen en onderhoud.
            </CardDescription>
          </Card>
        )}

        {showFilteredEmpty && (
          <Card className="mt-6 border border-white/70 bg-white/95 p-8 text-center surface-card">
            <CardTitle className="text-xl">Geen ongelezen berichten</CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              Alles is bijgewerkt. Mooi zo!
            </CardDescription>
          </Card>
        )}

        {!isLoading && visibleItems.length > 0 && (
          <div className="mt-6 space-y-5">
            {visibleItems.map((item) => (
              <NotificationCard key={item.id} item={item} onMarkRead={markNotificationRead} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

type HeroStatProps = {
  label: string;
  value: string | number;
  accent?: string;
};

function HeroStat({ label, value, accent = 'text-gray-900' }: HeroStatProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

type DetailPillProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function DetailPill({ icon, label, value }: DetailPillProps) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/95 p-4 shadow-sm surface-card">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
        <span className="text-gray-300">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
}

type NotificationCardProps = {
  item: UserNotification;
  onMarkRead: (id: number) => void;
};

function NotificationCard({ item, onMarkRead }: NotificationCardProps) {
  const meta = getTypeMeta(item.type);
  const payload = item.payload || undefined;
  const reservation = payload?.reservation;
  const payment = payload?.payment;
  const createdAt = new Date(item.created_at);
  const formattedDate = format(createdAt, "d MMMM yyyy 'om' HH:mm", { locale: nl });
  const relativeDate = formatDistanceToNow(createdAt, { locale: nl, addSuffix: true });

  return (
    <Card className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-xl surface-card">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${meta.gradient}`} />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-inner surface-card">
              {meta.icon}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{meta.label}</p>
              <h2 className="text-2xl font-semibold text-gray-900">{item.title}</h2>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>{formattedDate}</p>
            <p className="text-xs text-gray-400">{relativeDate}</p>
          </div>
        </div>

        <p className="text-base text-gray-700">{item.body}</p>

        {reservation && (
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailPill
              icon={<PinIcon />}
              label="Locatie"
              value={reservation.location_name || `Locatie #${reservation.location_id}`}
            />
            <DetailPill
              icon={<BikeIcon />}
              label="Fiets"
              value={
                reservation.bike_name ||
                reservation.bike_code ||
                `Fiets #${reservation.bike_id}`
              }
            />
            <DetailPill
              icon={<CalendarIcon />}
              label="Tijdslot"
              value={`${format(new Date(reservation.start_datetime), "d MMM HH:mm", { locale: nl })} – ${format(
                new Date(reservation.end_datetime),
                'HH:mm',
                { locale: nl }
              )}`}
            />
          </div>
        )}

        {payment && (
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailPill
              icon="💶"
              label="Bedrag"
              value={`€ ${(payment.amount_cents / 100).toFixed(2)}`}
            />
            <DetailPill icon="💳" label="Methode" value={payment.method || 'Onbekend'} />
            <DetailPill icon="🧾" label="Status" value={payment.status} />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                item.status === 'unread' ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            />
            {item.status === 'unread' ? 'Ongelezen' : 'Gelezen'}
          </span>
          {item.status === 'unread' && (
            <Button
              variant='secondary'
              size='md'
              fullWidth={false}
              className="sm:w-auto"
              onClick={() => onMarkRead(item.id)}
            >
              Markeer als gelezen
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
