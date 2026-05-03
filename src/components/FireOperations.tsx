import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Clock, User, MapPin, Truck, CheckCircle2, Plus, ChevronRight, Save, Droplets, AlertTriangle } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MALOLOS_BARANGAYS } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FIRE_NATURES = ['Residential', 'Commercial', 'Grass Fire', 'Vehicular Fire', 'Electrical', 'Industrial'];
const NONEMERG_NATURES = ['Flushing', 'Rationing', 'Standby', 'Inspection', 'Rescue Assist'];
const FIRE_UNITS = ['Pumper 1', 'Pumper 2', 'BFP Unit', 'Ladder Truck', 'Rescue Truck'];
const FIRE_MARSHALS = ['I. Marata', 'MJ Nazar', 'BFP On-Duty'];
const RESOURCES = ['Hose Line', 'Water (liters)', 'Ladder', 'Nozzle', 'Foam', 'SCBA', 'Hydraulic Tool', 'First Aid Kit'];

type FireCallType = 'emergency' | 'non-emergency';
type FormStep = 'intake' | 'dispatch' | 'scene';

interface FireRecord {
  id?: string;
  callType: FireCallType;
  nature: string;
  timeOfCall: string;
  caller: string;
  barangay: string;
  landmark?: string;
  establishment?: string;
  timeOfDispatch?: string;
  unitsDispatched: string[];
  fireMarshals: string[];
  timeOfArrival?: string;
  fireControlTime?: string;
  fireExtinguishedTime?: string;
  returnToOpcen?: string;
  resourcesUsed: string[];
  notes?: string;
  status: 'open' | 'closed';
  createdAt: Date;
}

