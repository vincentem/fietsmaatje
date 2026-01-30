# User Messages & Notifications (Volunteer Portal)

## Goals
- Show **all booking + payment notifications** in the volunteer portal.
- Provide **full details** (reservation, payment, status).
- Later deliver the **same notifications via email**.

---

## Storage Model

### Table: `user_notifications`
Fields:
- `user_id` (FK)
- `type` (booking/payment/etc.)
- `title`, `body`
- `payload` (structured JSON)
- `status` (`unread` | `read`)
- `created_at`, `read_at`

This is **separate** from delivery notifications (`notifications` table).

---

## Message Types (initial)
- `booking.confirmed`
- `booking.canceled`
- `payment.created`
- `payment.topup`
- `payment.paid`
- `payment.failed`
- `payment.refunded` (manual/admin)

---

## Payload Structure

### Booking
```json
{
  "reservation": {
    "id": 123,
    "bike_id": 5,
    "bike_name": "Duo Blue",
    "bike_code": "BIKE-005",
    "location_id": 2,
    "location_name": "Centrum",
    "start_datetime": "2026-02-12T10:00:00Z",
    "end_datetime": "2026-02-12T11:00:00Z",
    "status": "BOOKED"
  },
  "payment": {
    "transaction_id": 55,
    "amount_cents": 1000,
    "status": "paid",
    "method": "balance"
  }
}
```

### Payment
```json
{
  "payment": {
    "transaction_id": 55,
    "amount_cents": 1000,
    "status": "paid",
    "method": "ideal"
  }
}
```

---

## Volunteer Portal UI
- New **“Berichten”** page
- Filters (later): all / bookings / payments
- Shows:
  - title + body
  - timestamps
  - reservation/payment details
  - status badge
- Actions: **mark as read**

---

## Email Later (Phase 2)
- Use the same `user_notifications` payload.
- Create templates per `type`.
- Send by a worker; mark delivery status separately.

---

## Notes
- No automatic cash refunds: cancellation credits balance only.
- Manual refunds done by admin and logged as notifications.
