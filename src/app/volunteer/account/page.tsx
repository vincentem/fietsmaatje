'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { Card, CardTitle, CardDescription } from '@/components/card';
import { Alert } from '@/components/alert';
import { HomeIcon, BikeIcon, CalendarIcon, BellIcon } from '@/components/nav-icons';

interface AccountUser {
  id: number;
  name: string;
  email: string;
  role: string;
  balance_cents: number;
}

export default function AccountPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
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
    const loadAccount = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data.error || 'Account ophalen mislukt');
          return;
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error('Error loading account:', err);
        setError('Account ophalen mislukt');
      } finally {
        setIsLoading(false);
      }
    };
    loadAccount();
  }, [token, authLoading, router]);

  return (
    <>
      <SimpleNav items={navItems} />
      <main className="container-safe whitespace-breathing">
        <div className="max-w-3xl mx-auto">
          <h1>Mijn account</h1>
          <p className="text-lg text-gray-600 mb-8">Profielgegevens en beschikbaar tegoed.</p>

          {error && <Alert type="error">{error}</Alert>}

          {authLoading || isLoading ? (
            <p className="text-lg">Account laden...</p>
          ) : (
            <div className="space-y-6">
              <Card className="bg-blue-50 border-blue-300">
                <CardTitle className="mb-2">Beschikbaar saldo</CardTitle>
                <div className="text-lg text-gray-600 leading-relaxed">
                <span className="block text-4xl font-bold text-blue-700">
                  EUR {((user?.balance_cents ?? 0) / 100).toFixed(2)}
                </span>
                  <span className="block text-gray-600 mt-2">Account: {user?.name}</span>
                </div>
              </Card>

              <Card>
                <CardTitle className="mb-2">Profiel</CardTitle>
                <CardDescription className="space-y-2">
                  <span className="block">
                    <strong className="text-gray-900">Naam:</strong> {user?.name}
                  </span>
                  <span className="block">
                    <strong className="text-gray-900">E-mail:</strong> {user?.email}
                  </span>
                  <span className="block">
                    <strong className="text-gray-900">Rol:</strong> {user?.role}
                  </span>
                </CardDescription>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
