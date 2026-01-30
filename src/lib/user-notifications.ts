import { query } from './db';

export interface UserNotificationInput {
  userId: number;
  type: string;
  title: string;
  body: string;
  payload?: any;
}

export async function createUserNotification(input: UserNotificationInput) {
  const { userId, type, title, body, payload = null } = input;
  const res = await query(
    `INSERT INTO user_notifications (user_id, type, title, body, payload)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, type, title, body, payload ? JSON.stringify(payload) : null]
  );
  return res.rows[0];
}

export async function listUserNotifications(userId: number, status?: string, limit = 50) {
  if (status && status !== 'all') {
    const res = await query(
      `SELECT * FROM user_notifications WHERE user_id = $1 AND status = $2
       ORDER BY created_at DESC LIMIT $3`,
      [userId, status, limit]
    );
    return res.rows;
  }

  const res = await query(
    `SELECT * FROM user_notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return res.rows;
}

export async function markUserNotificationRead(userId: number, id: number) {
  const res = await query(
    `UPDATE user_notifications
     SET status = 'read', read_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
  return res.rows[0] || null;
}
