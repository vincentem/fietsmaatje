"use client";

import React, { useState } from 'react';
import Modal from '@/components/modal';
import FormField from '@/components/form-field';
import { Button } from '@/components/button';

export default function MaintenanceLogModal({ bikeId, onClose, onSaved }: { bikeId: number | null; onClose: () => void; onSaved?: (res: any) => void }) {
  const [type, setType] = useState('inspection');
  const [statusAfter, setStatusAfter] = useState('available');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!bikeId) return null;

  const save = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bikes/${bikeId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, status_after: statusAfter, notes }),
      });
      const data = await res.json();
      if (res.ok) {
        onSaved && onSaved(data);
        onClose();
      } else {
        alert(data.error || 'Opslaan mislukt');
      }
    } catch (err) {
      console.error(err);
      alert('Fout bij opslaan van onderhoudslog');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Onderhoud toevoegen voor fiets #${bikeId}`}>
      <div className="space-y-3">
        <FormField label="Type" name="maintenance-type">
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full">
            <option value="inspection">Inspectie</option>
            <option value="repair">Reparatie</option>
            <option value="cleaning">Schoonmaak</option>
          </select>
        </FormField>

        <FormField label="Nieuwe status" name="maintenance-status">
          <select value={statusAfter} onChange={(e) => setStatusAfter(e.target.value)} className="w-full">
            <option value="available">Beschikbaar</option>
            <option value="needs_inspection">Inspectie nodig</option>
            <option value="in_repair">In reparatie</option>
            <option value="retired">Uit dienst</option>
          </select>
        </FormField>

        <FormField label="Notities" name="maintenance-notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-28" />
        </FormField>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Annuleren</Button>
          <Button onClick={save} disabled={isSaving}>{isSaving ? 'Bezig met opslaan...' : 'Opslaan'}</Button>
        </div>
      </div>
    </Modal>
  );
}
