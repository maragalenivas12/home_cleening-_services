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

## Demo flow (for viva)
1. Create account → 2. Book a package, pick slot and cleaner → 3. My bookings → "Mark completed" (demo shortcut) → 4. Rate cleaner → rating appears on the Cleaners list.

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | Sign up / sign in |
| GET | /api/packages, /api/staff | Catalogue and rated cleaners |
| GET | /api/slots?date= | Time slots with free-cleaner count |
| GET | /api/availability?date=&slot= | Free cleaners for a slot |
| POST | /api/bookings | Create booking (auth) |
| GET | /api/bookings | My bookings (auth) |
| PATCH | /api/bookings/:id/cancel, /complete | Cancel / complete |
| POST | /api/bookings/:id/rate | Rate cleaner 1–5 (after completion) |

Double-booking is prevented: a cleaner cannot be booked twice in the same slot.
