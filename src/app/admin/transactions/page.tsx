'use client';

import { useEffect, useState } from 'react';
import { SimpleNav } from '@/components/simple-nav';

export default function AdminTransactionsPage() {
  const [tx, setTx] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/transactions?limit=200')
      .then((r) => r.ok ? r.json() : [])
      .then(setTx)
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <SimpleNav items={[{label:'Beheer', href:'/admin', icon:'🛠️'}]} />
      <main className="container-safe">
        <h1>Transacties</h1>
        <p className="text-gray-600 mb-6">Overzicht van recente transacties en boekingen.</p>

        <div className="overflow-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left">
                <th className="p-2">ID</th>
                <th className="p-2">User</th>
                <th className="p-2">Reservering</th>
                <th className="p-2">Bedrag</th>
                <th className="p-2">Status</th>
                <th className="p-2">Aangemaakt</th>
              </tr>
            </thead>
            <tbody>
              {tx.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.id}</td>
                  <td className="p-2">{t.user_id}</td>
                  <td className="p-2">{t.reservation_id}</td>
                  <td className="p-2">{(t.amount_cents/100).toFixed(2)} {t.currency}</td>
                  <td className="p-2">{t.status}</td>
                  <td className="p-2">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
