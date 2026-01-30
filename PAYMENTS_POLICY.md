# Payments Policy (Mollie + Balance Wallet)

## Summary
- We use a **balance wallet** as the source of truth for all charges.
- **No automatic cash refunds.** Cancellations credit the user's balance only.
- **Manual cash refunds** happen only after email request and **admin adjustment**.
- **Top-ups use Mollie iDEAL** for Dutch consumers.

---

## User-Facing Rules

### 1) Paying for rides
- Every reservation charges the **user balance**.
- If balance is insufficient, the user must **top up first** via iDEAL.

### 2) Cancellations
- Cancellations **credit the balance** (never cash).
- Refund eligibility follows policy (e.g. 24h/2h cutoffs).

### 3) Cash refunds (rare)
- Only after **email request**.
- **Admin manually adjusts** the balance and logs a refund transaction.

---

## Mollie iDEAL Top-Up Flow

### Flow
1. User enters an amount on **Balance** page.
2. Backend creates **Mollie payment** with `method=ideal`.
3. User is redirected to Mollie → bank → success.
4. Mollie webhook confirms payment.
5. We **credit balance** and create a transaction + ledger entries.

**Important:** only credit balance after webhook confirmation.

### Required fields
- `amount_cents`
- `user_id`
- `payment_method = ideal`
- `type = topup`
- `status = pending` → `paid`

---

## Transactions + Ledger (Traceability)

### Transaction Types
- `topup` (Mollie iDEAL)
- `reservation` (wallet charge)
- `refund` (manual admin credit)

### Statuses
- `pending`, `paid`, `failed`, `canceled`, `refunded`

### Ledger Entries (examples)
**Top-up**
- Debit: `cash` +amount
- Credit: `user_balance` +amount

**Reservation charge**
- Debit: `user_balance` -amount
- Credit: `revenue` +amount

**Manual refund**
- Debit: `refunds` +amount
- Credit: `user_balance` +amount

---

## Admin Manual Refund (Balance Adjustment)

### Trigger
- User emails support for cash refund.

### Action
- Admin creates a **manual refund transaction**:
  - `type = refund`
  - `payment_method = manual`
  - `amount_cents` (positive credit to balance)
  - `reason` required
- Update `users.balance_cents`.
- Log in `audit_logs`.

---

## UI Requirements

### Volunteer
- Balance page with:
  - Current balance
  - iDEAL top-up form
  - Transaction history
- Cancellation dialog:
  - **"Refund is credited to balance, not cash."**

### Admin
- Transactions overview:
  - Filters (status, type, user, date)
- Manual balance adjustment:
  - Amount + reason + confirmation
- Audit trail visible per user

---

## Notes
- This model avoids refund fees and keeps accounting clean.
- Mollie webhooks are the source of truth for payment success.
