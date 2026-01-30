import { query } from './db';

const DEFAULT_WEBHOOKS = process.env.NOTIFICATION_WEBHOOKS ? JSON.parse(process.env.NOTIFICATION_WEBHOOKS) : [];
const ADMIN_EMAILS = process.env.NOTIFICATION_ADMIN_EMAILS ? process.env.NOTIFICATION_ADMIN_EMAILS.split(',').map(s => s.trim()) : [];
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

async function sendWebhook(url: string, body: any) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Webhook ${url} failed: ${res.status} ${text}`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

async function sendEmail(subject: string, html: string, to: string[]) {
  if (!SENDGRID_API_KEY) return { ok: false, error: 'No sendgrid key' };
  try {
    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          { to: to.map(t => ({ email: t })) }
        ],
        from: { email: process.env.NOTIFICATION_FROM_EMAIL || 'noreply@example.com' },
        subject,
        content: [{ type: 'text/html', value: html }]
      })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`SendGrid error: ${resp.status} ${txt}`);
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Persist an audit log and create notifications (attempt delivery immediately)
 */
export async function notifyEvent(eventType: string, relatedType: string | null, relatedId: number | null, payload: any) {
  // store audit log
  try {
    await query(
      `INSERT INTO audit_logs (event_type, related_type, related_id, payload) VALUES ($1,$2,$3,$4)`,
      [eventType, relatedType, relatedId, payload]
    );
  } catch (err) {
    console.error('Failed to insert audit log', err);
  }

  // Build targets from defaults
  const targets: any[] = [];
  for (const url of DEFAULT_WEBHOOKS) targets.push({ type: 'webhook', value: url });
  if (ADMIN_EMAILS.length > 0) targets.push({ type: 'email', value: ADMIN_EMAILS });

  if (targets.length === 0) return;

  // Persist notification row
  let notifId: number | null = null;
  try {
    const res = await query(
      `INSERT INTO notifications (event_type, payload, targets, status) VALUES ($1,$2,$3,'pending') RETURNING id`,
      [eventType, payload, JSON.stringify(targets)]
    );
    notifId = res.rows[0].id;
  } catch (err) {
    console.error('Failed to create notification row', err);
  }

  // Attempt immediate delivery (best-effort)
  for (const t of targets) {
    if (t.type === 'webhook') {
      const r = await sendWebhook(t.value, { event: eventType, payload });
      if (!r.ok) {
        await query('UPDATE notifications SET attempts = attempts + 1, last_attempt = now(), status = $1, error = $2 WHERE id = $3', ['failed', r.error || 'webhook failed', notifId]);
      }
    } else if (t.type === 'email') {
      const subject = `Notification: ${eventType}`;
      const html = `<pre>${JSON.stringify(payload, null, 2)}</pre>`;
      const r = await sendEmail(subject, html, t.value);
      if (!r.ok) {
        await query('UPDATE notifications SET attempts = attempts + 1, last_attempt = now(), status = $1, error = $2 WHERE id = $3', ['failed', r.error || 'email failed', notifId]);
      }
    }
  }

  // If all attempts OK, mark sent
  try {
    await query('UPDATE notifications SET status = $1, sent_at = now() WHERE id = $2 AND status = $3', ['sent', notifId, 'pending']);
  } catch (err) {
    console.error('Failed to finalize notification status', err);
  }
}

export async function processPendingNotifications(limit = 20) {
  try {
    const res = await query('SELECT * FROM notifications WHERE status = $1 ORDER BY created_at ASC LIMIT $2', ['pending', limit]);
    for (const n of res.rows) {
      const targets = n.targets || [];
      let anyFailed = false;
      let lastError = '';
      for (const t of targets) {
        if (t.type === 'webhook') {
          const r = await sendWebhook(t.value, { event: n.event_type, payload: n.payload });
          if (!r.ok) {
            anyFailed = true; lastError = r.error;
            await query('UPDATE notifications SET attempts = attempts + 1, last_attempt = now(), error = $1 WHERE id = $2', [r.error, n.id]);
          }
        } else if (t.type === 'email') {
          const subject = `Notification: ${n.event_type}`;
          const html = `<pre>${JSON.stringify(n.payload, null, 2)}</pre>`;
          const r = await sendEmail(subject, html, t.value);
          if (!r.ok) { anyFailed = true; lastError = r.error; await query('UPDATE notifications SET attempts = attempts + 1, last_attempt = now(), error = $1 WHERE id = $2', [r.error, n.id]); }
        }
      }
      if (!anyFailed) {
        await query('UPDATE notifications SET status = $1, sent_at = now() WHERE id = $2', ['sent', n.id]);
      } else {
        // leave as failed/pending for later retry
        await query('UPDATE notifications SET status = $1 WHERE id = $2', ['failed', n.id]);
      }
    }
  } catch (err) {
    console.error('Error processing notifications', err);
  }
}

export default { notifyEvent, processPendingNotifications };
