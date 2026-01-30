'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  balance_cents?: number;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'VOLUNTEER',
  });
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      router.push('/admin/login');
      return;
    }
    setToken(savedToken);
    fetchUsers(savedToken);
  }, [router]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setUsers(await response.json());
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
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchUsers(token);
        setShowForm(false);
        setFormData({ email: '', name: '', password: '', role: 'VOLUNTEER' });
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
        <h1 className="text-3xl font-bold mb-6">Gebruikers beheren</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Annuleren' : '+ Gebruiker aanmaken'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="E-mail"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="px-3 py-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Naam"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-3 py-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Wachtwoord"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="px-3 py-2 border rounded"
                required
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="px-3 py-2 border rounded"
              >
                <option value="VOLUNTEER">Vrijwilliger</option>
                <option value="ADMIN">Beheerder</option>
              </select>
            </div>
            <button
              type="submit"
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            >
              Gebruiker aanmaken
            </button>
          </form>
        )}

        {isLoading ? (
          <p>Bezig met laden...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">Naam</th>
                  <th className="px-6 py-3 text-left">E-mail</th>
                  <th className="px-6 py-3 text-left">Saldo</th>
                  <th className="px-6 py-3 text-left">Rol</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Acties</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{user.name}</td>
                    <td className="px-6 py-3">{user.email}</td>
                    <td className="px-6 py-3">{(user.balance_cents ?? 0) / 100}</td>
                    <td className="px-6 py-3">
                      <span className="font-medium">{user.role}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded text-sm ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button className="text-blue-600 hover:text-blue-700 mr-4">Bewerken</button>
                      <button className="text-yellow-600 hover:text-yellow-700 mr-4" onClick={async () => {
                        const val = prompt('Bedrag om bij te schrijven (bv. 5,00) — gebruik negatief om af te schrijven');
                        if (!val) return;
                        const cents = Math.round(parseFloat(val) * 100);
                        if (isNaN(cents)) return alert('Ongeldig bedrag');
                        try {
                          const res = await fetch(`/api/users/${user.id}/balance`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ delta_cents: cents, note: 'Admin adjustment' }) });
                          if (res.ok) {
                            if (token) {
                              fetchUsers(token);
                            }
                          } else {
                            alert('Saldo bijwerken mislukt');
                          }
                        } catch (err) { console.error(err); alert('Fout'); }
                      }}>Saldo aanpassen</button>
                      <button className="text-red-600 hover:text-red-700">Deactiveren</button>
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
