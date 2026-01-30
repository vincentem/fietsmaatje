"use client";

import React, { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, endOfWeek, addMonths, isBefore, isAfter, isSameMonth } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Props {
  locationId?: number | null;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  setDateIsOpen?: (open: boolean | null) => void;
  maxMonthsAhead?: number; // how many months ahead the user can navigate
}

interface HoursData {
  weekly?: Array<any>;
  exceptions?: Array<any>;
}

export default function DateCalendar({
  locationId,
  selectedDate,
  setSelectedDate,
  setDateIsOpen,
  maxMonthsAhead = 3,
}: Props) {
  const [hours, setHours] = useState<HoursData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!locationId) {
      setHours(null);
      return;
    }
    setLoading(true);
    fetch(`/api/locations/hours?locationId=${locationId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setHours(data))
      .catch((err) => {
        console.error('Failed to load hours for calendar', err);
        setHours(null);
      })
      .finally(() => setLoading(false));
  }, [locationId]);

  const computeIsOpen = (date: Date) => {
    if (!hours) return true; // assume open if we don't have data

    const dateStr = format(date, 'yyyy-MM-dd');
    const exception = hours.exceptions?.find((e: any) => e.date === dateStr);
    if (exception) return !exception.is_closed;

    // weekly: map JS getDay() -> weekday index used by backend (Mon=0..Sun=6)
    const jsDay = date.getDay();
    const weekday = jsDay === 0 ? 6 : jsDay - 1;
    const weekly = hours.weekly?.find((w: any) => w.weekday === weekday);
    if (weekly) return !weekly.is_closed;

    return true;
  };

  const today = new Date();
  const startDate = addDays(today, 1); // tomorrow is the earliest selectable date

  // visible month state: start at current month
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(today));

  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // build days between gridStart and gridEnd
  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const weekdayLabels = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  const canPrev = !isBefore(visibleMonth, startOfMonth(today));
  const maxAllowed = addMonths(startOfMonth(today), maxMonthsAhead);
  const canNext = !isAfter(visibleMonth, maxAllowed);

  const gotoPrev = () => {
    const prev = addMonths(visibleMonth, -1);
    if (!isBefore(prev, startOfMonth(today))) setVisibleMonth(prev);
  };
  const gotoNext = () => {
    const next = addMonths(visibleMonth, 1);
    if (!isAfter(next, maxAllowed)) setVisibleMonth(next);
  };

  return (
    <div className="bg-white rounded-lg p-4 card">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-lg font-semibold">Kies een datum</h4>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted mr-2">{format(visibleMonth, 'LLLL yyyy', { locale: nl })}</p>
          <div className="flex gap-2">
            <button onClick={gotoPrev} disabled={!canPrev} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">&lt;</button>
            <button onClick={gotoNext} disabled={!canNext} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">&gt;</button>
          </div>
        </div>
      </div>

      {loading && <div className="skeleton h-10 w-full mb-4" />}

      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm text-muted">
        {weekdayLabels.map((w) => (
          <div key={w} className="font-medium">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const dayLabel = format(d, 'd');
          const iso = format(d, 'yyyy-MM-dd');
          const isSelected = iso === selectedDate;
          const isPast = d < startDate;
          const open = computeIsOpen(d);
          const inMonth = isSameMonth(d, visibleMonth);

          return (
            <button
              key={iso}
              onClick={() => {
                if (isPast || !open || !inMonth) return;
                setSelectedDate(iso);
                if (setDateIsOpen) setDateIsOpen(open);
              }}
              disabled={isPast || !open || !inMonth}
              aria-pressed={isSelected}
              className={`flex flex-col items-center p-2 rounded-lg text-center focus:outline-none transition-all border-2 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : inMonth
                    ? open
                      ? 'bg-white text-true-gray-900 border-gray-200 hover:border-blue-300'
                      : 'bg-red-50 text-red-600 border-red-100'
                    : 'bg-transparent text-gray-400 border-transparent'
              } ${isPast ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              title={`${format(d, 'EEE, PPP', { locale: nl })} - ${open ? 'Open' : 'Gesloten'}`}
            >
              <span className="text-xs text-muted mb-1">{format(d, 'EEE', { locale: nl })}</span>
              <span className="text-lg font-bold">{dayLabel}</span>
              <span className={`mt-1 text-xs font-semibold ${open ? 'text-green-800' : 'text-red-700'}`}>
                {inMonth ? (open ? 'Open' : 'Gesloten') : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
