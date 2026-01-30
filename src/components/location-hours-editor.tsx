'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Alert } from './alert';

interface WeeklyHours {
  id?: number;
  weekday: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

interface Exception {
  id?: number;
  date: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  reason: string | null;
}

const WEEKDAYS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

export function LocationHoursEditor({ locationId, onSave }: { locationId: number; onSave?: () => void }) {
  const [hoursType, setHoursType] = useState<'ALWAYS_OPEN' | 'SCHEDULED'>('SCHEDULED');
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [showNewException, setShowNewException] = useState(false);
  const [newException, setNewException] = useState<Exception>({
    date: '',
    is_closed: false,
    open_time: '09:00',
    close_time: '17:00',
    reason: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchHours();
  }, [locationId]);

  const fetchHours = async () => {
    try {
      const response = await fetch(`/api/locations/hours?locationId=${locationId}`);
      if (response.ok) {
        const data = await response.json();
        let weekly = data.weekly || [];

        // If no weekly hours exist, initialize them with default hours
        if (weekly.length === 0) {
          weekly = Array.from({ length: 7 }, (_, i) => ({
            weekday: i,
            is_closed: i > 4, // Close on Saturday (5) and Sunday (6)
            open_time: '09:00',
            close_time: '17:00',
          }));
        }

        setWeeklyHours(weekly);
        setExceptions(data.exceptions || []);
      }
    } catch (err) {
      setError('Openingstijden laden mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleHoursTypeChange = async (newType: 'ALWAYS_OPEN' | 'SCHEDULED') => {
    setHoursType(newType);

    // Update location's hours_type in database
    try {
      await fetch('/api/locations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: locationId, hours_type: newType }),
      });
    } catch (err) {
      console.error('Fout bij bijwerken van openingstijden-type:', err);
    }
  };

  const handleWeeklyHourChange = (weekday: number, field: string, value: any) => {
    setWeeklyHours(
      weeklyHours.map((h) =>
        h.weekday === weekday
          ? {
              ...h,
              [field]: value,
              ...(field === 'is_closed' && value ? { open_time: null, close_time: null } : {}),
            }
          : h
      )
    );
  };

  const handleSaveWeeklyHours = async (weekday: number) => {
    const hours = weeklyHours.find((h) => h.weekday === weekday);
    if (!hours) return;

    try {
      const response = await fetch('/api/locations/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setWeeklyHours',
          locationId,
          weekday,
          isClosed: hours.is_closed,
          openTime: hours.open_time,
          closeTime: hours.close_time,
        }),
      });

      if (response.ok) {
        setSuccess(`Openingstijden voor ${WEEKDAYS[weekday]} opgeslagen!`);
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError('Openingstijden opslaan mislukt');
      }
    } catch (err) {
      setError('Fout bij opslaan van openingstijden');
    }
  };

  const handleCopyToAllDays = async (fromWeekday: number) => {
    const sourceHours = weeklyHours.find((h) => h.weekday === fromWeekday);
    if (!sourceHours) return;

    for (let i = 0; i < 7; i++) {
      if (i !== fromWeekday) {
        await fetch('/api/locations/hours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'setWeeklyHours',
            locationId,
            weekday: i,
            isClosed: sourceHours.is_closed,
            openTime: sourceHours.open_time,
            closeTime: sourceHours.close_time,
          }),
        });
      }
    }
    setSuccess('Openingstijden gekopieerd naar alle dagen!');
    fetchHours();
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleAddException = async () => {
    if (!newException.date) {
      setError('Kies een datum');
      return;
    }

    try {
      const response = await fetch('/api/locations/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setException',
          locationId,
          date: newException.date,
          isClosed: newException.is_closed,
          openTime: newException.open_time,
          closeTime: newException.close_time,
          reason: newException.reason,
        }),
      });

      if (response.ok) {
        setSuccess('Uitzondering toegevoegd!');
        setNewException({ date: '', is_closed: false, open_time: '09:00', close_time: '17:00', reason: '' });
        setShowNewException(false);
        fetchHours();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError('Uitzondering toevoegen mislukt');
      }
    } catch (err) {
      setError('Fout bij toevoegen van uitzondering');
    }
  };

  const handleDeleteException = async (exceptionId: number | undefined) => {
    if (!exceptionId) return;

    try {
      await fetch(`/api/locations/hours?exceptionId=${exceptionId}`, { method: 'POST' });
      setSuccess('Uitzondering verwijderd!');
      fetchHours();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Uitzondering verwijderen mislukt');
    }
  };

  if (loading) return <div>Openingstijden laden...</div>;

  return (
    <div className="space-y-6">
      {error && <Alert type="error" title="Fout" onDismiss={() => setError(null)}>{error}</Alert>}
      {success && <Alert type="success" title="Gelukt" onDismiss={() => setSuccess(null)}>{success}</Alert>}

      {/* Hours Type Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Openingstijden</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              checked={hoursType === 'ALWAYS_OPEN'}
              onChange={() => handleHoursTypeChange('ALWAYS_OPEN')}
              className="mr-3 w-4 h-4"
            />
            <span>Altijd open</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={hoursType === 'SCHEDULED'}
              onChange={() => handleHoursTypeChange('SCHEDULED')}
              className="mr-3 w-4 h-4"
            />
            <span>Openingstijden instellen</span>
          </label>
        </div>
      </div>

      {/* Weekly Schedule */}
      {hoursType === 'SCHEDULED' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Wekelijks rooster</h3>
          <div className="space-y-3">
            {weeklyHours.map((hours) => (
              <div key={hours.weekday} className="border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-lg">{WEEKDAYS[hours.weekday]}</h4>
                  <button
                    onClick={() => handleCopyToAllDays(hours.weekday)}
                    className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                  >
                    Kopieer naar alle dagen
                  </button>
                </div>

                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={hours.is_closed}
                    onChange={(e) => handleWeeklyHourChange(hours.weekday, 'is_closed', e.target.checked)}
                    className="w-4 h-4 mr-2"
                  />
                  <span>Gesloten</span>
                </label>

                {!hours.is_closed && (
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm mb-1">Opent</label>
                      <input
                        type="time"
                        value={hours.open_time || '09:00'}
                        onChange={(e) => handleWeeklyHourChange(hours.weekday, 'open_time', e.target.value)}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Sluit</label>
                      <input
                        type="time"
                        value={hours.close_time || '17:00'}
                        onChange={(e) => handleWeeklyHourChange(hours.weekday, 'close_time', e.target.value)}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleSaveWeeklyHours(hours.weekday)}
                  className="mt-3"
                >
                  Opslaan
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exceptions */}
      {hoursType === 'SCHEDULED' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Uitzonderingen (Feestdagen en bijzondere dagen)</h3>

          {exceptions.length > 0 && (
            <div className="space-y-2 mb-4">
              {exceptions.map((exc) => (
                <div key={exc.id} className="border rounded p-3 flex justify-between items-center">
                  <div>
                    <strong>{exc.date}</strong>
                    {exc.reason && <p className="text-sm text-gray-600">{exc.reason}</p>}
                    {exc.is_closed ? (
                      <p className="text-sm text-red-600">Gesloten</p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {exc.open_time} - {exc.close_time}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteException(exc.id)}
                    className="text-red-600 hover:text-red-800 px-2"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}

          {showNewException ? (
            <div className="border rounded p-4 mb-3 space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Datum</label>
                <input
                  type="date"
                  value={newException.date}
                  onChange={(e) => setNewException({ ...newException, date: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newException.is_closed}
                  onChange={(e) => setNewException({ ...newException, is_closed: e.target.checked })}
                  className="w-4 h-4 mr-2"
                />
                <span>Gesloten</span>
              </label>

              {!newException.is_closed && (
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm mb-1">Opent</label>
                    <input
                      type="time"
                      value={newException.open_time || '09:00'}
                      onChange={(e) => setNewException({ ...newException, open_time: e.target.value })}
                      className="border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Sluit</label>
                    <input
                      type="time"
                      value={newException.close_time || '17:00'}
                      onChange={(e) => setNewException({ ...newException, close_time: e.target.value })}
                      className="border rounded px-3 py-2"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm mb-1">Reden (optioneel)</label>
                <input
                  type="text"
                  placeholder="bijv. Koningsdag, speciale dag"
                  value={newException.reason || ''}
                  onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={handleAddException}>
                  Uitzondering opslaan
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowNewException(false)}>
                  Annuleren
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="primary" onClick={() => setShowNewException(true)}>
              + Uitzondering toevoegen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
