import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, Radio, CheckCircle2, XCircle, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Channel = 'Hotline' | 'Radio';
type Direction = 'Inbound' | 'Outbound';

interface CallEntry {
  id?: string;
  channel: Channel;
  direction: Direction;
  callerRef: string;
  concern: string;
  attended: boolean;
  resolution: string;
  time: string;
  date: string;
  createdAt: any;
}

export default function CallCounter({ userEmail }: { userEmail?: string }) {
  const [channel, setChannel] = useState<Channel>('Hotline');
  const [direction, setDirection] = useState<Direction>('Inbound');
  const [callerRef, setCallerRef] = useState('');
  const [concern, setConcern] = useState('');
  const [attended, setAttended] = useState<boolean | null>(null);
  const [resolution, setResolution] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const [entries, setEntries] = useState<CallEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const q = query(collection(db, 'call_counter'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      snap => { setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as CallEntry))); },
      (error) => console.error('call_counter listener error:', error.code, error.message)
    );
    return () => unsub();
  }, []);

  const todayEntries = entries.filter(e => e.date === new Date().toISOString().slice(0, 10));
  const filteredEntries = entries.filter(e => e.date === filterDate);

  const stats = {
    total: todayEntries.length,
    attended: todayEntries.filter(e => e.attended).length,
    unattended: todayEntries.filter(e => !e.attended).length,
    hotline: todayEntries.filter(e => e.channel === 'Hotline').length,
    radio: todayEntries.filter(e => e.channel === 'Radio').length,
  };

  const handleSave = async () => {
    if (!concern || attended === null) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'call_counter'), {
        channel,
        direction,
        callerRef,
        concern,
        attended,
        resolution,
        time,
        date,
        createdAt: new Date(),
        loggedBy: userEmail || 'operator'
      });
      setCallerRef('');
      setConcern('');
      setAttended(null);
      setResolution('');
      setDate(new Date().toISOString().slice(0, 10));
      setTime(new Date().toTimeString().slice(0, 5));
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const canSave = concern && attended !== null && !saving;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <Phone className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Call Counter</h2>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Call Log & Tracker</p>
          </div>
        </div>
        <button
          onClick={() => setShowLog(!showLog)}
          className="px-4 py-2 bg-navy-900 border border-white/10 rounded-xl text-[10px] font-bold uppercase text-white/40 hover:text-white transition-all"
        >
          {showLog ? 'Log Call' : `View Log (${entries.length})`}
        </button>
      </div>

      {!showLog ? (
        <>
          {/* Today's Stats */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Total Today', value: stats.total, color: 'text-white' },
              { label: 'Attended', value: stats.attended, color: 'text-emerald-400' },
              { label: 'Unattended', value: stats.unattended, color: 'text-red-400' },
              { label: 'Hotline', value: stats.hotline, color: 'text-blue-400' },
              { label: 'Radio', value: stats.radio, color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="bg-navy-800 border border-white/10 rounded-2xl p-3 text-center">
                <div className={cn("text-2xl font-black", s.color)}>{s.value}</div>
                <div className="text-[8px] uppercase tracking-widest text-white/30 font-bold mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="bg-navy-800 border border-white/10 rounded-3xl p-6 space-y-5">

            {/* Channel + Direction */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Hotline', 'Radio'] as Channel[]).map(c => (
                    <button key={c} onClick={() => setChannel(c)}
                      className={cn("py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                        channel === c ? "bg-blue-500 border-blue-500 text-white" : "bg-navy-900 border-white/5 text-white/30 hover:text-white"
                      )}>
                      {c === 'Hotline' ? <Phone className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Inbound', 'Outbound'] as Direction[]).map(d => (
                    <button key={d} onClick={() => setDirection(d)}
                      className={cn("py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                        direction === d ? "bg-blue-500 border-blue-500 text-white" : "bg-navy-900 border-white/5 text-white/30 hover:text-white"
                      )}>
                      {d === 'Inbound' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Time</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono" />
              </div>
            </div>

            {/* Caller Ref */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Phone Number / Radio Code</label>
              <input type="text" value={callerRef} onChange={e => setCallerRef(e.target.value)}
                placeholder="e.g. 09171234567 or BRG-04"
                className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500" />
            </div>

            {/* Concern */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Concern</label>
              <textarea value={concern} onChange={e => setConcern(e.target.value)} rows={2}
                placeholder="What was the call about?"
                className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500 resize-none" />
            </div>

            {/* Attended */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Was it Attended?</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setAttended(true)}
                  className={cn("py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                    attended === true ? "bg-emerald-500 border-emerald-500 text-white" : "bg-navy-900 border-white/5 text-white/30 hover:text-emerald-400 hover:border-emerald-500/30"
                  )}>
                  <CheckCircle2 className="w-4 h-4" /> Yes — Attended
                </button>
                <button onClick={() => setAttended(false)}
                  className={cn("py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                    attended === false ? "bg-red-500 border-red-500 text-white" : "bg-navy-900 border-white/5 text-white/30 hover:text-red-400 hover:border-red-500/30"
                  )}>
                  <XCircle className="w-4 h-4" /> No — Unattended
                </button>
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">
                {attended === false ? 'Reason (why unattended)' : 'Resolution'}
              </label>
              <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={2}
                placeholder={attended === false ? "e.g. Beyond scope, referred to MWSS" : "e.g. Provided number, relayed message"}
                className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500 resize-none" />
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={!canSave}
              className={cn(
                "w-full py-4 font-black rounded-2xl text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                flash ? "bg-emerald-500 text-white scale-[1.01]" :
                canSave ? "bg-blue-500 text-white hover:scale-[1.02] active:scale-[0.98]" : "bg-navy-900 text-white/20 border border-white/5"
              )}>
              {flash ? <><CheckCircle2 className="w-4 h-4" /> Logged!</> : <><Plus className="w-4 h-4" /> {saving ? 'Saving...' : 'Log This Call'}</>}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Filter by Date</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono" />
            <span className="text-[9px] text-white/30 font-bold uppercase">{filteredEntries.length} entries</span>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12 text-white/20 text-xs uppercase tracking-widest">No calls logged for this date</div>
          )}

          <div className="space-y-2">
            {filteredEntries.map(e => (
              <motion.div key={e.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-navy-800 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", e.attended ? 'bg-emerald-500' : 'bg-red-500')} />
                    <span className="text-xs font-black uppercase text-white">{e.concern}</span>
                  </div>
                  <span className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full border",
                    e.attended ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
                  )}>
                    {e.attended ? 'Attended' : 'Unattended'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[9px] text-white/30 font-mono">
                  <span>{e.date} {e.time}</span>
                  <span>{e.channel} · {e.direction}</span>
                  {e.callerRef && <span>{e.callerRef}</span>}
                </div>
                {e.resolution && (
                  <p className="mt-2 text-[10px] text-white/50 italic">{e.resolution}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
