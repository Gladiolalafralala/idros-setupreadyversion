import React, { useState, useMemo } from 'react';
import { Printer, FileText } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function toDate(ts: any): Date {
  if (!ts) return new Date();
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

function fmtDate(ts: any) {
  try {
    return toDate(ts).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return ''; }
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

// ─── Print Style ─────────────────────────────────────────────────────────────
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #idros-report-print, #idros-report-print * { visibility: visible !important; }
  #idros-report-print {
    position: fixed !important;
    inset: 0 !important;
    background: white !important;
    padding: 16px 24px !important;
    font-family: Arial, sans-serif !important;
    font-size: 8.5pt !important;
    color: #000 !important;
  }
  @page { size: A4 landscape; margin: 10mm; }
}`;

// ─── Shared Report Header ─────────────────────────────────────────────────────
const ReportHeader = ({ title, period }: { title: string; period: string }) => (
  <div style={{ textAlign: 'center', marginBottom: 12, borderBottom: '2px solid #000', paddingBottom: 8 }}>
    <div style={{ fontSize: 8, fontFamily: 'Arial' }}>Republic of the Philippines · Province of Bulacan · City of Malolos</div>
    <div style={{ fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial' }}>
      CITY DISASTER RISK REDUCTION AND MANAGEMENT OFFICE
    </div>
    <div style={{ fontSize: 12, fontWeight: 'bold', fontFamily: 'Arial', textTransform: 'uppercase', marginTop: 4 }}>
      {title}
    </div>
    <div style={{ fontSize: 9, fontFamily: 'Arial', marginTop: 2 }}>Period: {period}</div>
  </div>
);

// ─── Signature Block ──────────────────────────────────────────────────────────
const SignatureBlock = ({ preparedBy }: { preparedBy: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginTop: 32 }}>
    {[
      { label: preparedBy || 'Operations Officer', sub: 'Prepared by' },
      { label: 'KATHRINA PIA D. PEDRO', sub: 'Certified Correct by' },
      { label: 'JOEL S. EUGENIO', sub: 'Noted by' },
    ].map((s, i) => (
      <div key={i} style={{ textAlign: 'center' }}>
        <div style={{ borderTop: '1px solid #000', paddingTop: 4, marginTop: 32 }}>
          <div style={{ fontWeight: 'bold', fontSize: 9, fontFamily: 'Arial' }}>{s.label}</div>
          <div style={{ fontSize: 8, fontFamily: 'Arial', fontStyle: 'italic' }}>{s.sub}</div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Table helpers ────────────────────────────────────────────────────────────
const TH = ({ children, w }: { children: React.ReactNode; w?: number }) => (
  <th style={{
    border: '1px solid #000', padding: '3px 5px', background: '#1F3864',
    color: '#fff', fontWeight: 'bold', fontSize: 8, textAlign: 'center',
    fontFamily: 'Arial', whiteSpace: 'nowrap', width: w ? w : undefined
  }}>{children}</th>
);

const TD = ({ children, center, bold }: { children: React.ReactNode; center?: boolean; bold?: boolean }) => (
  <td style={{
    border: '1px solid #ccc', padding: '2px 4px', fontSize: 8,
    fontFamily: 'Arial', textAlign: center ? 'center' : 'left',
    fontWeight: bold ? 'bold' : 'normal', verticalAlign: 'top'
  }}>{children ?? ''}</td>
);

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT 1 — DISPATCH EMERGENCY (Trauma + Medical + Fire)
// ═══════════════════════════════════════════════════════════════════════════════
const EmergencyReport = ({ incidents, month, year, preparedBy }: any) => {
  const filtered = incidents.filter((i: any) => {
    const d = toDate(i.timestamp);
    return d.getMonth() === month && d.getFullYear() === year &&
      ['TE', 'ME', 'FE'].includes(i.triage);
  });

  // Also pull from trauma_records and medical_records if available
  const trauma = filtered.filter((i: any) => i.triage === 'TE');
  const medical = filtered.filter((i: any) => i.triage === 'ME');
  const fire = filtered.filter((i: any) => i.triage === 'FE');

  const renderTable = (rows: any[], label: string, color: string) => (
    <>
      <div style={{ fontWeight: 'bold', fontSize: 10, fontFamily: 'Arial',
        background: color, color: '#fff', padding: '3px 8px', marginTop: 12, marginBottom: 4 }}>
        {label} — {rows.length} record{rows.length !== 1 ? 's' : ''}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
        <thead>
          <tr>
            <TH>REF ID</TH>
            <TH>DATE</TH>
            <TH>TOC</TH>
            <TH>INCIDENT</TH>
            <TH>CALLER</TH>
            <TH>NUMBER</TH>
            <TH>LOCATION</TH>
            <TH>ADDRESS/LANDMARK</TH>
            <TH>RESP 1</TH>
            <TH>RESP 2</TH>
            <TH>RESP 3</TH>
            <TH>UNIT</TH>
            <TH>ODO/KM</TH>
            <TH>TOD</TH>
            <TH>ODO/KM</TH>
            <TH>TOA</TH>
            <TH>OPERATOR</TH>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={17} style={{ textAlign: 'center', padding: 8, border: '1px solid #ccc', fontStyle: 'italic', fontSize: 8, fontFamily: 'Arial' }}>No records for this period.</td></tr>
          ) : rows.map((inc: any, idx: number) => (
            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <TD center>{inc.id || inc.referenceId || ''}</TD>
              <TD center>{fmtDate(inc.timestamp)}</TD>
              <TD center>{inc.toc || inc.timeOfCall || ''}</TD>
              <TD center bold>{inc.triage || inc.nature || ''}</TD>
              <TD>{inc.callerName || inc.caller || ''}</TD>
              <TD center>{inc.callerContact || inc.callerNumber || ''}</TD>
              <TD>{inc.barangay || inc.location || ''}</TD>
              <TD>{inc.locationLandmark || inc.landmark || ''}</TD>
              <TD>{inc.responders?.[0] || inc.responder1 || ''}</TD>
              <TD>{inc.responders?.[1] || inc.responder2 || ''}</TD>
              <TD>{inc.responders?.[2] || inc.responder3 || ''}</TD>
              <TD center>{inc.unitNumber || inc.unit || ''}</TD>
              <TD center>{inc.odometerStart || ''}</TD>
              <TD center>{inc.tod || inc.timeOfDispatch || ''}</TD>
              <TD center>{inc.odometerEnd || ''}</TD>
              <TD center>{inc.toa || inc.timeOfArrival || ''}</TD>
              <TD>{inc.operatorName || inc.operator || ''}</TD>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  return (
    <div style={{ fontFamily: 'Arial', fontSize: 8, color: '#000' }}>
      <ReportHeader title="Dispatch Emergency Report" period={`${MONTHS[month]} ${year}`} />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total Emergency', value: filtered.length, color: '#1F3864' },
          { label: 'Trauma (TE)', value: trauma.length, color: '#DC2626' },
          { label: 'Medical (ME)', value: medical.length, color: '#1D4ED8' },
          { label: 'Fire (FE)', value: fire.length, color: '#EA580C' },
        ].map(s => (
          <div key={s.label} style={{ border: `2px solid ${s.color}`, padding: '6px 8px', textAlign: 'center', borderRadius: 4 }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 8, color: '#555' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {renderTable(trauma, 'TRAUMA EMERGENCY', '#7F1D1D')}
      {renderTable(medical, 'MEDICAL EMERGENCY', '#1E3A5F')}
      {renderTable(fire, 'FIRE EMERGENCY', '#7C2D12')}

      <SignatureBlock preparedBy={preparedBy} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT 2 — TRANSPORT / TRANSFER
// ═══════════════════════════════════════════════════════════════════════════════
const TransportReport = ({ incidents, month, year, preparedBy }: any) => {
  const filtered = incidents.filter((i: any) => {
    const d = toDate(i.timestamp);
    return d.getMonth() === month && d.getFullYear() === year && i.triage === 'TR';
  });

  return (
    <div style={{ fontFamily: 'Arial', fontSize: 8, color: '#000' }}>
      <ReportHeader title="Transport / Transfer Report" period={`${MONTHS[month]} ${year}`} />

      <div style={{ marginBottom: 8, fontSize: 9, fontFamily: 'Arial' }}>
        Total Records: <strong>{filtered.length}</strong>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
        <thead>
          <tr>
            <TH>REF ID</TH>
            <TH>DATE</TH>
            <TH>TYPE</TH>
            <TH>CALLER</TH>
            <TH>TOC</TH>
            <TH>ORIGIN</TH>
            <TH>DESTINATION</TH>
            <TH>RESPONDER 1</TH>
            <TH>RESPONDER 2</TH>
            <TH>RESPONDER 3</TH>
            <TH>UNIT</TH>
            <TH>TOD</TH>
            <TH>ODO/KM</TH>
            <TH>TOA</TH>
            <TH>ODO/KM</TH>
            <TH>OPERATOR</TH>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={16} style={{ textAlign: 'center', padding: 8, border: '1px solid #ccc', fontStyle: 'italic', fontSize: 8 }}>No records for this period.</td></tr>
          ) : filtered.map((inc: any, idx: number) => (
            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <TD center>{inc.id || inc.referenceId || ''}</TD>
              <TD center>{fmtDate(inc.timestamp)}</TD>
              <TD center>{inc.nature || 'Inter-facility'}</TD>
              <TD>{inc.callerName || ''}</TD>
              <TD center>{inc.toc || ''}</TD>
              <TD>{inc.locationDetails?.split(' to ')?.[0] || inc.barangay || ''}</TD>
              <TD>{inc.locationDetails?.split(' to ')?.[1] || inc.locationLandmark || ''}</TD>
              <TD>{inc.responders?.[0] || ''}</TD>
              <TD>{inc.responders?.[1] || ''}</TD>
              <TD>{inc.responders?.[2] || ''}</TD>
              <TD center>{inc.unitNumber || ''}</TD>
              <TD center>{inc.tod || ''}</TD>
              <TD center>{inc.odometerStart || ''}</TD>
              <TD center>{inc.toa || ''}</TD>
              <TD center>{inc.odometerEnd || ''}</TD>
              <TD>{inc.operatorName || ''}</TD>
            </tr>
          ))}
        </tbody>
      </table>

      <SignatureBlock preparedBy={preparedBy} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT 3 — STANDBY MEDIC
// ═══════════════════════════════════════════════════════════════════════════════
const StandbyReport = ({ incidents, month, year, preparedBy }: any) => {
  const filtered = incidents.filter((i: any) => {
    const d = toDate(i.timestamp);
    return d.getMonth() === month && d.getFullYear() === year && i.triage === 'ST';
  });

  return (
    <div style={{ fontFamily: 'Arial', fontSize: 8, color: '#000' }}>
      <ReportHeader title="Standby Medic Report" period={`${MONTHS[month]} ${year}`} />

      <div style={{ marginBottom: 8, fontSize: 9 }}>
        Total Records: <strong>{filtered.length}</strong>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
        <thead>
          <tr>
            <TH>DATE</TH>
            <TH>INCIDENT</TH>
            <TH>REQUESTED BY</TH>
            <TH>DATE OF EVENT</TH>
            <TH>TIME OF EVENT</TH>
            <TH>NAME OF EVENT</TH>
            <TH>LOCATION</TH>
            <TH>ADDRESS/LANDMARK</TH>
            <TH>RESPONDER 1</TH>
            <TH>RESPONDER 2</TH>
            <TH>RESPONDER 3</TH>
            <TH>UNIT</TH>
            <TH>DISPATCH</TH>
            <TH>ODO/KM</TH>
            <TH>ARRIVAL</TH>
            <TH>ODO/KM</TH>
            <TH>OPERATOR</TH>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={17} style={{ textAlign: 'center', padding: 8, border: '1px solid #ccc', fontStyle: 'italic', fontSize: 8 }}>No records for this period.</td></tr>
          ) : filtered.map((inc: any, idx: number) => (
            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <TD center>{fmtDate(inc.timestamp)}</TD>
              <TD center>STAND BY MEDIC</TD>
              <TD>{inc.callerName || ''}</TD>
              <TD center>{fmtDate(inc.timestamp)}</TD>
              <TD center>{inc.toc || ''}</TD>
              <TD>{inc.locationDetails || ''}</TD>
              <TD>{inc.barangay || ''}</TD>
              <TD>{inc.locationLandmark || ''}</TD>
              <TD>{inc.responders?.[0] || ''}</TD>
              <TD>{inc.responders?.[1] || ''}</TD>
              <TD>{inc.responders?.[2] || ''}</TD>
              <TD center>{inc.unitNumber || ''}</TD>
              <TD center>{inc.tod || ''}</TD>
              <TD center>{inc.odometerStart || ''}</TD>
              <TD center>{inc.toa || ''}</TD>
              <TD center>{inc.odometerEnd || ''}</TD>
              <TD>{inc.operatorName || ''}</TD>
            </tr>
          ))}
        </tbody>
      </table>

      <SignatureBlock preparedBy={preparedBy} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT 4 — FIRE & DROWNING
// ═══════════════════════════════════════════════════════════════════════════════
const FireReport = ({ incidents, fireRecords, month, year, preparedBy }: any) => {
  // Pull from fire_records collection if available, fallback to incidents FE
  const fromIncidents = incidents.filter((i: any) => {
    const d = toDate(i.timestamp);
    return d.getMonth() === month && d.getFullYear() === year && i.triage === 'FE';
  });

  const fromFireRecords = (fireRecords || []).filter((r: any) => {
    const d = toDate(r.createdAt || r.timestamp);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const records = fromFireRecords.length > 0 ? fromFireRecords : fromIncidents;

  return (
    <div style={{ fontFamily: 'Arial', fontSize: 8, color: '#000' }}>
      <ReportHeader title="Fire Emergency Report" period={`${MONTHS[month]} ${year}`} />

      <div style={{ marginBottom: 8, fontSize: 9 }}>
        Total Records: <strong>{records.length}</strong>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
        <thead>
          <tr>
            <TH>DATE</TH>
            <TH>INCIDENT</TH>
            <TH>CALLER</TH>
            <TH>TYPE OF FIRE</TH>
            <TH>TOC</TH>
            <TH>LOCATION</TH>
            <TH>RESPONDER</TH>
            <TH>DISPATCH</TH>
            <TH>ARRIVAL</TH>
            <TH>ODO/KM</TH>
            <TH>OPERATOR</TH>
            <TH>REMARKS</TH>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr><td colSpan={12} style={{ textAlign: 'center', padding: 8, border: '1px solid #ccc', fontStyle: 'italic', fontSize: 8 }}>No records for this period.</td></tr>
          ) : records.map((r: any, idx: number) => (
            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <TD center>{fmtDate(r.createdAt || r.timestamp)}</TD>
              <TD center>{r.callType === 'emergency' ? 'FIRE EMERGENCY' : r.nature || 'FIRE EMERGENCY'}</TD>
              <TD>{r.caller || r.callerName || ''}</TD>
              <TD center>{r.nature || ''}</TD>
              <TD center>{r.timeOfCall || r.toc || ''}</TD>
              <TD>{r.barangay || r.landmark || ''}</TD>
              <TD>{(r.unitsDispatched || []).join(', ') || r.responders?.[0] || ''}</TD>
              <TD center>{r.timeOfCall || r.tod || ''}</TD>
              <TD center>{r.toa || r.timeOfArrival || ''}</TD>
              <TD center>{r.odometerStart || ''}</TD>
              <TD>{r.operator || r.operatorName || ''}</TD>
              <TD>{r.remarks || r.status || ''}</TD>
            </tr>
          ))}
        </tbody>
      </table>

      <SignatureBlock preparedBy={preparedBy} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT 5 — OTHER INQUIRIES
// ═══════════════════════════════════════════════════════════════════════════════
const OtherInquiriesReport = ({ month, year, preparedBy }: any) => {
  // This report has its own collection — show empty template with correct columns
  return (
    <div style={{ fontFamily: 'Arial', fontSize: 8, color: '#000' }}>
      <ReportHeader title="Other Inquiries Report" period={`${MONTHS[month]} ${year}`} />

      <div style={{ marginBottom: 8, padding: '6px 8px', background: '#FEF9C3', border: '1px solid #CA8A04', borderRadius: 4, fontSize: 8, fontFamily: 'Arial' }}>
        ⚠️ This report requires an <strong>other_inquiries</strong> collection in Firestore.
        The columns below match your Excel format exactly.
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
        <thead>
          <tr>
            <TH>DATE</TH>
            <TH>INQUIRIES</TH>
            <TH>CALLER</TH>
            <TH>CALL DIRECTION</TH>
            <TH>LOCATION</TH>
            <TH>TOC</TH>
            <TH>ACTION</TH>
            <TH>REASON IF NOT ATTENDED</TH>
            <TH>ACTION TAKEN</TH>
            <TH>TYPE OF COMM</TH>
            <TH>OPERATOR</TH>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={11} style={{ textAlign: 'center', padding: 16, border: '1px solid #ccc', fontStyle: 'italic', fontSize: 8, fontFamily: 'Arial', color: '#888' }}>
              Connect the other_inquiries Firestore collection to populate this report.
            </td>
          </tr>
        </tbody>
      </table>

      <SignatureBlock preparedBy={preparedBy} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ReportGenerator Component
// ═══════════════════════════════════════════════════════════════════════════════
type ReportType = 'emergency' | 'transport' | 'standby' | 'fire' | 'other';

interface ReportGeneratorProps {
  incidents: any[];
  fireRecords?: any[];
}

export default function ReportGenerator({ incidents, fireRecords }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('emergency');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [preparedBy, setPreparedBy] = useState('');

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = PRINT_STYLE;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1500);
  };

  const REPORT_TYPES: { id: ReportType; label: string; icon: string; color: string }[] = [
    { id: 'emergency', label: 'Dispatch Emergency', icon: '🚨', color: 'bg-red-600' },
    { id: 'transport', label: 'Transport / Transfer', icon: '🚑', color: 'bg-emerald-600' },
    { id: 'standby', label: 'Standby Medic', icon: '⛑️', color: 'bg-blue-600' },
    { id: 'fire', label: 'Fire Emergency', icon: '🔥', color: 'bg-orange-600' },
    { id: 'other', label: 'Other Inquiries', icon: '📞', color: 'bg-purple-600' },
  ];

  // Count for badge
  const getCount = (type: ReportType) => {
    const filtered = incidents.filter(i => {
      const d = toDate(i.timestamp);
      if (d.getMonth() !== month || d.getFullYear() !== year) return false;
      if (type === 'emergency') return ['TE', 'ME', 'FE'].includes(i.triage);
      if (type === 'transport') return i.triage === 'TR';
      if (type === 'standby') return i.triage === 'ST';
      if (type === 'fire') return i.triage === 'FE';
      return false;
    });
    if (type === 'fire' && fireRecords) {
      const fr = fireRecords.filter(r => {
        const d = toDate(r.createdAt || r.timestamp);
        return d.getMonth() === month && d.getFullYear() === year;
      });
      return fr.length > 0 ? fr.length : filtered.length;
    }
    return filtered.length;
  };

  return (
    <div className="space-y-6">

      {/* Controls */}
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
          <FileText className="w-5 h-5 text-yellow-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">Report Generator</h3>
        </div>

        {/* Report type selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {REPORT_TYPES.map(r => (
            <button
              key={r.id}
              onClick={() => setReportType(r.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                reportType === r.id
                  ? 'bg-yellow-400 border-yellow-300 text-[#0f172a] shadow-lg'
                  : 'bg-[#0f172a] border-white/5 text-white/40 hover:text-white hover:border-white/20'
              }`}
            >
              <span className="text-xl leading-none">{r.icon}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold leading-tight">{r.label}</span>
              <span className={`text-[10px] font-black ${reportType === r.id ? 'text-[#0f172a]' : 'text-yellow-400'}`}>
                {r.id !== 'other' ? getCount(r.id) : '—'}
              </span>
            </button>
          ))}
        </div>

        {/* Period + Prepared By + Print */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-yellow-400 appearance-none">
              {MONTHS.map((m, i) => <option key={i} value={i} className="bg-[#0f172a]">{m}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Year</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-yellow-400 appearance-none">
              {YEARS.map(y => <option key={y} value={y} className="bg-[#0f172a]">{y}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Prepared By</label>
            <input value={preparedBy} onChange={e => setPreparedBy(e.target.value)}
              placeholder="Officer name..."
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-yellow-400" />
          </div>

          <div className="space-y-2 flex items-end">
            <button onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-yellow-400 text-[#0f172a] font-black py-4 rounded-xl text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>

        <p className="text-[9px] text-white/20 text-center font-bold uppercase tracking-wider mt-3">
          Use browser's "Save as PDF" when printing · Set paper to A4 Landscape
        </p>
      </div>

      {/* Report Preview */}
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/50 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Report Preview</span>
          <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">A4 Landscape</span>
        </div>

        <div className="p-6 bg-[#0f172a]/30 overflow-x-auto">
          <div id="idros-report-print" className="bg-white rounded-lg shadow-2xl mx-auto"
            style={{ minWidth: 900, padding: '20px 24px', minHeight: 500 }}>

            {reportType === 'emergency' && (
              <EmergencyReport incidents={incidents} month={month} year={year} preparedBy={preparedBy} />
            )}
            {reportType === 'transport' && (
              <TransportReport incidents={incidents} month={month} year={year} preparedBy={preparedBy} />
            )}
            {reportType === 'standby' && (
              <StandbyReport incidents={incidents} month={month} year={year} preparedBy={preparedBy} />
            )}
            {reportType === 'fire' && (
              <FireReport incidents={incidents} fireRecords={fireRecords} month={month} year={year} preparedBy={preparedBy} />
            )}
            {reportType === 'other' && (
              <OtherInquiriesReport month={month} year={year} preparedBy={preparedBy} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
