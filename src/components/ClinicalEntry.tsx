import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  User, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  ChevronRight,
  Save,
  AlertTriangle
} from 'lucide-react';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Incident, ClinicalData, VitalsReading, BodyZone, AgeCategory } from '../types';
import { VITALS_MATRIX, MEDICAL_CONDITIONS, INJURY_TYPES } from '../constants';
import BodyMap from './BodyMap';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ClinicalEntryProps {
  initialRefId?: string;
}

const ClinicalEntry: React.FC<ClinicalEntryProps> = ({ initialRefId }) => {
  const [refId, setRefId] = useState(initialRefId || '');
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [patientName, setPatientName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | undefined>(undefined);
  const [ageCategory, setAgeCategory] = useState<AgeCategory>('Adult');
  const [patientStatus, setPatientStatus] = useState<'Stable' | 'Critical' | 'DOA' | 'Conscious' | 'Unconscious'>('Stable');
  const [caseCategory, setCaseCategory] = useState<'Medical' | 'Trauma'>('Medical');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [injury, setInjury] = useState('');
  
  const [currentVitals, setCurrentVitals] = useState<VitalsReading>({
    timestamp: new Date().toISOString(),
    hr: 0,
    rr: 0,
    bp_sys: 0,
    bp_dia: 0,
    spo2: 0,
    temp: 0
  });
  
  const [vitalsLog, setVitalsLog] = useState<VitalsReading[]>([]);
  const [bodyMapping, setBodyMapping] = useState<BodyZone[]>([]);
  const [interventions, setInterventions] = useState<string[]>([]);
  const [disposition, setDisposition] = useState('');
  const [destination, setDestination] = useState('');
  
  const [activeZone, setActiveZone] = useState<{ id: string, label: string, side: 'Front' | 'Back' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [availableInterventions, setAvailableInterventions] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'system_interventions'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data().name as string);
        setAvailableInterventions(docs.length > 0 ? docs : ['O2 Therapy', 'IV Access', 'CPR', 'Defibrillation', 'Wound Care', 'Splinting', 'Spinal Immobilization', 'Medication Administered']);
      },
      (error) => console.error('system_interventions listener error:', error.code, error.message)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
      
      if (calculatedAge < 1) setAgeCategory('Infant');
      else if (calculatedAge < 3) setAgeCategory('Toddler');
      else if (calculatedAge < 6) setAgeCategory('Preschool');
      else if (calculatedAge < 12) setAgeCategory('School Age');
      else if (calculatedAge < 18) setAgeCategory('Adolescent');
      else setAgeCategory('Adult');
    }
  }, [dob]);

  const loadDemoData = () => {
    setRefId('DEMO-TACTICAL-01');
    setIncident({
      id: 'DEMO-TACTICAL-01',
      nature: 'Motor Vehicle Accident',
      barangay: 'San Juan',
      toc: '01:15',
      priority: 'Critical',
      status: 'Active',
      units: ['AMBU-01'],
      timestamp: new Date()
    } as any);
    
    setPatientName('John Doe (DEMO)');
    setAgeCategory('Adult');
    setPatientStatus('Critical');
    setVitalsLog([
      { timestamp: new Date().toISOString(), hr: 110, rr: 24, bp_sys: 90, bp_dia: 60, spo2: 92, temp: 36.5 },
      { timestamp: new Date(Date.now() - 300000).toISOString(), hr: 120, rr: 28, bp_sys: 85, bp_dia: 55, spo2: 89, temp: 36.2 }
    ]);
    setBodyMapping([
      { id: 'H', label: 'Head', side: 'Front', findings: ['Laceration', 'Contusion'] },
      { id: 'EXT_LL', label: 'Lower Left Leg', side: 'Front', findings: ['Fracture'] }
    ]);
    setInterventions(['O2 Therapy', 'IV Access', 'Spinal Immobilization']);
    setDisposition('Transported');
    setDestination('Bulacan Medical Center');
  };
  
  useEffect(() => {
    if (initialRefId) {
      fetchIncident();
    }
  }, [initialRefId]);

  const fetchIncident = async () => {
    if (!refId) return;
    setLoading(true);
    setError('');
    try {
      // In Firestore, we use the Ref ID as the document ID or search for it
      const docRef = doc(db, 'incidents', refId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Incident;
        setIncident(data);
        if (data.clinicalData) {
          setPatientName(data.clinicalData.patientName);
          setDob(data.clinicalData.dob || '');
          setAge(data.clinicalData.age);
          setAgeCategory(data.clinicalData.ageCategory);
          setPatientStatus(data.clinicalData.patientStatus);
          setCaseCategory(data.clinicalData.caseCategory || (data.triage === 'TE' ? 'Trauma' : 'Medical'));
          setAddress(data.clinicalData.address || '');
          setContactNumber(data.clinicalData.contactNumber || '');
          setMedicalConditions(data.clinicalData.medicalConditions || []);
          setChiefComplaint(data.clinicalData.chiefComplaint || '');
          setInjury(data.clinicalData.injury || '');
          setVitalsLog(data.clinicalData.vitalsLog);
          setBodyMapping(data.clinicalData.bodyMapping);
          setInterventions(data.clinicalData.interventions);
          setDisposition(data.clinicalData.disposition);
          setDestination(data.clinicalData.destination);
        }
      } else {
        setError('Reference ID not found in Master Node.');
      }
    } catch (err) {
      setError('Failed to fetch incident data.');
    } finally {
      setLoading(false);
    }
  };

  const validateVital = (type: 'hr' | 'rr' | 'bp_sys', value: number) => {
    if (patientStatus === 'DOA') return false;
    const thresholds = VITALS_MATRIX[ageCategory];
    if (!thresholds) return false;
    const range = (thresholds as any)[type];
    return value < range[0] || value > range[1];
  };

  const addVitalsToLog = () => {
    const newReading = { ...currentVitals, timestamp: new Date().toISOString() };
    setVitalsLog([newReading, ...vitalsLog]);
    // Reset inputs but keep some context
    setCurrentVitals({
      ...currentVitals,
      timestamp: new Date().toISOString()
    });
  };

  const handleZoneClick = (id: string, label: string, side: 'Front' | 'Back') => {
    setActiveZone({ id, label, side });
  };

  const addFindingToZone = (finding: string) => {
    if (!activeZone) return;
    
    const existingZone = bodyMapping.find(z => z.id === activeZone.id && z.side === activeZone.side);
    if (existingZone) {
      if (existingZone.findings.includes(finding)) {
        setBodyMapping(bodyMapping.map(z => 
          (z.id === activeZone.id && z.side === activeZone.side) 
            ? { ...z, findings: z.findings.filter(f => f !== finding) }
            : z
        ).filter(z => z.findings.length > 0));
      } else {
        setBodyMapping(bodyMapping.map(z => 
          (z.id === activeZone.id && z.side === activeZone.side) 
            ? { ...z, findings: [...z.findings, finding] }
            : z
        ));
      }
    } else {
      setBodyMapping([...bodyMapping, { 
        id: activeZone.id, 
        label: activeZone.label, 
        side: activeZone.side, 
        findings: [finding] 
      }]);
    }
  };

  const generateInjurySummary = () => {
    if (patientStatus === 'DOA') return "Patient declared Dead on Arrival (DOA).";
    
    const parts = bodyMapping.map(z => `${z.label} (${z.side}): ${z.findings.join(', ')}`);
    return parts.length > 0 ? parts.join('; ') : "No significant external injuries noted.";
  };

  const handleSave = async () => {
    if (!incident) return;
    setSaving(true);
    
    const clinicalData: ClinicalData = {
      referenceId: refId,
      patientName,
      dob,
      age,
      ageCategory,
      patientStatus,
      caseCategory,
      address,
      contactNumber,
      medicalConditions,
      chiefComplaint,
      injury,
      vitalsLog,
      bodyMapping,
      interventions,
      disposition,
      destination,
      injurySummary: generateInjurySummary()
    };

    try {
      const docRef = doc(db, 'incidents', refId);
      await updateDoc(docRef, {
        clinicalData,
        status: patientStatus === 'DOA' ? 'DOA' : 'Transporting'
      });
      alert('Clinical Data Synced Successfully.');
    } catch (err) {
      alert('Failed to sync clinical data.');
    } finally {
      setSaving(false);
    }
  };

  // const interventionOptions = ['O2 Therapy', 'IV Access', 'CPR', 'Defibrillation', 'Wound Care', 'Splinting', 'Spinal Immobilization', 'Medication Administered'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Search Header */}
      <div className="bg-navy-800 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Reference ID / Case Number</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="text"
                value={refId}
                onChange={(e) => setRefId(e.target.value.toUpperCase())}
                placeholder="e.g. TE260308-1234-567"
                className="w-full bg-navy-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 transition-all font-mono"
              />
            </div>
          </div>
            <button 
              onClick={fetchIncident}
              disabled={loading || !refId}
              className="px-8 py-4 bg-navy-800 border border-white/10 text-white font-black rounded-2xl hover:bg-white/5 transition-all disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-widest"
            >
              {loading ? 'Fetching...' : 'Pull Dispatch Data'}
            </button>
            <button 
              onClick={loadDemoData}
              className="px-8 py-4 bg-gold-500 text-navy-900 font-black rounded-2xl hover:scale-105 transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-gold-500/20"
            >
              Tactical Demo Mode
            </button>
          </div>

        {incident && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-navy-900/50 rounded-2xl border border-gold-500/20 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div>
              <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Nature</div>
              <div className="text-sm font-bold text-gold-500">{incident.nature}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Location</div>
              <div className="text-sm font-bold text-white truncate">{incident.barangay}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">TOC</div>
              <div className="text-sm font-bold text-white">{incident.toc || 'N/A'}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Priority</div>
              <div className={`text-xs font-black uppercase ${incident.priority === 'Critical' ? 'text-red-500' : 'text-gold-500'}`}>
                {incident.priority}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {incident && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Patient Info & Vitals */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-navy-800 border border-white/10 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/70 mb-6 flex items-center gap-2">
                <User className="w-4 h-4 text-gold-500" /> Patient Identification
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Case Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Medical', 'Trauma'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCaseCategory(cat as any)}
                          className={cn(
                            "py-2 rounded-xl text-[10px] font-black uppercase transition-all border",
                            caseCategory === cat 
                              ? "bg-gold-500 border-gold-500 text-navy-900"
                              : "bg-navy-900 border-white/5 text-white/40 hover:text-white"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Patient Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Conscious', 'Unconscious'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setPatientStatus(status as any)}
                          className={cn(
                            "py-2 rounded-xl text-[10px] font-black uppercase transition-all border",
                            patientStatus === status 
                              ? "bg-gold-500 border-gold-500 text-navy-900"
                              : "bg-navy-900 border-white/5 text-white/40 hover:text-white"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Full Name</label>
                  <input 
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Date of Birth</label>
                    <input 
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Age / Category</label>
                    <div className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white/60">
                      {age !== undefined ? `${age} yrs (${ageCategory})` : '---'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Address</label>
                  <input 
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Contact Number</label>
                  <input 
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Existing Medical Condition</label>
                  <select 
                    multiple
                    value={medicalConditions}
                    onChange={(e) => {
                      const select = e.target as HTMLSelectElement;
                      const options = Array.from(select.selectedOptions, option => option.value);
                      setMedicalConditions(options);
                    }}
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500 h-24"
                  >
                    {MEDICAL_CONDITIONS.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Chief Complaint</label>
                  <textarea 
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500 h-20 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Injury Type</label>
                  <select 
                    value={injury}
                    onChange={(e) => setInjury(e.target.value)}
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="">Select Injury</option>
                    {INJURY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={cn(
              "bg-navy-800 border border-white/10 rounded-3xl p-6 shadow-xl transition-opacity",
              patientStatus === 'DOA' && "opacity-50 pointer-events-none grayscale"
            )}>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/70 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Vitals Grid</span>
                <span className="text-[9px] text-white/30 font-mono">Real-time Entry</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'HR (BPM)', key: 'hr', type: 'hr' },
                  { label: 'RR (CPM)', key: 'rr', type: 'rr' },
                  { label: 'SYS BP', key: 'bp_sys', type: 'bp_sys' },
                  { label: 'DIA BP', key: 'bp_dia' },
                  { label: 'SpO2 (%)', key: 'spo2' },
                  { label: 'TEMP (°C)', key: 'temp' }
                ].map((field) => {
                  const isAbnormal = field.type && validateVital(field.type as any, (currentVitals as any)[field.key]);
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">{field.label}</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={(currentVitals as any)[field.key] || ''}
                          onChange={(e) => setCurrentVitals({ ...currentVitals, [field.key]: parseFloat(e.target.value) || 0 })}
                          className={cn(
                            "w-full bg-navy-900 border rounded-xl p-3 text-sm text-white focus:outline-none transition-all",
                            isAbnormal ? "border-red-500/50 animate-pulse bg-red-500/5" : "border-white/5 focus:border-blue-500"
                          )}
                        />
                        {isAbnormal && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={addVitalsToLog}
                className="w-full mt-6 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
              >
                Log Current Vitals
              </button>

              {vitalsLog.length > 0 && (
                <div className="mt-6 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {vitalsLog.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-navy-900/50 rounded-lg border border-white/5 text-[10px]">
                      <span className="text-white/40 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-bold text-blue-400">{log.hr}/{log.rr} | {log.bp_sys}/{log.bp_dia} | {log.spo2}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center Column: Injury Map */}
          <div className="lg:col-span-5">
            <div className="bg-navy-800 border border-white/10 rounded-3xl p-6 shadow-xl h-full flex flex-col">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/70 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /> Injury Mapping</span>
                <span className="text-[9px] text-white/30 font-mono">Tactical SVG Node</span>
              </h3>

              <div className="flex-1 flex items-center justify-center relative">
                <BodyMap 
                  selectedZones={bodyMapping} 
                  onZoneClick={handleZoneClick} 
                  isDOA={patientStatus === 'DOA'}
                />

                <AnimatePresence>
                  {activeZone && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 20 }}
                      className="absolute right-0 top-0 w-48 bg-navy-900 border border-gold-500/30 rounded-2xl p-4 shadow-2xl z-20"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black uppercase text-gold-500">{activeZone.label}</h4>
                        <button onClick={() => setActiveZone(null)}><Trash2 className="w-3 h-3 text-white/20 hover:text-red-500" /></button>
                      </div>
                      <div className="space-y-2">
                        {['Fracture', 'Laceration', 'Burn', 'Abrasion', 'Contusion', 'Puncture', 'Gunshot', 'Amputation'].map(finding => {
                          const isSelected = bodyMapping.find(z => z.id === activeZone.id && z.side === activeZone.side)?.findings.includes(finding);
                          return (
                            <button
                              key={finding}
                              onClick={() => addFindingToZone(finding)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border",
                                isSelected ? "bg-red-500 border-red-500 text-white" : "bg-navy-800 border-white/5 text-white/40 hover:text-white"
                              )}
                            >
                              {finding}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6 p-4 bg-navy-900/50 rounded-2xl border border-white/5">
                <div className="text-[9px] text-white/30 uppercase tracking-widest mb-2">Injury Summary</div>
                <p className="text-[11px] text-white/70 leading-relaxed italic">
                  {generateInjurySummary()}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interventions & Disposition */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-navy-800 border border-white/10 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/70 mb-6 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-gold-500" /> Interventions
              </h3>
              <div className="space-y-2">
                {availableInterventions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setInterventions(prev => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase transition-all border flex items-center justify-between",
                      interventions.includes(opt) ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-navy-900 border-white/5 text-white/40"
                    )}
                  >
                    {opt}
                    {interventions.includes(opt) && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-navy-800 border border-white/10 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/70 mb-6 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gold-500" /> Disposition
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Transport Status</label>
                  <select 
                    value={disposition}
                    onChange={(e) => setDisposition(e.target.value)}
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Transported">Transported</option>
                    <option value="Refused Transport">Refused Transport</option>
                    <option value="Treated & Released">Treated & Released</option>
                    <option value="DOA - Police Custody">DOA - Police Custody</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Destination Hospital</label>
                  <input 
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Bulacan Medical Center"
                    className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving || !incident}
              className="w-full py-5 bg-gold-500 text-navy-900 font-black rounded-2xl shadow-2xl shadow-gold-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Syncing...' : 'Finalize Clinical Report'}
            </button>
          </div>
        </div>
      )}

      {!incident && (
        <div className="flex flex-col items-center justify-center py-20 opacity-20">
          <ShieldAlert className="w-20 h-20 mb-4" />
          <p className="text-sm font-black uppercase tracking-[0.3em]">Awaiting Tactical Reference ID</p>
        </div>
      )}
    </div>
  );
};

export default ClinicalEntry;
