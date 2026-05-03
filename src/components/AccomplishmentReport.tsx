import React, { useState, useMemo } from 'react';
import { Printer, User } from 'lucide-react';

function toDate(ts: any): Date {
  if (!ts) return new Date();
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #accomplishment-print, #accomplishment-print * { visibility: visible !important; }
  #accomplishment-print {
    position: fixed !important;
    inset: 0 !important;
    background: white !important;
    padding: 12px 16px !important;
    font-family: Arial, sans-serif !important;
    font-size: 7.5pt !important;
    color: #000 !important;
  }
  @page { size: A4 landscape; margin: 8mm; }
}`;

interface AccomplishmentReportProps {
  incidents: any[];
}

export default function AccomplishmentReport({ incidents }: AccomplishmentReportProps) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [employeeName, setEmployeeName] = useState('');
  const [position, setPosition] = useState('');
  const [division, setDivision] = useState('WARNING OPERATION - DISPATCH');
  const [certifiedBy, setCertifiedBy] = useState('KATHRINA PIA D. PEDRO');
  const [notedBy, setNotedBy] = useState('JOEL S. EUGENIO');

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const filtered = useMemo(() => incidents.filter(i => {
    const d = toDate(i.timestamp);
    return d.getMonth() === month && d.getFullYear() === year;
  }), [incidents, month, year]);

  const countByDay = (dayNum: number, triageCodes: string[]) => {
    const count = filtered.filter(i => {
      const d = toDate(i.timestamp);
      return d.getDate() === dayNum && triageCodes.includes(i.triage);
    }).length;
    return count > 0 ? count : null;
  };

  const rowTotal = (triageCodes: string[]) =>
    filtered.filter(i => triageCodes.includes(i.triage)).length;

  const OUTPUTS = [
    { num: 1, label: 'Emergency Calls: Trauma Incidents', triages: ['TE'], color: '#7F1D1D' },
    { num: 2, label: 'Emergency Calls: Medical Incidents', triages: ['ME'], color: '#1E3A5F' },
    { num: 3, label: 'Non-Emergency: Transport Assistance', triages: ['TR'], color: '#14532D' },
    { num: 4, label: 'Non-Emergency: Standby Medic', triages: ['ST'], color: '#1E1B4B' },
    { num: 5, label: 'Fire Emergency Response', triages: ['FE'], color: '#7C2D12' },
  ];

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = PRINT_STYLE;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1500);
  };

  const cellStyle = (isHeader = false, bg?: string): React.CSSProperties => ({
    border: '1px solid #000',
    padding: '2px 3px',
    textAlign: 'center',
    fontSize: 7,
    fontFamily: 'Arial',
    fontWeight: isHeader ? 'bold' : 'normal',
    background: bg || (isHeader ? '#1F3864' : 'white'),
    color: isHeader ? '#fff' : '#000',
    whiteSpace: 'nowrap',
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
          <User className="w-5 h-5 text-yellow-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">Daily Performance Monitoring Report</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
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
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Division / Section</label>
            <input value={division} onChange={e => setDivision(e.target.value)}
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-yellow-400" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Name of Employee</label>
            <input value={employeeName} onChange={e => setEmployeeName(e.target.value)}
              placeholder="Full Name"
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-yellow-400" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Position</label>
            <input value={position} onChange={e => setPosition(e.target.value)}
              placeholder="e.g. Administrative Aide I"
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-yellow-400" />
          </div>

          <div className="space-y-2 flex items-end">
            <button onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-yellow-400 text-[#0f172a] font-black py-4 rounded-xl text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 p-3 bg-[#0f172a]/60 rounded-xl border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 self-center" />
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
            {filtered.length} total · {MONTHS[month]} {year}
          </span>
          {OUTPUTS.map(o => (
            <span key={o.num} className="text-[10px] font-bold text-white/30">
              · {o.triages[0]}: {rowTotal(o.triages)}
            </span>
          ))}
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/50 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Report Preview</span>
          <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">A4 Landscape</span>
        </div>

        <div className="p-6 bg-[#0f172a]/30 overflow-x-auto">
          <div id="accomplishment-print" className="bg-white rounded-lg shadow-2xl mx-auto"
            style={{ minWidth: 1000, padding: '14px 18px', fontFamily: 'Arial', fontSize: 8, color: '#000' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 8, fontWeight: 'bold' }}>Republic of the Philippines · Province of Bulacan · City of Malolos</div>
              <div style={{ fontSize: 11, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' }}>
                Daily Performance Monitoring
              </div>
            </div>

            {/* Info table */}
            <table style={{ width: '100%', marginBottom: 6, fontSize: 8, fontFamily: 'Arial' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold', width: 120 }}>OFFICE:</td>
                  <td style={{ borderBottom: '1px solid #000', paddingLeft: 4, width: 200 }}>CMO - CDRRMO</td>
                  <td style={{ fontWeight: 'bold', width: 60, paddingLeft: 16 }}>MONTH:</td>
                  <td style={{ borderBottom: '1px solid #000', paddingLeft: 4, width: 100 }}>{MONTHS[month].toUpperCase()}</td>
                  <td style={{ fontWeight: 'bold', width: 50, paddingLeft: 16 }}>YEAR:</td>
                  <td style={{ borderBottom: '1px solid #000', paddingLeft: 4 }}>{year}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', paddingTop: 4 }}>DIVISION/SECTION:</td>
                  <td colSpan={5} style={{ borderBottom: '1px solid #000', paddingLeft: 4, paddingTop: 4 }}>{division}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', paddingTop: 4 }}>NAME OF EMPLOYEE:</td>
                  <td style={{ borderBottom: '1px solid #000', paddingLeft: 4, paddingTop: 4 }}>{employeeName || '___________________________'}</td>
                  <td style={{ fontWeight: 'bold', paddingLeft: 16, paddingTop: 4 }}>POSITION:</td>
                  <td colSpan={3} style={{ borderBottom: '1px solid #000', paddingLeft: 4, paddingTop: 4 }}>{position || '___________________________'}</td>
                </tr>
              </tbody>
            </table>

            {/* Main table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={{ ...cellStyle(true), width: 22 }}>NO.</th>
                  <th style={{ ...cellStyle(true), textAlign: 'left', minWidth: 180 }}>OUTPUT / ACCOMPLISHED</th>
                  {days.map(d => (
                    <th key={d} style={{ ...cellStyle(true), width: 16, fontSize: 6 }}>{d}</th>
                  ))}
                  {Array.from({ length: 31 - daysInMonth }).map((_, i) => (
                    <th key={`pad-${i}`} style={{ ...cellStyle(true), width: 16, background: '#374151', fontSize: 6 }}></th>
                  ))}
                  <th style={{ ...cellStyle(true), width: 36 }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {OUTPUTS.map(output => (
                  <tr key={output.num}>
                    <td style={{ ...cellStyle(), fontWeight: 'bold' }}>{output.num}</td>
                    <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: 8, fontFamily: 'Arial', textAlign: 'left', fontWeight: 'bold' }}>
                      {output.label}
                    </td>
                    {days.map(d => {
                      const val = countByDay(d, output.triages);
                      return (
                        <td key={d} style={{
                          ...cellStyle(),
                          background: val ? '#DCFCE7' : 'white',
                          fontWeight: val ? 'bold' : 'normal',
                          color: val ? '#166534' : '#000',
                          fontSize: 7,
                        }}>
                          {val || ''}
                        </td>
                      );
                    })}
                    {Array.from({ length: 31 - daysInMonth }).map((_, i) => (
                      <td key={`pad-${i}`} style={{ ...cellStyle(), background: '#F3F4F6' }}></td>
                    ))}
                    <td style={{ ...cellStyle(), fontWeight: 'bold', background: '#FEF9C3', fontSize: 9 }}>
                      {rowTotal(output.triages) || ''}
                    </td>
                  </tr>
                ))}

                {/* Daily total row */}
                <tr style={{ background: '#F3F4F6' }}>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '2px 4px', fontWeight: 'bold', fontSize: 8, fontFamily: 'Arial' }}>
                    DAILY TOTAL
                  </td>
                  {days.map(d => {
                    const total = filtered.filter(i => toDate(i.timestamp).getDate() === d).length;
                    return (
                      <td key={d} style={{
                        ...cellStyle(),
                        fontWeight: 'bold',
                        background: total > 0 ? '#FEF9C3' : '#F3F4F6',
                        fontSize: 7,
                      }}>
                        {total > 0 ? total : ''}
                      </td>
                    );
                  })}
                  {Array.from({ length: 31 - daysInMonth }).map((_, i) => (
                    <td key={`pad-${i}`} style={{ ...cellStyle(), background: '#E5E7EB' }}></td>
                  ))}
                  <td style={{ ...cellStyle(), fontWeight: 'bold', background: '#FDE68A', fontSize: 9 }}>
                    {filtered.length || ''}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signature block */}
            <table style={{ width: '100%', fontSize: 8, fontFamily: 'Arial' }}>
              <tbody>
                <tr>
                  <td style={{ width: '5%' }}></td>
                  <td style={{ width: '28%', textAlign: 'center', paddingTop: 28 }}>
                    <div style={{ borderTop: '1px solid #000', paddingTop: 3 }}>
                      <div style={{ fontWeight: 'bold' }}>{employeeName || '___________________________'}</div>
                      <div>Employee</div>
                      <div style={{ fontStyle: 'italic', marginTop: 2 }}>Prepared by</div>
                    </div>
                  </td>
                  <td style={{ width: '5%' }}></td>
                  <td style={{ width: '28%', textAlign: 'center', paddingTop: 28 }}>
                    <div style={{ borderTop: '1px solid #000', paddingTop: 3 }}>
                      <div style={{ fontWeight: 'bold' }}>{certifiedBy}</div>
                      <div>Division Head</div>
                      <div style={{ fontStyle: 'italic', marginTop: 2 }}>Certified Correct by</div>
                    </div>
                  </td>
                  <td style={{ width: '5%' }}></td>
                  <td style={{ width: '28%', textAlign: 'center', paddingTop: 28 }}>
                    <div style={{ borderTop: '1px solid #000', paddingTop: 3 }}>
                      <div style={{ fontWeight: 'bold' }}>{notedBy}</div>
                      <div>City Administrator</div>
                      <div style={{ fontStyle: 'italic', marginTop: 2 }}>Noted by</div>
                    </div>
                  </td>
                  <td style={{ width: '1%' }}></td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>
      </div>
    </div>
  );
}
