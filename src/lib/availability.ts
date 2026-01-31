import { query } from './db';
import { addMinutes, subMinutes, isWithinInterval, format } from 'date-fns';

// Constants per business rules
export const MIN_BOOKING_DURATION = 60; // minutes
export const BUFFER_TIME = 30; // minutes
export const TIME_INCREMENT = 30; // minutes

interface AvailabilityCheckResult {
  available: boolean;
  reason?: string;
}

const DEFAULT_TIME_ZONE = 'Europe/Amsterdam';

/**
 * Check if a time is aligned to 30-minute increments
 */
export function isTimeAligned(date: Date): boolean {
  return date.getMinutes() % TIME_INCREMENT === 0 && date.getSeconds() === 0;
}

/**
 * Check if duration meets minimum requirement
 */
export function isValidDuration(startTime: Date, endTime: Date): boolean {
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  return durationMinutes >= MIN_BOOKING_DURATION;
}

/**
 * Get opening hours for a specific date and location
 * Handles weekly schedule and date-based exceptions
 */
export async function getLocationHours(
  locationId: number,
  date: Date
): Promise<{ open_time: string; close_time: string; is_closed: boolean } | null> {
  try {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();

    // Check for date-based exceptions first
    const exceptionResult = await query(
      'SELECT open_time, close_time, is_closed FROM location_hour_exceptions WHERE location_id = $1 AND date = $2',
      [locationId, dateString]
    );

    if (exceptionResult.rows.length > 0) {
      return exceptionResult.rows[0];
    }

    // Check weekly schedule
    const weeklyResult = await query(
      'SELECT hours_type FROM locations WHERE id = $1',
      [locationId]
    );

    if (weeklyResult.rows.length === 0) {
      return null;
    }

    const { hours_type } = weeklyResult.rows[0];

    if (hours_type === 'ALWAYS_OPEN') {
      return { open_time: '00:00:00', close_time: '23:59:59', is_closed: false };
    }

    const scheduleResult = await query(
      'SELECT open_time, close_time, is_closed FROM location_weekly_hours WHERE location_id = $1 AND weekday = $2',
      [locationId, dayOfWeek]
    );

    if (scheduleResult.rows.length > 0) {
      return scheduleResult.rows[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting location hours:', error);
    return null;
  }
}

/**
 * Convert time string (HH:MM:SS) to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to Date object
 */
function minutesToDate(minutes: number, date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return newDate;
}

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = Number(part.value);
    }
  }

  return map as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

function getMinutesInZone(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

function isSameDayInZone(a: Date, b: Date, timeZone: string): boolean {
  const pa = getZonedParts(a, timeZone);
  const pb = getZonedParts(b, timeZone);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

/**
 * Check if reservation times are within location opening hours
 */
export async function checkOpeningHours(
  locationId: number,
  startTime: Date,
  endTime: Date
): Promise<AvailabilityCheckResult> {
  try {
    // Check if same day
    if (!isSameDayInZone(startTime, endTime, DEFAULT_TIME_ZONE)) {
      return { available: false, reason: 'Reservations cannot span multiple days' };
    }

    const hours = await getLocationHours(locationId, startTime);

    if (!hours) {
      return { available: false, reason: 'Location hours not found' };
    }

    if (hours.is_closed) {
      return { available: false, reason: 'Location is closed on this date' };
    }

    const startMinutes = timeToMinutes(hours.open_time);
    const endMinutes = timeToMinutes(hours.close_time);
    const reservationStartMinutes = getMinutesInZone(startTime, DEFAULT_TIME_ZONE);
    const reservationEndMinutes = getMinutesInZone(endTime, DEFAULT_TIME_ZONE);

    if (
      reservationStartMinutes < startMinutes ||
      reservationEndMinutes > endMinutes
    ) {
      return {
        available: false,
        reason: `Reservation must be within location hours (${hours.open_time} - ${hours.close_time})`,
      };
    }

    return { available: true };
  } catch (error) {
    console.error('Error checking opening hours:', error);
    return { available: false, reason: 'Error validating opening hours' };
  }
}

/**
 * Check for overlapping reservations with buffer time
 * A bike is unavailable if any existing reservation overlaps with:
 * [existing_start - BUFFER_TIME, existing_end + BUFFER_TIME)
 */
export async function checkAvailability(
  bikeId: number,
  startTime: Date,
  endTime: Date
): Promise<AvailabilityCheckResult> {
  try {
    // Add buffer to requested time
    const bufferedStart = subMinutes(startTime, BUFFER_TIME);
    const bufferedEnd = addMinutes(endTime, BUFFER_TIME);

    const result = await query(
      `SELECT id FROM reservations 
       WHERE bike_id = $1 
       AND status IN ('BOOKED', 'COMPLETED')
       AND NOT (end_datetime <= $2 OR start_datetime >= $3)
       LIMIT 1`,
      [bikeId, bufferedStart, bufferedEnd]
    );

    if (result.rows.length > 0) {
      return { available: false, reason: 'Bike is not available during this time' };
    }

    return { available: true };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { available: false, reason: 'Error checking availability' };
  }
}

/**
 * Check bike status
 */
export async function checkBikeStatus(bikeId: number): Promise<AvailabilityCheckResult> {
  try {
    const result = await query(
      'SELECT status FROM bikes WHERE id = $1',
      [bikeId]
    );

    if (result.rows.length === 0) {
      return { available: false, reason: 'Bike not found' };
    }

    const { status } = result.rows[0];

    if (status !== 'AVAILABLE') {
      return { available: false, reason: `Bike is ${status}` };
    }

    return { available: true };
  } catch (error) {
    console.error('Error checking bike status:', error);
    return { available: false, reason: 'Error checking bike status' };
  }
}

/**
 * Comprehensive availability check for booking
 */
export async function validateReservation(
  bikeId: number,
  locationId: number,
  startTime: Date,
  endTime: Date
): Promise<AvailabilityCheckResult> {
  // Check duration
  if (!isValidDuration(startTime, endTime)) {
    return {
      available: false,
      reason: `Minimum booking duration is ${MIN_BOOKING_DURATION} minutes`,
    };
  }

  // Check time alignment
  if (!isTimeAligned(startTime) || !isTimeAligned(endTime)) {
    return {
      available: false,
      reason: 'Times must align to 30-minute increments',
    };
  }

  // Check opening hours
  const hoursCheck = await checkOpeningHours(locationId, startTime, endTime);
  if (!hoursCheck.available) {
    return hoursCheck;
  }

  // Check bike status
  const statusCheck = await checkBikeStatus(bikeId);
  if (!statusCheck.available) {
    return statusCheck;
  }

  // Check availability with buffer
  const availCheck = await checkAvailability(bikeId, startTime, endTime);
  if (!availCheck.available) {
    return availCheck;
  }

  return { available: true };
}
