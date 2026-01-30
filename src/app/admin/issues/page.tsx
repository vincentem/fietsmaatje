'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Issue {
  id: number;
  bike_id: number;
  category: string;
  severity: string;
  status: string;
  description: string;
  created_at: string;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
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
    fetchIssues(savedToken);
  }, [router]);

  const fetchIssues = async (token: string) => {
    try {
      const response = await fetch('/api/issues');
      if (response.ok) {
        setIssues(await response.json());
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateIssueStatus = async (issueId: number, newStatus: string) => {
    if (!token) return;

    try {
      const issue = issues.find((i) => i.id === issueId);
      if (!issue) return;

      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...issue,
          status: newStatus,
        }),
      });

      if (response.ok) {
        fetchIssues(token);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f5fb]">
      <nav className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin/dashboard" className="text-lg font-semibold text-gray-900">
            Fietsmaatje · Beheer
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Meldingen</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Meldingenbeheer</h1>
            <p className="text-gray-600">Bekijk en werk issues per fiets af.</p>
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
        ) : issues.length === 0 ? (
          <div className="rounded-[28px] bg-white/90 border border-white/80 shadow-xl p-6 text-center surface-card">
            <p className="text-gray-600">Geen meldingen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {issues.map((issue) => (
              <div key={issue.id} className="rounded-[28px] bg-white/90 border border-white/80 p-6 shadow-lg hover:shadow-2xl transition surface-card">
                <div className="flex justify-between items-start mb-3 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Fiets #{issue.bike_id}</h3>
                    <p className="text-gray-600 text-sm">{issue.category}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      issue.severity === 'HIGH'
                        ? 'bg-red-100 text-red-800'
                        : issue.severity === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {issue.severity === 'HIGH' ? 'Hoog' : issue.severity === 'MEDIUM' ? 'Midden' : 'Laag'}
                  </span>
                </div>

                <p className="text-gray-700 mb-3">{issue.description}</p>

                <p className="text-sm text-gray-500 mb-4">
                  Gemeld: {format(new Date(issue.created_at), 'dd MMM yyyy HH:mm')}
                </p>

                <div className="flex flex-wrap gap-2">
                  {issue.status !== 'CLOSED' && (
                    <>
                      {issue.status !== 'ACKNOWLEDGED' && (
                        <button
                          onClick={() => updateIssueStatus(issue.id, 'ACKNOWLEDGED')}
                          className="rounded-xl bg-yellow-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-yellow-700"
                        >
                          Bevestigen
                        </button>
                      )}
                      {issue.status !== 'FIXED' && (
                        <button
                          onClick={() => updateIssueStatus(issue.id, 'FIXED')}
                          className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                        >
                          Markeer opgelost
                        </button>
                      )}
                      <button
                        onClick={() => updateIssueStatus(issue.id, 'CLOSED')}
                        className="rounded-xl bg-gray-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-800"
                      >
                        Sluiten
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
