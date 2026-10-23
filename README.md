# Nestora — On-Demand Cleaning & Home Service Booking

Local service portal: choose a cleaning package, pick a date and time slot, select a cleaner, and rate the service.

## Run
```
npm install
npm start
```
Open http://localhost:3000 (Node.js 16+ required). Data is stored in `data/db.json` (delete it to reset).

## Tech
Frontend: HTML, CSS, vanilla JavaScript (SPA). Backend: Node.js + Express REST API, JSON file storage, scrypt password hashing, token sessions.
The responsive interface carries a shared visual design across the home page, service catalogue, booking flow, account forms, worker registration, and booking history.

## Demo flow (for viva)
1. Create account → 2. Book a package, pick slot and cleaner → 3. My bookings → "Mark completed" (demo shortcut) → 4. Rate cleaner → rating appears on the Cleaners list.

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Start sign-up and receive an OTP challenge |
| POST | /api/auth/register/verify-otp | Verify OTP and create the account |
| POST | /api/auth/login | Sign in |
| GET | /api/packages, /api/staff | Catalogue and rated cleaners |
| POST | /api/workers/register | Register a worker (name, experience, mobile, address) |
| GET | /api/slots?date= | Time slots with free-cleaner count |
| GET | /api/availability?date=&slot= | Free cleaners for a slot |
| POST | /api/bookings | Create booking (auth) |
| GET | /api/bookings | My bookings (auth) |
| PATCH | /api/bookings/:id/cancel, /complete | Cancel / complete |
| POST | /api/bookings/:id/rate | Rate cleaner 1–5 (after completion) |

Double-booking is prevented: a cleaner cannot be booked twice in the same slot.

New-account sign-up requires a six-digit OTP sent to the email address entered during registration. A mobile number is optional and, when provided, must use international (E.164) format, for example `+919876543210`.

## Email OTP

Nestora sends registration OTPs through SMTP. Gmail works well for local testing; use a Gmail App Password rather than your normal account password. Other SMTP providers (such as Outlook, SendGrid SMTP, Mailgun SMTP, or Amazon SES) work with the same settings.

1. Enable two-step verification on your Gmail account and create an App Password.
2. Copy `.env.example` to `.env` and fill in the SMTP settings. Nestora loads this private file automatically at startup:

```powershell
Copy-Item .env.example .env
# Edit .env and set SMTP_USER, SMTP_PASS, and (if needed) SMTP_FROM.
npm start
```

`SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are required for registration. OTPs are delivered to the exact email address entered by the user; the code is never displayed in the browser. If the mail server rejects a request, the registration page shows a useful error. Never put SMTP credentials in browser code.

If Gmail reports an authentication error (`EAUTH`), make sure `SMTP_PASS` is the 16-character App Password generated for the same account configured in `SMTP_USER` (not the regular Gmail password). Nestora removes spaces from the pasted App Password. Restart the server after updating `.env`.
