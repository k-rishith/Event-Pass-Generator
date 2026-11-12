# Event Pass Platform

A simple, modern web application that lets users discover events, register, and download professional digital event passes. Organizers can create events, manage attendees, and validate passes with QR scanning.

Built with React, JavaScript, and CSS, with data stored in the browser's `localStorage`.

> ⚠️ **Frontend prototype:** This project uses `localStorage` for data. It does **not** provide secure authentication or true cross-device one-time ticket validation. For production, replace the storage layer with a backend API and database. See "Important Limitation" below.

## Features

### Public event discovery (Home)
- Browse all available/upcoming events without signing in
- Event cards with banner, name, description, date/time, venue, ticket types, prices, available seats, and event status
- Search events by name
- Filters: All, Upcoming, Today, This Week, Free, Paid
- Event statuses: UPCOMING, OPEN, ONGOING, SOLD OUT, COMPLETED, CANCELLED
- `View Event` and `Register` buttons

### Event details & registration
- Dedicated event details page with banner, description, date/time, venue, ticket tiers, and availability
- Registration is open to everyone (no sign-in required)
- Ticket tier selection with price and quantity
- Seat/capacity tracking; registration blocked when sold out or ended
- After registration, a digital pass (ACTIVE) is generated and can be downloaded as PDF

### Authentication
- Sign in / Create account (not required to browse)
- After signing in, the user returns to the event/page they originally wanted
- Passwords stored/compared in plain text (prototype only — not secure)

### User dashboard (`/user-dashboard`)
- Registrations: event name, date, ticket type, registration status, pass status, View Pass
- Passes: list of passes with statuses ACTIVE / USED / EXPIRED / CANCELLED; download valid passes

### Organizer dashboard (`/organizer`)
- Manage all events on this device: create, edit, cancel events; manage passes; scan entry
- Overview: registrations, active/used/expired/cancelled passes, available seats, registrations-by-ticket-type chart
- Create Event: name, description, banner image, date, start/end time, venue, capacity, multiple ticket tiers (name, price, quantity)
- Events: Manage Event per event
- Manage Passes: search, filter by status, view details, cancel passes
- Scan Pass: camera QR scanner (with manual Pass ID fallback) to validate entry

### One-time-use passes & validation
- Every pass has a unique Pass ID; the QR code contains only that ID
- Pass lifecycle: ACTIVE → USED on first successful scan; re-scans denied
- Passes expire after the event's configured end time (EXPIRED) and cannot be marked USED
- Cancelled passes are denied
- Validation order: pass exists → correct event → cancelled → expired → already used → approved
- Clear approve/deny feedback screens

### Digital pass download
- Download Pass (PDF) preserves the pass design: event name, attendee, ticket type, date/time, venue, Pass ID, QR code, pass status
- Ticket-tier-specific animated pass designs (Student, Regular, VIP, Premium)

### Technical
- React (JavaScript, not TypeScript)
- HTML / JSX
- CSS (no Tailwind)
- Vite
- `react-router-dom` — routing between Home, Event Details, Register, User Dashboard, Organizer Dashboard
- `qrcode.react` — QR code rendering (Pass ID only)
- `html2canvas` + `jspdf` — PDF pass download
- `html5-qrcode` — camera QR scanning
- Browser `localStorage`
- Vercel (deployment)

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd event-pass-generator

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build

```bash
npm run build
```

The production output is generated in the `dist/` folder.

## Deployment (Netlify)

The repository-root `netlify.toml` configures Netlify to install and build the app
from `event-pass-generator/` and publish its `dist/` directory. The deployment
command runs `npm ci --include=dev` before building so Vite and the other build
tools are installed from the lockfile, including when development dependencies
would otherwise be omitted. It also rewrites
application routes to `index.html`, so opening or refreshing links such as
`/user-dashboard`, `/organizer`, and `/events/:eventId` loads the React app.

Deploy the repository with Netlify using this configuration. No environment
variables are required.

## Deployment (Vercel)

1. Push this project to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and sign in (free account).
3. Click **"Add New Project"**, import your GitHub repo.
4. Vercel detects the Vite framework automatically:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Click **Deploy**. No environment variables are required.

`vercel.json` includes a rewrite so all routes serve `index.html` (SPA routing).

## Project Structure

```
event-pass-generator/
├── public/              # Static public assets
├── src/
│   ├── assets/          # Images and static assets
│   ├── components/      # Reusable UI pieces (Header, EventCard, EventPass)
│   ├── pages/           # Page views (Home, EventDetails, RegisterEvent, UserDashboard, OrganizerDashboard, Overview, CreateEvent, MyEvents, ManagePasses, ManageEvent, ScanPass)
│   ├── utils/           # Pure helper functions (storage, passValidation, eventStatus, generatePassId, downloadPass, seedDemo, exportImport)
│   ├── App.jsx          # Router shell + shared state
│   ├── App.css          # Component styles
│   ├── index.css        # Base design tokens and reset
│   └── main.jsx         # React entry point
├── vercel.json          # Vercel SPA routing rewrite
├── .gitignore           # Files ignored by Git (node_modules, dist, .env)
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md            # This file
```

### `components/`
Presentational UI components receiving data via props.

### `pages/`
Page-level views. Each page owns its local UI state; shared data flows from `App.jsx`.

### `utils/`
Pure JavaScript helper functions:
- `storage.js` — localStorage load/save + legacy data migration + ID generators + reset
- `passValidation.js` — single source of truth for pass status and ordered scan-validation rules
- `eventStatus.js` — event states and seat/capacity computation
- `generatePassId.js` — unique `EVT-YYYY-XXXXX` IDs
- `downloadPass.js` — PDF download helper
- `seedDemo.js` — sample events/registrations/passes for demo
- `exportImport.js` — export/import app data as JSON

## Future Improvements

- Backend API + database instead of `localStorage` (required for secure auth and cross-device one-time validation)
- Real ticket verification by scanning the QR code against a server
- Email delivery of generated passes
- Event organizer analytics with charts
- More ticket tier animations and pass themes

## Important Limitation (frontend prototype)

`localStorage` is per-browser and per-device. It does **not** provide secure authentication or real-world one-time ticket validation across multiple devices. Two devices could validate the same pass simultaneously. For a production ticketing system, scanning must communicate with a centralized backend/database so that when one device marks a ticket as `USED`, another device cannot reuse it.

The validation logic is separated into `utils/passValidation.js` so the storage layer can be swapped for an API later.

## License

MIT
