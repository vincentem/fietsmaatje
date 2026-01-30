'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Bike {
  id: number;
  code: string;
  name: string;
  location_id: number;
  status: string;
}

interface Location {
  id: number;
  name: string;
}

export default function ManageBikesPage() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBikeId, setEditingBikeId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', location_id: '', status: 'AVAILABLE' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      router.push('/admin/login');
      return;
    }
    setToken(savedToken);
    fetchData(savedToken);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const bikeRes = await fetch('/api/bikes');
      if (bikeRes.ok) setBikes(await bikeRes.json());

      const locRes = await fetch('/api/locations');
      if (locRes.ok) setLocations(await locRes.json());
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (bike: Bike) => {
    setFormData({
      code: bike.code,
      name: bike.name,
      location_id: bike.location_id.toString(),
      status: bike.status,
    });
    setEditingBikeId(bike.id);
    setShowForm(true);
    setError('');
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingBikeId(null);
    setFormData({ code: '', name: '', location_id: '', status: 'AVAILABLE' });
    setError('');
  };

  const handleDelete = async (bikeId: number) => {
    if (!confirm('Weet je zeker dat je deze fiets wilt verwijderen?')) return;
    if (!token) return;

    try {
      const response = await fetch(`/api/bikes/${bikeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setBikes(bikes.filter((b) => b.id !== bikeId));
        setSuccess('Fiets succesvol verwijderd');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Fiets verwijderen mislukt');
      }
    } catch (err) {
      setError('Fiets verwijderen mislukt');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const method = editingBikeId ? 'PUT' : 'POST';
    const url = editingBikeId ? `/api/bikes/${editingBikeId}` : '/api/bikes';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedBike = await response.json();
        if (editingBikeId) {
          setBikes(bikes.map((b) => (b.id === editingBikeId ? updatedBike : b)));
          setSuccess('Fiets succesvol bijgewerkt');
        } else {
          setBikes([...bikes, updatedBike]);
          setSuccess('Fiets succesvol aangemaakt');
        }
        setShowForm(false);
        setEditingBikeId(null);
        setFormData({ code: '', name: '', location_id: '', status: 'AVAILABLE' });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Fiets opslaan mislukt');
      }
    } catch (err) {
      setError('Fout bij het opslaan van de fiets');
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
        <h1 className="text-3xl font-bold mb-6">Fietsen beheren</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <button
          onClick={() => {
            if (editingBikeId) {
              handleCancelEdit();
            } else {
              setShowForm(!showForm);
            }
          }}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Annuleren' : '+ Fiets toevoegen'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingBikeId ? 'Fiets bewerken' : 'Nieuwe fiets toevoegen'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Fietscode"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="px-3 py-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Fietsnaam"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-3 py-2 border rounded"
              />
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                className="px-3 py-2 border rounded"
                required
              >
                <option value="">Kies locatie</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-3 py-2 border rounded"
              >
                <option value="AVAILABLE">Beschikbaar</option>
                <option value="OUT_OF_SERVICE">Buiten gebruik</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
              >
                {editingBikeId ? 'Fiets bijwerken' : 'Fiets aanmaken'}
              </button>
              {editingBikeId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded"
                >
                  Annuleren
                </button>
              )}
            </div>
          </form>
        )}

        {isLoading ? (
          <p>Bezig met laden...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">Code</th>
                  <th className="px-6 py-3 text-left">Naam</th>
                  <th className="px-6 py-3 text-left">Locatie</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Acties</th>
                </tr>
              </thead>
              <tbody>
                {bikes.map((bike) => (
                  <tr key={bike.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{bike.code}</td>
                    <td className="px-6 py-3">{bike.name || '-'}</td>
                    <td className="px-6 py-3">
                      {locations.find((l) => l.id === bike.location_id)?.name || 'Onbekend'}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded text-sm ${
                          bike.status === 'AVAILABLE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {bike.status === 'AVAILABLE' ? 'Beschikbaar' : 'Buiten gebruik'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleEdit(bike)}
                        className="text-blue-600 hover:text-blue-700 mr-4 font-medium"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => handleDelete(bike.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Verwijderen
                      </button>
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
