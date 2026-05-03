# IDROS v2.5 — Local Development Setup
**Malolos CDRRMO | Firebase Emulator Edition**

---

## What this gives you locally
- Full Firebase Auth (login/register) — no real Google account needed
- Full Firestore database — runs on your computer, no internet required
- Pre-loaded seed data: 8 incidents, 6 ambulances, 10 personnel, 14 interventions
- 5 demo user accounts (Admin, OpCen, EMT, Fire, LDRRMO roles)
- Firebase Emulator UI at http://localhost:4000 — browse/edit data visually

---

## Prerequisites (install once)

### 1. Node.js
Download from https://nodejs.org (v18 or higher)
Verify: `node --version`

### 2. Firebase CLI
```
npm install -g firebase-tools
```
Verify: `firebase --version`

### 3. Java (required by Firebase Emulator)
Download from https://www.java.com/en/download/
Verify: `java -version`

---

## First-Time Setup

### Step 1 — Install project dependencies
Open a terminal inside the `idros` folder and run:
```
npm install
```

### Step 2 — Login to Firebase CLI (one-time)
```
firebase login
```
A browser window will open. Sign in with any Google account.
(You don't need to own the Firebase project — the emulator runs locally.)

### Step 3 — Start the Firebase Emulators
In your terminal (still in the `idros` folder):
```
firebase emulators:start --project demo-idros
```
Wait until you see:
```
✔  All emulators ready!
```

You should see:
- Auth Emulator:      http://localhost:9099
- Firestore Emulator: http://localhost:8080
- Emulator UI:        http://localhost:4000  ← open this in your browser

### Step 4 — Seed the database (open a NEW terminal tab)
Keep the emulators running in the first tab, then in a second terminal:
```
node seed.js
```
This will create all demo accounts and sample data.
You'll see a table of login credentials when it's done.

### Step 5 — Start the app (open another NEW terminal tab)
```
npm run dev
```
Open http://localhost:3000 in your browser.

---

## Demo Login Accounts

| Email                      | Password   | Role         | Access                              |
|----------------------------|------------|--------------|-------------------------------------|
| admin@malolos.gov.ph       | idros2025  | Admin        | Everything                          |
| opcen@malolos.gov.ph       | idros2025  | OpCen        | Dispatch intake, Dashboard          |
| emt1@malolos.gov.ph        | idros2025  | EMT          | Clinical Entry, Dashboard           |
| fire1@malolos.gov.ph       | idros2025  | Fire         | Fire Operations, Dashboard          |
| ldrrmo@malolos.gov.ph      | idros2025  | LDRRMO       | Everything                          |

---

## Daily Workflow (after first setup)

Every time you want to work on IDROS locally:

**Terminal 1 — Emulators:**
```
firebase emulators:start --project demo-idros
```

**Terminal 2 — App:**
```
npm run dev
```

Then open http://localhost:3000

> ⚠️  The emulator database resets every time you restart it.
> Run `node seed.js` again after restarting to reload the demo data.

---

## Firestore Collections (Database Schema)

| Collection            | Description                          | Key Fields                                      |
|-----------------------|--------------------------------------|-------------------------------------------------|
| `incidents`           | All dispatch calls & incidents       | id, status, priority, triage, nature, barangay  |
| `ambulances`          | Vehicle fleet registry               | unitId, plateNumber, status                     |
| `operators`           | Personnel / responders               | name, designation, shift                        |
| `system_interventions`| Clinical intervention options        | name                                            |

### Incident Status Flow
```
Active → Dispatched → On-Scene → Transporting → At-Hospital → Cleared
                                                           ↘ DOA
```

### Triage Categories
| Code | Label    | Color  | Natures                              |
|------|----------|--------|--------------------------------------|
| TE   | Trauma   | Red    | MVA, Fall, Assault, Gunshot, etc.    |
| ME   | Medical  | Blue   | Chest Pain, Seizure, Stroke, etc.    |
| FE   | Fire     | Orange | Residential, Commercial, Grass, etc. |
| TR   | Transfer | Green  | Inter-facility, Home to Hospital     |
| ST   | Standby  | Gold   | Event, VIP, Drill                    |

---

## Switching Between Local and Production

**Local (emulator)** — `.env.local`:
```
VITE_USE_EMULATOR=true
```

**Production (real Firebase)** — `.env.local`:
```
VITE_USE_EMULATOR=false
```
Or simply delete the `.env.local` file.

---

## Troubleshooting

**"firebase: command not found"**
→ Run `npm install -g firebase-tools` again, or restart your terminal.

**"Error: Could not start Firestore Emulator"**
→ Java is not installed. Download from https://www.java.com

**Seed script fails with connection refused**
→ Emulators are not running. Start them first in another terminal.

**App shows "Initializing Tactical Link..." forever**
→ Check that emulators are running and `.env.local` has `VITE_USE_EMULATOR=true`

**Port already in use**
→ Another process is using port 8080, 9099, or 4000.
→ Kill it with: `npx kill-port 8080 9099 4000`

---

*IDROS v2.5.0 — Malolos CDRRMO | Local Dev Guide*