export default function FireOperations({ userEmail }: { userEmail?: string }) {
  const [step, setStep] = useState<FormStep>('intake');
  const [callType, setCallType] = useState<FireCallType>('emergency');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeRecord, setActiveRecord] = useState<FireRecord | null>(null);
  const [records, setRecords] = useState<FireRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Intake fields
  const [nature, setNature] = useState('');
  const [timeOfCall, setTimeOfCall] = useState(() => new Date().toTimeString().slice(0, 5));
  const [caller, setCaller] = useState('');
  const [barangay, setBarangay] = useState('');
  const [landmark, setLandmark] = useState('');
  const [establishment, setEstablishment] = useState('');

  // Dispatch fields
  const [timeOfDispatch, setTimeOfDispatch] = useState(() => new Date().toTimeString().slice(0, 5));
  const [unitsDispatched, setUnitsDispatched] = useState<string[]>([]);
  const [fireMarshals, setFireMarshals] = useState<string[]>([]);

  // Scene fields
  const [timeOfArrival, setTimeOfArrival] = useState('');
  const [fireControlTime, setFireControlTime] = useState('');
  const [fireExtinguishedTime, setFireExtinguishedTime] = useState('');
  const [returnToOpcen, setReturnToOpcen] = useState('');
  const [resourcesUsed, setResourcesUsed] = useState<string[]>([]);
  const [notes, setNotes] = useState('');


  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSaveIntake = async () => {
    if (!nature || !caller || !barangay) return;
    setSaving(true);
    try {
      const data: Omit<FireRecord, 'id'> = {
        callType,
        nature,
        timeOfCall,
        caller,
        barangay,
        landmark,
        establishment,
        unitsDispatched: [],
        fireMarshals: [],
        resourcesUsed: [],
        status: 'open',
        createdAt: new Date()
      };
      const ref = await addDoc(collection(db, 'fire_records'), data);
      setActiveRecord({ ...data, id: ref.id });
      setStep('dispatch');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDispatch = async () => {
    if (!activeRecord?.id || unitsDispatched.length === 0) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'fire_records', activeRecord.id), {
        timeOfDispatch,
        unitsDispatched,
        fireMarshals
      });
      setActiveRecord(prev => prev ? { ...prev, timeOfDispatch, unitsDispatched, fireMarshals } : null);
      setStep('scene');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScene = async () => {
    if (!activeRecord?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'fire_records', activeRecord.id), {
        timeOfArrival,
        fireControlTime,
        fireExtinguishedTime,
        returnToOpcen,
        resourcesUsed,
        notes,
        status: 'closed'
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        resetForm();
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep('intake');
    setActiveRecord(null);
    setNature('');
    setCaller('');
    setBarangay('');
    setLandmark('');
    setEstablishment('');
    setUnitsDispatched([]);
    setFireMarshals([]);
    setTimeOfArrival('');
    setFireControlTime('');
    setFireExtinguishedTime('');
    setReturnToOpcen('');
    setResourcesUsed([]);
    setNotes('');
    setTimeOfCall(new Date().toTimeString().slice(0, 5));
    setTimeOfDispatch(new Date().toTimeString().slice(0, 5));
  };

  const steps: { id: FormStep; label: string }[] = [
    { id: 'intake', label: 'Call Receipt' },
    { id: 'dispatch', label: 'Dispatch' },
    { id: 'scene', label: 'Scene Report' }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-xl">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Fire Operations</h2>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Pumper Dispatch Module</p>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-navy-900 border border-white/10 rounded-xl text-[10px] font-bold uppercase text-white/40 hover:text-white transition-all"
        >
          {showHistory ? 'New Record' : `History (${records.length})`}
        </button>
      </div>

      {/* History View */}
      {showHistory ? (
        <div className="space-y-2">
          {records.length === 0 && (
            <div className="text-center py-12 text-white/20 text-xs uppercase tracking-widest">No fire records yet</div>
          )}
          {records.map(r => (
            <div key={r.id} className="p-4 bg-navy-800 border border-white/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("w-2 h-2 rounded-full", r.status === 'open' ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500')} />
                <div>
                  <p className="text-xs font-black uppercase text-white">{r.nature} — Brgy. {r.barangay}</p>
                  <p className="text-[9px] text-white/30 font-mono">{r.timeOfCall} · {r.caller} · {r.callType}</p>
                </div>
              </div>
              <span className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full border",
                r.status === 'open' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' : 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
              )}>{r.status}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Step Progress */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  step === s.id ? "bg-orange-500 text-white" :
                  steps.indexOf(steps.find(x => x.id === step)!) > i ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" :
                  "bg-navy-900 text-white/20 border border-white/5"
                )}>
                  {steps.indexOf(steps.find(x => x.id === step)!) > i && <CheckCircle2 className="w-3 h-3" />}
                  {s.label}
                </div>
                {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-white/20" />}
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* STEP 1: INTAKE */}
            {step === 'intake' && (
              <motion.div key="intake" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-navy-800 border border-white/10 rounded-3xl p-6 space-y-6">

                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                  <User className="w-4 h-4" /> Call Receipt — Dispatcher
                </h3>

                {/* Call Type Toggle */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Call Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['emergency', 'non-emergency'] as FireCallType[]).map(t => (
                      <button key={t} onClick={() => { setCallType(t); setNature(''); }}
                        className={cn("py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          callType === t ? t === 'emergency' ? "bg-red-500 border-red-500 text-white" : "bg-blue-500 border-blue-500 text-white"
                          : "bg-navy-900 border-white/5 text-white/30 hover:text-white"
                        )}>
                        {t === 'emergency' ? '🔥 Fire Emergency' : '💧 Non-Emergency'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nature */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Nature of Call</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(callType === 'emergency' ? FIRE_NATURES : NONEMERG_NATURES).map(n => (
                      <button key={n} onClick={() => setNature(n)}
                        className={cn("py-2 px-3 rounded-xl text-[10px] font-bold uppercase transition-all border",
                          nature === n ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-navy-900 border-white/5 text-white/40 hover:text-white"
                        )}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Time of Call */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Time of Call
                    </label>
                    <input type="time" value={timeOfCall} onChange={e => setTimeOfCall(e.target.value)}
                      className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 font-mono" />
                  </div>

                  {/* Caller */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Caller Name</label>
                    <input type="text" value={caller} onChange={e => setCaller(e.target.value)} placeholder="Name of caller"
                      className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500" />
                  </div>
                </div>

                {/* Barangay */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Barangay
                  </label>
                  <select value={barangay} onChange={e => setBarangay(e.target.value)}
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500">
                    <option value="">Select Barangay</option>
                    {MALOLOS_BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                {/* Conditional fields */}
                {callType === 'emergency' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Closest Landmark</label>
                    <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="e.g. Near Malolos Cathedral"
                      className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500" />
                  </div>
                )}

                {callType === 'non-emergency' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Name of Establishment / Facility</label>
                    <input type="text" value={establishment} onChange={e => setEstablishment(e.target.value)} placeholder="e.g. Malolos Public Market"
                      className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500" />
                  </div>
                )}

                <button onClick={handleSaveIntake} disabled={saving || !nature || !caller || !barangay}
                  className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  <Truck className="w-4 h-4" /> {saving ? 'Saving...' : 'Proceed to Dispatch →'}
                </button>
              </motion.div>
            )}

            {/* STEP 2: DISPATCH */}
            {step === 'dispatch' && (
              <motion.div key="dispatch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-navy-800 border border-white/10 rounded-3xl p-6 space-y-6">

                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Dispatch — Dispatcher
                </h3>

                {/* Incident Summary */}
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-[10px] text-orange-300 font-bold uppercase tracking-widest">
                  {activeRecord?.nature} · Brgy. {activeRecord?.barangay} · Called {activeRecord?.timeOfCall}
                </div>

                {/* Time of Dispatch */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Time of Dispatch
                  </label>
                  <input type="time" value={timeOfDispatch} onChange={e => setTimeOfDispatch(e.target.value)}
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 font-mono" />
                </div>

                {/* Units */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Units Dispatched</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FIRE_UNITS.map(u => (
                      <button key={u} onClick={() => toggleItem(unitsDispatched, setUnitsDispatched, u)}
                        className={cn("py-2 px-3 rounded-xl text-[10px] font-bold uppercase transition-all border",
                          unitsDispatched.includes(u) ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-navy-900 border-white/5 text-white/40 hover:text-white"
                        )}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fire Marshals */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Fire Marshal/s</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FIRE_MARSHALS.map(m => (
                      <button key={m} onClick={() => toggleItem(fireMarshals, setFireMarshals, m)}
                        className={cn("py-2 px-3 rounded-xl text-[10px] font-bold uppercase transition-all border",
                          fireMarshals.includes(m) ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-navy-900 border-white/5 text-white/40 hover:text-white"
                        )}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveDispatch} disabled={saving || unitsDispatched.length === 0}
                  className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  <ChevronRight className="w-4 h-4" /> {saving ? 'Saving...' : 'Proceed to Scene Report →'}
                </button>
              </motion.div>
            )}

            {/* STEP 3: SCENE REPORT */}
            {step === 'scene' && (
              <motion.div key="scene" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-navy-800 border border-white/10 rounded-3xl p-6 space-y-6">

                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Scene Report — Fire Marshal
                </h3>

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Time of Arrival', val: timeOfArrival, set: setTimeOfArrival },
                    { label: 'Fire Control', val: fireControlTime, set: setFireControlTime },
                    { label: 'Fire Extinguished', val: fireExtinguishedTime, set: setFireExtinguishedTime },
                    { label: 'Return to Opcen', val: returnToOpcen, set: setReturnToOpcen },
                  ].map(({ label, val, set }) => (
                    <div key={label} className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {label}
                      </label>
                      <input type="time" value={val} onChange={e => set(e.target.value)}
                        className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 font-mono" />
                    </div>
                  ))}
                </div>

                {/* Resources */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> Resources Used
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {RESOURCES.map(r => (
                      <button key={r} onClick={() => toggleItem(resourcesUsed, setResourcesUsed, r)}
                        className={cn("py-2 px-2 rounded-xl text-[9px] font-bold uppercase transition-all border text-center",
                          resourcesUsed.includes(r) ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-navy-900 border-white/5 text-white/40 hover:text-white"
                        )}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Additional Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="Observations, fire cause, additional info..."
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 resize-none" />
                </div>

                <button onClick={handleSaveScene} disabled={saving}
                  className={cn("w-full py-4 font-black rounded-2xl text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    saved ? "bg-emerald-500 text-white" : "bg-orange-500 text-white hover:scale-[1.02] active:scale-[0.98]",
                    saving && "opacity-40"
                  )}>
                  {saved ? <><CheckCircle2 className="w-4 h-4" /> Record Closed!</> :
                    <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Finalize Fire Record'}</>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
