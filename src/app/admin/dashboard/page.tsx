'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/button';

interface User {
  id: number;
  name: string;
  role: string;
}

interface Reservation {
  id: number;
  bike_id: number;
  start_datetime: string;
  end_datetime: string;
  volunteer_id: number;
}

interface Issue {
  id: number;
  bike_id: number;
  severity: string;
  status: string;
}

interface Bike {
  id: number;
  code: string;
  status: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [openIssues, setOpenIssues] = useState<Issue[]>([]);
  const [outOfServiceBikes, setOutOfServiceBikes] = useState<Bike[]>([]);
  const [feeCents, setFeeCents] = useState<number>(1000);
  const [feeInput, setFeeInput] = useState<string>('10.00');
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeMessage, setFeeMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!savedToken || !savedUser) {
      router.push('/admin/login');
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    if (parsedUser.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }

    setToken(savedToken);
    setUser(parsedUser);
    fetchDashboardData(savedToken);
    fetchPricing(savedToken);
  }, [router]);

  const fetchPricing = async (token: string) => {
    try {
      const response = await fetch('/api/settings/pricing');
      if (!response.ok) return;
      const data = await response.json();
      if (typeof data.fee_cents === 'number') {
        setFeeCents(data.fee_cents);
        setFeeInput((data.fee_cents / 100).toFixed(2));
      }
    } catch (err) {
      console.error('Error loading pricing', err);
    }
  };

  const fetchDashboardData = async (token: string) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch today's reservations
      const resResponse = await fetch('/api/reservations?status=BOOKED');
      if (resResponse.ok) {
        const allRes = await resResponse.json();
        const todayRes = allRes.filter((r: Reservation) =>
          format(new Date(r.start_datetime), 'yyyy-MM-dd') === today
        );
        setReservations(todayRes);
      }

      // Fetch open issues
      const issuesResponse = await fetch('/api/issues?status=OPEN');
      if (issuesResponse.ok) {
        setOpenIssues(await issuesResponse.json());
      }

      // Fetch out of service bikes
      const bikesResponse = await fetch('/api/bikes');
      if (bikesResponse.ok) {
        const bikes = await bikesResponse.json();
        setOutOfServiceBikes(bikes.filter((b: Bike) => b.status === 'OUT_OF_SERVICE'));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  if (!user || !token) {
    return <div>Bezig met laden...</div>;
  }

  const saveFee = async () => {
    setFeeSaving(true);
    setFeeMessage('');
    const parsed = Number(feeInput.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setFeeMessage('Ongeldige prijs');
      setFeeSaving(false);
      return;
    }
    const nextCents = Math.round(parsed * 100);
    try {
      const response = await fetch('/api/settings/pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fee_cents: nextCents }),
      });
      if (response.ok) {
        setFeeCents(nextCents);
        setFeeMessage('Opgeslagen');
      } else {
        setFeeMessage('Opslaan mislukt');
      }
    } catch (err) {
      console.error('Error saving fee', err);
      setFeeMessage('Opslaan mislukt');
    } finally {
      setFeeSaving(false);
      setTimeout(() => setFeeMessage(''), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f5fb]">
      <nav className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Beheer</p>
            <h1 className="text-2xl font-semibold text-gray-900">Fietsmaatje</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-600 shadow-sm">
              {user.name}
            </span>
            <Button variant="secondary" size="sm" onClick={logout} className="w-auto">
              Uitloggen
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Vandaag overzicht en snelle acties.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/reservations" className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
              Reserveringen
            </Link>
            <Link href="/admin/issues" className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
              Issues
            </Link>
            <Link href="/admin/transactions" className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
              Transacties
            </Link>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-[28px] bg-white/90 border border-white/80 p-5 shadow-lg surface-card">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Reserveringen</div>
            <div className="mt-3 text-3xl font-semibold text-emerald-700">{reservations.length}</div>
            <p className="text-sm text-gray-500">Vandaag gepland</p>
          </div>
          <div className="rounded-[28px] bg-white/90 border border-white/80 p-5 shadow-lg surface-card">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Open issues</div>
            <div className="mt-3 text-3xl font-semibold text-amber-700">{openIssues.length}</div>
            <p className="text-sm text-gray-500">In behandeling</p>
          </div>
          <div className="rounded-[28px] bg-white/90 border border-white/80 p-5 shadow-lg surface-card">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Niet inzetbaar</div>
            <div className="mt-3 text-3xl font-semibold text-red-600">{outOfServiceBikes.length}</div>
            <p className="text-sm text-gray-500">Fietsen offline</p>
          </div>
          <div className="rounded-[28px] bg-white/90 border border-white/80 p-5 shadow-lg surface-card">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Prijs</div>
            <div className="mt-3 text-3xl font-semibold text-blue-700">EUR {(feeCents / 100).toFixed(2)}</div>
            <p className="text-sm text-gray-500">Per reservering</p>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-6">
          <div className="rounded-[32px] bg-white/90 border border-white/80 p-6 shadow-xl surface-card">
            <h3 className="text-xl font-semibold mb-4">Snelle acties</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/admin/bikes" className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm hover:shadow-lg transition surface-card">
                <div className="text-3xl mb-2">🚲</div>
                <div className="text-lg font-semibold">Fietsen beheren</div>
                <p className="text-sm text-gray-600">Status en onderhoud bijwerken.</p>
              </Link>
              <Link href="/admin/locations" className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm hover:shadow-lg transition surface-card">
                <div className="text-3xl mb-2">📍</div>
                <div className="text-lg font-semibold">Locaties beheren</div>
                <p className="text-sm text-gray-600">Openingstijden en uitzonderingen.</p>
              </Link>
              <Link href="/admin/users" className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm hover:shadow-lg transition surface-card">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-lg font-semibold">Gebruikers beheren</div>
                <p className="text-sm text-gray-600">Rollen en accounts beheren.</p>
              </Link>
              <Link href="/admin/reservations" className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm hover:shadow-lg transition surface-card">
                <div className="text-3xl mb-2">🗓️</div>
                <div className="text-lg font-semibold">Reserveringen</div>
                <p className="text-sm text-gray-600">Overzicht en planning.</p>
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] bg-white/90 border border-white/80 p-6 shadow-xl surface-card">
              <h3 className="text-xl font-semibold mb-4">Reserveringsprijs</h3>
              <p className="text-sm text-gray-600 mb-4">Vaste prijs per reservering (EUR).</p>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="w-full sm:w-40">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prijs</label>
                  <input
                    type="text"
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2"
                    placeholder="10.00"
                  />
                </div>
                <Button
                  onClick={saveFee}
                  disabled={feeSaving}
                  className="w-auto"
                >
                  {feeSaving ? 'Opslaan...' : 'Opslaan'}
                </Button>
                {feeMessage && <span className="text-sm text-gray-600">{feeMessage}</span>}
              </div>
              <p className="mt-3 text-sm text-gray-600">Huidig: EUR {(feeCents / 100).toFixed(2)}</p>
            </div>

            <div className="rounded-[28px] bg-white/90 border border-white/80 p-6 shadow-xl surface-card">
              <h3 className="text-xl font-semibold mb-4">Reserveringen van vandaag</h3>
              {isLoading ? (
                <p>Bezig met laden...</p>
              ) : reservations.length === 0 ? (
                <p className="text-gray-600">Geen reserveringen vandaag</p>
              ) : (
                <div className="space-y-2">
                  {reservations.slice(0, 5).map((res) => (
                    <div key={res.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                      <p className="font-medium">Fiets #{res.bike_id}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(res.start_datetime), 'HH:mm')} -{' '}
                        {format(new Date(res.end_datetime), 'HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] bg-white/90 border border-white/80 p-6 shadow-xl surface-card">
              <h3 className="text-xl font-semibold mb-4">Open meldingen ({openIssues.length})</h3>
              {openIssues.length === 0 ? (
                <p className="text-gray-600">Geen open meldingen</p>
              ) : (
                <div className="space-y-2">
                  {openIssues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                      <p className="font-medium">Fiets #{issue.bike_id}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          issue.severity === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : issue.severity === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {issue.severity === 'HIGH' ? 'Hoog' : issue.severity === 'MEDIUM' ? 'Midden' : 'Laag'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/admin/issues" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
                Alles bekijken →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
