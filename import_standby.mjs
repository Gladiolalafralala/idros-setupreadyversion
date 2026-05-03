// import_standby.mjs
// Imports all STANDBY-Database records from DISPATCH-2026_CLEANED.xlsx
// into Firebase production Firestore (standby_records collection)
//
// Run with: node import_standby.mjs
//
// Requirements:
// 1. npm install firebase xlsx (already done)
// 2. Place DISPATCH-2026_CLEANED.xlsx in the same folder

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

// ─── Firebase Production Config ───────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCPSZEhosbdaEgh7i2CXxSda2qkQzy6Cf0",
  authDomain: "drrmvault.firebaseapp.com",
  projectId: "drrmvault",
  storageBucket: "drrmvault.firebasestorage.app",
  messagingSenderId: "354810594644",
  appId: "1:354810594644:web:df5d2901ec91ce1301b4c1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clean(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function fmtTime(v) {
  if (!v) return "";
  const s = clean(v);
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);
  return s;
}

function fmtDate(v) {
  if (!v) return "";
  if (typeof v === "number") {
    const date = XLSX.SSF.parse_date_code(v);
    if (!date) return "";
    return `${date.y}-${String(date.m).padStart(2,"0")}-${String(date.d).padStart(2,"0")}`;
  }
  const s = clean(v);
  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m2) return `${m2[3]}-${m2[1].padStart(2,"0")}-${m2[2].padStart(2,"0")}`;
  return s;
}

// ─── Read Excel ───────────────────────────────────────────────────────────────
console.log("\n📂  Reading DISPATCH-2026_CLEANED.xlsx...");

const workbook = XLSX.readFile("DISPATCH-2026_CLEANED.xlsx");
const ws = workbook.Sheets["STANDBY-Database"];

if (!ws) {
  console.error("❌  Sheet 'STANDBY-Database' not found.");
  process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

// Print headers to understand column order
console.log("Headers:", rows[0]);

const dataRows = rows.slice(1).filter(row => row[0] || row[1]);
console.log(`✓  Found ${dataRows.length} records`);

// ─── Parse Records ────────────────────────────────────────────────────────────
// Based on your Excel format for Standby:
// DATE, INCIDENT, REQUESTED BY, DATE OF EVENT, TIME OF EVENT,
// NAME OF EVENT, LOCATION, ADDRESS/LANDMARK,
// RESPONDER1, RESPONDER2, RESPONDER3, UNIT,
// DISPATCH, ODO/KM, ARRIVAL, ODO/KM, OPERATOR

const records = [];

for (const row of dataRows) {
  const date = fmtDate(row[0]);
  if (!date) continue;

  records.push({
    date:             date,
    incident:         clean(row[1]) || "STAND BY MEDIC",
    requestedBy:      clean(row[2]),
    dateOfEvent:      fmtDate(row[3]) || date,
    timeOfEvent:      fmtTime(row[4]),
    nameOfEvent:      clean(row[5]),
    location:         clean(row[6]),
    landmark:         clean(row[7]),
    responder1:       clean(row[8]),
    responder2:       clean(row[9]),
    responder3:       clean(row[10]),
    unit:             clean(row[11]),
    timeOfDispatch:   fmtTime(row[12]),
    odometerStart:    clean(row[13]),
    timeOfArrival:    fmtTime(row[14]),
    odometerEnd:      clean(row[15]),
    operator:         clean(row[16]),
    triage:           "ST",
    source:           "imported",
    createdAt:        new Date(date + "T08:00:00"),
  });
}

console.log(`✓  Parsed ${records.length} valid standby records`);

// ─── Upload to Firestore ──────────────────────────────────────────────────────
async function importAll() {
  console.log("\n🔥  Uploading to Firestore (standby_records collection)...\n");

  let success = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i++) {
    try {
      await addDoc(collection(db, "standby_records"), records[i]);
      success++;
      if (success % 20 === 0) console.log(`    ... ${success}/${records.length}`);
    } catch (e) {
      console.error(`    ✗  Row ${i + 2}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n✅  Done!`);
  console.log(`    ✓  ${success} standby records uploaded`);
  if (failed > 0) console.log(`    ✗  ${failed} failed`);
  console.log(`\n  Check Firebase Console → standby_records\n`);
  process.exit(0);
}

importAll().catch(e => {
  console.error("Failed:", e.message);
  process.exit(1);
});
