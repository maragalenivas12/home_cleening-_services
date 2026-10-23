# Nestora — On-Demand Cleaning & Home Service Booking

Local service portal: choose a cleaning package, pick a date and time slot, select a cleaner, and rate the service.

## Run
```
npm install
npm start
```
Open http://localhost:3000 (Node.js 16+ required). Data is stored in `data/db.json` (delete it to reset).

## Deploy to Render

The repository includes a Render Blueprint in `render.yaml`. In the [Render Dashboard](https://dashboard.render.com), choose **New > Blueprint**, connect `maragalenivas12/home_cleening-_services`, select the `main` branch, and deploy the Blueprint. Render will provide a public HTTPS URL that works on mobile browsers.

The free service may sleep when idle, so its first request after inactivity can take longer. Account and booking data is stored in a local JSON file and is not persistent on the free plan; it can be lost when the service restarts or redeploys. Do not use the free deployment for production data.

## Tech
Frontend: HTML, CSS, vanilla JavaScript (SPA). Backend: Node.js + Express REST API, JSON file storage, scrypt password hashing, token sessions.
The responsive interface carries a shared visual design across the home page, service catalogue, booking flow, account forms, worker registration, and booking history.

## Demo flow (for viva)
1. Create account → 2. Book a package, pick slot and cleaner → 3. My bookings → "Mark completed" (demo shortcut) → 4. Rate cleaner → rating appears on the Cleaners list.

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Create an account and sign in |
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

A mobile number is optional and, when provided, must use international (E.164) format, for example `+919876543210`. Creating an account signs the user in immediately; registration does not send email or require OTP verification. An email address can only be registered once.
