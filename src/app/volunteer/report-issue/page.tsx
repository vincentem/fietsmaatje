'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { HomeIcon, BikeIcon, CalendarIcon, AlertIcon, BellIcon } from '@/components/nav-icons';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';

interface Bike {
  id: number;
  code: string;
  name: string;
}

export default function ReportIssuePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [selectedBike, setSelectedBike] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('LOW');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navItems = [
    { label: 'Start', href: '/volunteer/dashboard', icon: <HomeIcon /> },
    { label: 'Reserveren', href: '/volunteer/find-bike', icon: <BikeIcon /> },
    { label: 'Reserveringen', href: '/volunteer/reservations', icon: <CalendarIcon /> },
    { label: 'Berichten', href: '/volunteer/notifications', icon: <BellIcon /> },
    { label: 'Probleem melden', href: '/volunteer/report-issue', icon: <AlertIcon /> },
  ];

  const categories = [
    { value: 'Flat Tire', label: '🛞 Lekke band' },
    { value: 'Brake Issues', label: '🛑 Remproblemen' },
    { value: 'Chain Problem', label: '⛓️ Kettingprobleem' },
    { value: 'Seat Issue', label: '💺 Zadelprobleem' },
    { value: 'Lock Problem', label: '🔒 Slotprobleem' },
    { value: 'Other', label: '❓ Overig' },
  ];

  const severityLevels = [
    { value: 'LOW', label: '🟢 Laag - Fiets is bruikbaar met voorzichtigheid', color: 'green' },
    { value: 'MEDIUM', label: '🟡 Midden - Zo snel mogelijk repareren', color: 'orange' },
    { value: 'HIGH', label: '🔴 Hoog - Niet gebruiken', color: 'red' },
  ];

  useEffect(() => {
    if (!token) {
      router.push('/volunteer/login');
      return;
    }
    fetchBikes();
  }, [token, router]);

  const fetchBikes = async () => {
    try {
      const response = await fetch('/api/bikes');
      if (response.ok) {
        setBikes(await response.json());
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!selectedBike || !category || !description) {
      setError('Vul alle verplichte velden in');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bike_id: parseInt(selectedBike),
          category,
          severity,
          description,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setSelectedBike('');
        setCategory('');
        setSeverity('LOW');
        setDescription('');
        setTimeout(() => router.push('/volunteer/dashboard'), 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Probleem melden mislukt');
      }
    } catch (err) {
      setError('Fout bij het melden van het probleem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SimpleNav items={navItems} />

      <main className="container-safe whitespace-breathing">
        <div className="max-w-2xl mx-auto">
          <h1>Probleem melden</h1>
          <p className="text-lg text-gray-600 mb-8">Help ons om de fietsen in topconditie te houden.</p>

          {error && (
            <Alert type="error" title="Verzenden mislukt" onDismiss={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" title="Bedankt!" onDismiss={() => setSuccess(false)}>
              Het probleem is doorgestuurd naar de beheerders. Je wordt doorgestuurd...
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-2xl font-bold text-gray-900 mb-4">
                Welke fiets? <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedBike}
                onChange={(e) => setSelectedBike(e.target.value)}
                className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                required
              >
                <option value="">Kies een fiets</option>
                {bikes.map((bike) => (
                  <option key={bike.id} value={bike.id}>
                    {bike.code} {bike.name ? `- ${bike.name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xl font-bold text-gray-900 mb-4">
                Wat is er aan de hand? <span className="text-red-600">*</span>
              </label>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <label
                    key={cat.value}
                    className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <input
                      type="radio"
                      value={cat.value}
                      checked={category === cat.value}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-6 h-6"
                    />
                    <span className="ml-4 text-xl font-semibold">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-2xl font-bold text-gray-900 mb-4">
                Hoe ernstig? <span className="text-red-600">*</span>
              </label>
              <div className="space-y-3">
                {severityLevels.map((level) => (
                  <label
                    key={level.value}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      severity === level.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={level.value}
                      checked={severity === level.value}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-6 h-6"
                    />
                    <span className="ml-4 text-xl font-semibold">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-2xl font-bold text-gray-900 mb-4">
                Beschrijf het probleem <span className="text-red-600">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                placeholder="Beschrijf wat er mis is zodat we het snel kunnen oplossen..."
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? '⏳ Bezig met verzenden...' : '✅ Probleem melden'}
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
