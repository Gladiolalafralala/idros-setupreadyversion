// import_inquiries.mjs
// Imports all OTHER INQUERIES records from DISPATCH-2026_CLEANED.xlsx
// into Firebase production Firestore (other_inquiries collection)
//
// Run with: node import_inquiries.mjs
//
// Requirements:
// 1. npm install firebase xlsx
// 2. Must be connected to production Firebase (not emulator)

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { readFileSync } from "fs";
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
  // Already HH:MM format
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);
  return s;
}

function fmtDate(v) {
  if (!v) return "";
  if (typeof v === "number") {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(v);
    if (!date) return "";
    const y = date.y;
    const m = String(date.m).padStart(2, "0");
    const d = String(date.d).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = clean(v);
  // Handle various date formats
  const patterns = [
    { r: /^(\d{4})-(\d{2})-(\d{2})/, fmt: (m) => `${m[1]}-${m[2]}-${m[3]}` },
    { r: /^(\d{1,2})\/(\d{1,2})\/(\d{4})/, fmt: (m) => `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}` },
  ];
  for (const p of patterns) {
    const m = s.match(p.r);
    if (m) return p.fmt(m);
  }
  return s;
}

// ─── Read Excel ───────────────────────────────────────────────────────────────
console.log("\n📂  Reading DISPATCH-2026_CLEANED.xlsx...");

const workbook = XLSX.readFile("DISPATCH-2026_CLEANED.xlsx");
const ws = workbook.Sheets["OTHER INQUERIES"];

if (!ws) {
  console.error("❌  Sheet 'OTHER INQUERIES' not found in the Excel file.");
  process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

// Skip header row (row 0)
const dataRows = rows.slice(1).filter(row => row[0] || row[1]);

console.log(`✓  Found ${dataRows.length} records in OTHER INQUERIES sheet`);

// ─── Parse Records ────────────────────────────────────────────────────────────
// Columns: DATE, INQUIRIES, CALLER, CALL DIRECTION, LOCATION, TOC,
//          ACTION, REASON IF NOT ATTENDED, ACTION TAKEN, TYPE OF COMM, OPERATOR

const records = [];

for (const row of dataRows) {
  const date = fmtDate(row[0]);
  if (!date) continue; // skip rows without a date

  records.push({
    date:                 date,
    inquiries:            clean(row[1]),
    caller:               clean(row[2]),
    callDirection:        clean(row[3]),
    location:             clean(row[4]),
    toc:                  fmtTime(row[5]),
    action:               clean(row[6]),
    reasonIfNotAttended:  clean(row[7]),
    actionTaken:          clean(row[8]),
    typeOfComm:           clean(row[9]),
    operator:             clean(row[10]),
    source:               "imported",
  });
}

console.log(`✓  Parsed ${records.length} valid records`);

// ─── Upload to Firestore ──────────────────────────────────────────────────────
async function importAll() {
  console.log("\n🔥  Uploading to Firestore (other_inquiries collection)...\n");

  let success = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await addDoc(collection(db, "other_inquiries"), record);
      success++;
      if (success % 50 === 0) {
        console.log(`    ... ${success}/${records.length} uploaded`);
      }
    } catch (e) {
      console.error(`    ✗  Row ${i + 2}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n✅  Import complete!`);
  console.log(`    ✓  ${success} records uploaded successfully`);
  if (failed > 0) console.log(`    ✗  ${failed} records failed`);
  console.log(`\n  Check Firebase Console → Firestore → other_inquiries`);
  console.log(`  to verify the data is there.\n`);

  process.exit(0);
}

importAll().catch(e => {
  console.error("Import failed:", e.message);
  process.exit(1);
});
