'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SimpleNav } from '@/components/simple-nav';
import { HomeIcon, BikeIcon, CalendarIcon, AlertIcon, BellIcon } from '@/components/nav-icons';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';
import { Card, CardTitle, CardDescription } from '@/components/card';

interface Bike {
  id: number;
  code: string;
  name: string;
}

const ISSUE_CATEGORIES = [
  {
    value: 'Flat Tire',
    title: 'Lekke band',
    description: 'Band is zacht of helemaal leeg.',
    icon: '🛞',
  },
  {
    value: 'Brake Issues',
    title: 'Remproblemen',
    description: 'Remt slecht of helemaal niet.',
    icon: '🛑',
  },
  {
    value: 'Chain Problem',
    title: 'Ketting',
    description: 'Ketting ligt eraf of loopt vast.',
    icon: '⛓️',
  },
  {
    value: 'Seat Issue',
    title: 'Zadel',
    description: 'Zadel zit los of is beschadigd.',
    icon: '💺',
  },
  {
    value: 'Lock Problem',
    title: 'Slot',
    description: 'Slot opent niet of draait niet dicht.',
    icon: '🔒',
  },
  {
    value: 'Other',
    title: 'Overig',
    description: 'Iets anders dat je wilt melden.',
    icon: '❓',
  },
] as const;

type SeverityValue = 'LOW' | 'MEDIUM' | 'HIGH';

const SEVERITY_LEVELS: Record<
  SeverityValue,
  {
    title: string;
    description: string;
    badge: string;
  }
> = {
  LOW: {
    title: 'Laag',
    description: 'Fiets is bruikbaar met een kleine waarschuwing.',
    badge: '🟢',
  },
  MEDIUM: {
    title: 'Gemiddeld',
    description: 'Zo snel mogelijk oplossen om problemen te voorkomen.',
    badge: '🟡',
  },
  HIGH: {
    title: 'Hoog',
    description: 'Niet gebruiken; direct uit de roulatie halen.',
    badge: '🔴',
  },
};

type CategoryCardProps = {
  isActive: boolean;
  onSelect: () => void;
  icon: string;
  title: string;
  description: string;
};

function CategoryCard({ isActive, onSelect, icon, title, description }: CategoryCardProps) {
  return (
    <label
      className={`group relative block cursor-pointer rounded-[28px] border-2 p-5 transition ${
        isActive
          ? 'border-emerald-500 bg-emerald-50/80 shadow-lg'
          : 'border-white/70 bg-white/80 hover:border-emerald-300 hover:bg-white'
      }`}
    >
      <input type="radio" className="sr-only" checked={isActive} onChange={onSelect} />
      <div className="flex items-start gap-4">
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        {isActive && (
          <span className="ml-auto text-sm font-semibold text-emerald-600">Geselecteerd</span>
        )}
      </div>
    </label>
  );
}

type SeverityOptionProps = {
  value: SeverityValue;
  isActive: boolean;
  onSelect: () => void;
};

function SeverityOption({ value, isActive, onSelect }: SeverityOptionProps) {
  const option = SEVERITY_LEVELS[value];
  return (
    <label
      className={`relative block cursor-pointer rounded-[28px] border-2 p-5 transition ${
        isActive
          ? 'border-blue-500 bg-blue-50/80 shadow-lg'
          : 'border-white/70 bg-white/80 hover:border-blue-300'
      }`}
    >
      <input type="radio" className="sr-only" value={value} checked={isActive} onChange={onSelect} />
      <div className="flex items-start gap-4">
        <div className="text-2xl">{option.badge}</div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{option.title}</p>
          <p className="text-sm text-gray-500">{option.description}</p>
        </div>
        {isActive && (
          <span className="ml-auto text-sm font-semibold text-blue-600">Geselecteerd</span>
        )}
      </div>
    </label>
  );
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
        <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-2xl surface-card">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className="absolute left-4 -bottom-10 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Onderhoud</p>
              <h1 className="mt-2 text-4xl font-semibold text-gray-900">Probleem melden</h1>
              <p className="mt-2 max-w-xl text-lg text-gray-600">
                Help ons de duo fietsen veilig te houden. Deel zo veel mogelijk informatie, dan kunnen we
                gericht onderhoud inplannen.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-lg surface-card">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Gemiddelde reactietijd</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-700">< 2 uur</p>
              <p className="text-sm text-gray-500">Een beheerder neemt snel contact op.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {['Beschrijf het probleem', 'Kies prioriteit', 'Verstuur & volg'].map((title, index) => (
            <Card key={title} className="border border-white/70 bg-white/90 p-5 shadow-sm surface-card">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">
                Stap {index + 1}
              </CardTitle>
              <CardDescription className="mt-2 text-base text-gray-700">{title}</CardDescription>
            </Card>
          ))}
        </section>

        <div className="mx-auto mt-8 max-w-3xl space-y-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border border-white/80 bg-white/95 p-6 shadow-sm surface-card">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Welke fiets heeft aandacht nodig?
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-500">
                Kies de fiets waarop je het probleem hebt gezien.
              </CardDescription>
              <select
                value={selectedBike}
                onChange={(e) => setSelectedBike(e.target.value)}
                className="mt-4 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-lg font-medium text-gray-900 shadow-inner focus:border-emerald-500 focus:outline-none"
                required
              >
                <option value="">Selecteer een fiets</option>
                {bikes.map((bike) => (
                  <option key={bike.id} value={bike.id}>
                    {bike.code} {bike.name ? `- ${bike.name}` : ''}
                  </option>
                ))}
              </select>
            </Card>

            <Card className="border border-white/80 bg-white/95 p-6 shadow-sm surface-card">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Wat is er aan de hand?
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-500">
                Selecteer de categorie die het beste past.
              </CardDescription>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {ISSUE_CATEGORIES.map((cat) => (
                  <CategoryCard
                    key={cat.value}
                    icon={cat.icon}
                    title={cat.title}
                    description={cat.description}
                    isActive={category === cat.value}
                    onSelect={() => setCategory(cat.value)}
                  />
                ))}
              </div>
            </Card>

            <Card className="border border-white/80 bg-white/95 p-6 shadow-sm surface-card">
              <CardTitle className="text-xl font-semibold text-gray-900">Hoe urgent is het?</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-500">
                Kies de status die aangeeft hoe snel dit moet worden opgevolgd.
              </CardDescription>
              <div className="mt-4 space-y-3">
                {(Object.keys(SEVERITY_LEVELS) as SeverityValue[]).map((level) => (
                  <SeverityOption
                    key={level}
                    value={level}
                    isActive={severity === level}
                    onSelect={() => setSeverity(level)}
                  />
                ))}
              </div>
            </Card>

            <Card className="border border-white/80 bg-white/95 p-6 shadow-sm surface-card">
              <CardTitle className="text-xl font-semibold text-gray-900">Beschrijf het probleem</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-500">
                Hoe meer details, hoe sneller we kunnen handelen.
              </CardDescription>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="mt-4 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-inner focus:border-emerald-500 focus:outline-none"
                placeholder="Voorbeeld: Tijdens de rit begon het stuur te trillen en de remmen piepten hard..."
                required
              />
            </Card>

            <div className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/95 p-6 text-sm text-gray-600 shadow-sm surface-card sm:flex-row sm:items-center sm:justify-between">
              <p>We sturen je melding direct door naar het beheerteam.</p>
              <Button type="submit" disabled={isLoading} size="lg" className="sm:w-auto">
                {isLoading ? '⏳ Bezig met verzenden...' : '✅ Probleem melden'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
