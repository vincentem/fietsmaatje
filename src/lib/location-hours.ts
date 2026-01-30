import { query } from './db';

export interface WeeklyHours {
  id: number;
  location_id: number;
  weekday: number; // 0=Monday, 6=Sunday
  is_closed: boolean;
  open_time: string | null; // HH:MM
  close_time: string | null; // HH:MM
}

export interface Exception {
  id: number;
  location_id: number;
  date: string; // YYYY-MM-DD
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  reason: string | null;
}

export interface LocationHours {
  weekly: WeeklyHours[];
  exceptions: Exception[];
}

/**
 * Get all opening hours for a location
 */
export async function getLocationHours(locationId: number): Promise<LocationHours> {
  const [weeklyResult, exceptionsResult] = await Promise.all([
    query(
      'SELECT id, location_id, weekday, is_closed, open_time, close_time FROM location_weekly_hours WHERE location_id = $1 ORDER BY weekday',
      [locationId]
    ),
    query(
      'SELECT id, location_id, date, is_closed, open_time, close_time, reason FROM location_hour_exceptions WHERE location_id = $1 ORDER BY date DESC',
      [locationId]
    ),
  ]);

  return {
    weekly: weeklyResult.rows,
    exceptions: exceptionsResult.rows,
  };
}

/**
 * Set weekly hours for a specific day
 */
export async function setWeeklyHours(
  locationId: number,
  weekday: number,
  isClosed: boolean,
  openTime?: string,
  closeTime?: string
): Promise<WeeklyHours> {
  const result = await query(
    `INSERT INTO location_weekly_hours (location_id, weekday, is_closed, open_time, close_time)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (location_id, weekday) 
     DO UPDATE SET is_closed = $3, open_time = $4, close_time = $5
     RETURNING id, location_id, weekday, is_closed, open_time, close_time`,
    [locationId, weekday, isClosed, isClosed ? null : openTime, isClosed ? null : closeTime]
  );

  return result.rows[0];
}

/**
 * Add or update an exception (holiday, special event)
 */
export async function setException(
  locationId: number,
  date: string,
  isClosed: boolean,
  openTime?: string,
  closeTime?: string,
  reason?: string
): Promise<Exception> {
  const result = await query(
    `INSERT INTO location_hour_exceptions (location_id, date, is_closed, open_time, close_time, reason)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (location_id, date)
     DO UPDATE SET is_closed = $3, open_time = $4, close_time = $5, reason = $6
     RETURNING id, location_id, date, is_closed, open_time, close_time, reason`,
    [locationId, date, isClosed, isClosed ? null : openTime, isClosed ? null : closeTime, reason || null]
  );

  return result.rows[0];
}

/**
 * Delete an exception
 */
export async function deleteException(exceptionId: number): Promise<void> {
  await query('DELETE FROM location_hour_exceptions WHERE id = $1', [exceptionId]);
}

/**
 * Check if a booking time is valid for a location
 * Returns: { valid: boolean; reason?: string }
 */
export async function validateBookingTime(
  locationId: number,
  startDateTime: Date,
  endDateTime: Date
): Promise<{ valid: boolean; reason?: string }> {
  // Fetch location and hours
  const locResult = await query('SELECT hours_type FROM locations WHERE id = $1', [locationId]);
  if (locResult.rows.length === 0) {
    return { valid: false, reason: 'Locatie niet gevonden' };
  }

  const location = locResult.rows[0];

  // If always open, skip checks
  if (location.hours_type === 'ALWAYS_OPEN') {
    return { valid: true };
  }

  // Get the date in local timezone (assuming Europe/Amsterdam for now)
  const startDate = new Date(startDateTime);
  const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD

  // Check for exceptions first
  const exceptionResult = await query(
    'SELECT is_closed, open_time, close_time FROM location_hour_exceptions WHERE location_id = $1 AND date = $2',
    [locationId, dateStr]
  );

  let hours = null;

  if (exceptionResult.rows.length > 0) {
    const exception = exceptionResult.rows[0];
    if (exception.is_closed) {
      return { valid: false, reason: 'Locatie is gesloten op deze datum' };
    }
    hours = { open_time: exception.open_time, close_time: exception.close_time };
  } else {
    // Get weekly hours for this weekday (0=Monday, 6=Sunday)
    const weekday = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
    const weeklyResult = await query(
      'SELECT is_closed, open_time, close_time FROM location_weekly_hours WHERE location_id = $1 AND weekday = $2',
      [locationId, weekday]
    );

    if (weeklyResult.rows.length === 0) {
      return { valid: false, reason: 'Geen openingstijden ingesteld voor deze dag' };
    }

    const weekly = weeklyResult.rows[0];
    if (weekly.is_closed) {
      return { valid: false, reason: 'Locatie is gesloten op deze dag' };
    }
    hours = { open_time: weekly.open_time, close_time: weekly.close_time };
  }

  // Check booking is within hours
  const startTimeStr = startDateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = endDateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  if (startTimeStr < hours.open_time) {
    return { valid: false, reason: `Locatie opent om ${hours.open_time}` };
  }

  if (endTimeStr > hours.close_time) {
    return { valid: false, reason: `Locatie sluit om ${hours.close_time}` };
  }

  return { valid: true };
}

/**
 * Get hours for display to volunteers
 * Returns formatted string like "09:00 - 17:00" or "Gesloten"
 */
export async function getDisplayHours(locationId: number, date: Date): Promise<string> {
  const dateStr = date.toISOString().split('T')[0];

  // Check for exceptions first
  const exceptionResult = await query(
    'SELECT is_closed, open_time, close_time FROM location_hour_exceptions WHERE location_id = $1 AND date = $2',
    [locationId, dateStr]
  );

  if (exceptionResult.rows.length > 0) {
    const exception = exceptionResult.rows[0];
    if (exception.is_closed) {
      return 'Gesloten';
    }
    return `${exception.open_time} - ${exception.close_time}`;
  }

  // Get weekly hours
  const weekday = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const weeklyResult = await query(
    'SELECT is_closed, open_time, close_time FROM location_weekly_hours WHERE location_id = $1 AND weekday = $2',
    [locationId, weekday]
  );

  if (weeklyResult.rows.length === 0) {
    return 'Openingstijden niet ingesteld';
  }

  const weekly = weeklyResult.rows[0];
  if (weekly.is_closed) {
    return 'Gesloten';
  }

  return `${weekly.open_time} - ${weekly.close_time}`;
}
