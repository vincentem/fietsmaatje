'use client';

import { useEffect, useState } from 'react';
import { SimpleNav } from '@/components/simple-nav';
import { Card, CardTitle, CardDescription } from '@/components/card';
import { Button } from '@/components/button';
import MaintenanceLogModal from '@/components/maintenance-log-modal';

export default function MechanicDashboard() {
  const [bikes, setBikes] = useState<any[]>([]);
  const [selectedBike, setSelectedBike] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch('/api/bikes')
      .then((r) => r.ok ? r.json() : [])
      .then(setBikes)
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <SimpleNav items={[{label:'Dashboard', href:'/mechanic/dashboard', icon:'🔧'}]} />
      <main className="container-safe">
        <h1>Monteursdashboard</h1>
        <p className="text-gray-600 mb-6">Snel onderhoud registreren en fietsstatussen beheren.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bikes.map((b) => (
            <Card key={b.id} className="p-4">
              <CardTitle>{b.name || b.code}</CardTitle>
              <CardDescription>Locatie: {b.location_id}</CardDescription>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => { setSelectedBike(b.id); setShowModal(true); }}>Log toevoegen</Button>
                <Button onClick={async () => {
                  const newStatus = b.status === 'available' ? 'in_repair' : 'available';
                  const res = await fetch(`/api/bikes/${b.id}/status`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status: newStatus}) });
                  if (res.ok) {
                    const updated = await res.json();
                    setBikes((prev) => prev.map(x => x.id === updated.id ? updated : x));
                  }
                }}>{b.status || 'onbekend'}</Button>
              </div>
            </Card>
          ))}
        </div>

        {showModal && selectedBike && (
          <MaintenanceLogModal bikeId={selectedBike} onClose={() => { setShowModal(false); setSelectedBike(null); }} onSaved={(r) => { /* refresh list */ fetch('/api/bikes').then(r=>r.json()).then(setBikes); }} />
        )}
      </main>
    </>
  );
}
