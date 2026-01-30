'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { LocationHoursEditor } from '@/components/location-hours-editor';
import { Button } from '@/components/button';

interface Location {
  id: number;
  name: string;
  address: string;
  hours_type: string;
  instructions?: string;
}

export default function LocationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locationId = parseInt(params.id as string);

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      router.push('/admin/login');
      return;
    }
    setToken(savedToken);
    fetchLocation();
  }, [router, locationId]);

  const fetchLocation = async () => {
    try {
      const response = await fetch(`/api/locations?id=${locationId}`);
      if (response.ok) {
        const locations = await response.json();
        const loc = locations.find((l: Location) => l.id === locationId);
        setLocation(loc);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Laden...</div>;
  if (!location) return <div className="p-6">Locatie niet gevonden</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-red-600 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/admin/dashboard" className="text-xl font-bold hover:text-red-100">
            ?? Fietsmaatje - Admin
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/admin/locations" className="text-blue-600 hover:text-blue-700">
            ? Terug naar locaties
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{location.name}</h1>
          <p className="text-gray-600 mb-2">?? {location.address}</p>
          {location.instructions && <p className="text-gray-600 mb-4">{location.instructions}</p>}
          <p className="text-sm">
            <span className="text-gray-500">Type openingstijden: </span>
            <span className="font-medium">{location.hours_type}</span>
          </p>
        </div>

        <LocationHoursEditor locationId={locationId} onSave={fetchLocation} />
      </main>
    </div>
  );
}
