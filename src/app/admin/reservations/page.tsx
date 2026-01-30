'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Reservation {
  id: number;
  bike_id: number;
  volunteer_id: number;
  start_datetime: string;
  end_datetime: string;
  status: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      router.push('/admin/login');
      return;
    }
    setToken(savedToken);
    fetchReservations(savedToken);
  }, [router]);

  const fetchReservations = async (token: string) => {
    try {
      const response = await fetch('/api/reservations');
      if (response.ok) {
        setReservations(await response.json());
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f5fb]">
      <nav className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin/dashboard" className="text-lg font-semibold text-gray-900">
            Fietsmaatje · Beheer
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Reserveringen</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Alle reserveringen</h1>
            <p className="text-gray-600">Overzicht van alle boekingen in het systeem.</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm"
          >
            Terug naar dashboard
          </Link>
        </div>

        {isLoading ? (
          <p>Bezig met laden...</p>
        ) : (
          <div className="rounded-[28px] bg-white/90 border border-white/80 shadow-xl overflow-hidden surface-card">
            <table className="w-full text-sm">
              <thead className="bg-white/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.2em] text-gray-400">Fiets</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.2em] text-gray-400">Vrijwilliger</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.2em] text-gray-400">Start</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.2em] text-gray-400">Einde</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.2em] text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.id} className="border-b border-gray-100 hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-semibold text-gray-900">#{res.bike_id}</td>
                    <td className="px-6 py-4 text-gray-600">Gebruiker #{res.volunteer_id}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {format(new Date(res.start_datetime), 'dd MMM, HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {format(new Date(res.end_datetime), 'dd MMM, HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          res.status === 'BOOKED'
                            ? 'bg-blue-100 text-blue-800'
                            : res.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {res.status === 'BOOKED' ? 'Geboekt' : res.status === 'COMPLETED' ? 'Voltooid' : 'Geannuleerd'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
