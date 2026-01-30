'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { Card, CardTitle, CardDescription } from '@/components/card';
import { Alert } from '@/components/alert';
import { HomeIcon, BikeIcon, CalendarIcon, BellIcon } from '@/components/nav-icons';

interface BalanceUser {
  id: number;
  name: string;
  balance_cents: number;
}

export default function BalancePage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<BalanceUser | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const navItems = [
    { label: 'Start', href: '/volunteer/dashboard', icon: <HomeIcon /> },
    { label: 'Reserveren', href: '/volunteer/find-bike', icon: <BikeIcon /> },
    { label: 'Reserveringen', href: '/volunteer/reservations', icon: <CalendarIcon /> },
    { label: 'Berichten', href: '/volunteer/notifications', icon: <BellIcon /> },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/volunteer/login');
      return;
    }
    const loadBalance = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data.error || 'Saldo ophalen mislukt');
          return;
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error('Error loading balance:', err);
        setError('Saldo ophalen mislukt');
      } finally {
        setIsLoading(false);
      }
    };
    loadBalance();
  }, [token, authLoading, router]);

  return (
    <>
      <SimpleNav items={navItems} />
      <main className="container-safe whitespace-breathing">
        <div className="max-w-2xl mx-auto">
          <h1>Jouw saldo</h1>
          <p className="text-lg text-gray-600 mb-8">Bekijk je beschikbare rittegoed.</p>

          {error && <Alert type="error">{error}</Alert>}

          {authLoading || isLoading ? (
            <p className="text-lg">Saldo laden...</p>
          ) : (
            <Card className="bg-blue-50 border-blue-300">
              <CardTitle className="mb-2">Beschikbaar saldo</CardTitle>
              <div className="text-lg text-gray-600 leading-relaxed">
                <span className="block text-4xl font-bold text-blue-700">
                  EUR {((user?.balance_cents ?? 0) / 100).toFixed(2)}
                </span>
                <span className="block text-gray-600 mt-2">Account: {user?.name}</span>
              </div>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
