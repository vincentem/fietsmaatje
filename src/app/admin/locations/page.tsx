'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Location {
  id: number;
  name: string;
  address: string;
  hours_type: string;
}

export default function ManageLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    instructions: '',
    hours_type: 'SCHEDULED',
  });
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      router.push('/admin/login');
      return;
    }
    setToken(savedToken);
    fetchLocations(savedToken);
  }, [router]);

  const fetchLocations = async (token: string) => {
    try {
      const response = await fetch('/api/locations');
      if (response.ok) {
        setLocations(await response.json());
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchLocations(token);
        setShowForm(false);
        setFormData({ name: '', address: '', instructions: '', hours_type: 'SCHEDULED' });
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-red-600 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/admin/dashboard" className="text-xl font-bold hover:text-red-100">
            🚴 Fietsmaatje - Beheer
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Locaties beheren</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Annuleren' : '+ Locatie toevoegen'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Locatienaam"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Adres"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <textarea
                placeholder="Instructies (optioneel)"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
              <select
                value={formData.hours_type}
                onChange={(e) => setFormData({ ...formData, hours_type: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="SCHEDULED">Geplande openingstijden</option>
                <option value="ALWAYS_OPEN">Altijd open</option>
              </select>
            </div>
            <button
              type="submit"
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            >
              Locatie aanmaken
            </button>
          </form>
        )}

        {isLoading ? (
          <p>Bezig met laden...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map((location) => (
              <div key={location.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <h3 className="text-lg font-semibold mb-2">{location.name}</h3>
                <p className="text-gray-600 text-sm mb-2">📍 {location.address}</p>
                <p className="text-sm mb-4">
                  <span className="text-gray-500">Type: </span>
                  <span className="font-medium">{location.hours_type}</span>
                </p>
                <Link
                  href={`/admin/locations/${location.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Openingstijden beheren →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
