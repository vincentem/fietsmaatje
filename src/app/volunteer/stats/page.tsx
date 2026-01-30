'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { HomeIcon, BikeIcon, CalendarIcon, AlertIcon, BellIcon } from '@/components/nav-icons';

interface Stats {
  totalReservations: number;
  totalHours: number;
  completedRides: number;
}

export default function StatsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalReservations: 0,
    totalHours: 0,
    completedRides: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

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
    fetchStats();
  }, [token, router, user]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/reservations?volunteer_id=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const reservations = await response.json();

        let totalHours = 0;
        let completedRides = 0;

        reservations.forEach((res: any) => {
          const start = new Date(res.start_datetime);
          const end = new Date(res.end_datetime);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          totalHours += hours;

          if (res.status === 'COMPLETED') {
            completedRides++;
          }
        });

        setStats({
          totalReservations: reservations.length,
          totalHours: Math.round(totalHours * 10) / 10,
          completedRides,
        });
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SimpleNav items={navItems} />
      <main className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Jouw statistieken</h1>

        {isLoading ? (
          <div>Bezig met laden...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalReservations}
              </div>
              <p className="text-gray-600">Totaal reserveringen</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.totalHours}
              </div>
              <p className="text-gray-600">Totaal geboekte uren</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.completedRides}
              </div>
              <p className="text-gray-600">Afgeronde ritten</p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
