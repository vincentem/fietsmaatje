type QueryFn = (text: string, params?: any[]) => Promise<{ rows: any[] }>;

interface CreateTransactionInput {
  userId?: number | null;
  reservationId?: number | null;
  amountCents: number;
  currency?: string;
  paymentMethod?: string | null;
  providerResponse?: any;
}

interface CreateTransactionResult {
  transaction: any;
  paid: boolean;
}

export async function createTransaction(queryFn: QueryFn, input: CreateTransactionInput): Promise<CreateTransactionResult> {
  const {
    userId = null,
    reservationId = null,
    amountCents,
    currency = 'EUR',
    paymentMethod = null,
    providerResponse = null,
  } = input;

  const res = await queryFn(
    `INSERT INTO transactions (user_id, reservation_id, amount_cents, currency, payment_method, provider_response, status)
     VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING *`,
    [userId, reservationId, amountCents, currency, paymentMethod, providerResponse]
  );

  await queryFn(
    'INSERT INTO ledger_entries (transaction_id, account, amount_cents, note) VALUES ($1,$2,$3,$4)',
    [res.rows[0].id, 'revenue', res.rows[0].amount_cents, 'Reservation fee']
  );
  await queryFn(
    'INSERT INTO ledger_entries (transaction_id, account, amount_cents, note) VALUES ($1,$2,$3,$4)',
    [res.rows[0].id, 'bank', -res.rows[0].amount_cents, 'Reservation payment']
  );

  if (userId) {
    const u = await queryFn('SELECT balance_cents FROM users WHERE id = $1', [userId]);
    const balance = u.rows[0]?.balance_cents ?? 0;
    if (balance >= amountCents) {
      await queryFn('UPDATE users SET balance_cents = balance_cents - $1 WHERE id = $2', [amountCents, userId]);
      const paid = await queryFn(
        'UPDATE transactions SET status = $1, payment_method = $2, provider_response = $3 WHERE id = $4 RETURNING *',
        ['paid', 'balance', JSON.stringify({ method: 'balance' }), res.rows[0].id]
      );
      return { transaction: paid.rows[0], paid: true };
    }
  }

  return { transaction: res.rows[0], paid: false };
}
