import { query } from './db';

const DEFAULT_RESERVATION_FEE_CENTS = 1000;

export async function getReservationFeeCents(): Promise<number> {
  try {
    const res = await query('SELECT value_text FROM app_settings WHERE key = $1 LIMIT 1', ['reservation_fee_cents']);
    const raw = res.rows[0]?.value_text;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.round(parsed);
  } catch (err) {
    console.error('Failed to load reservation fee from settings', err);
  }

  const fallbackRaw =
    process.env.RESERVATION_FEE_CENTS ??
    process.env.RESERVATION_RATE_CENTS_PER_HOUR ??
    process.env.RIDE_RATE_CENTS_PER_HOUR ??
    DEFAULT_RESERVATION_FEE_CENTS;
  const fallbackParsed = Number(fallbackRaw);
  if (!Number.isFinite(fallbackParsed) || fallbackParsed < 0) {
    return DEFAULT_RESERVATION_FEE_CENTS;
  }
  return Math.round(fallbackParsed);
}

export async function calculateReservationFeeCents(): Promise<number> {
  return getReservationFeeCents();
}
