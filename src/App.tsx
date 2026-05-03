import ReportGenerator from './components/ReportGenerator';
import AccomplishmentReport from './components/AccomplishmentReport';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Truck,
  Clock,
  Phone,
  AlertTriangle,
  Plus,
  Search,
  ChevronRight,
  Map as MapIcon,
  User,
  Stethoscope,
  Flame,
  ArrowRight,
  X,
  CheckCircle2,
  Info,
  ShieldAlert,
  LogOut,
  Lock,
  Mail,
  Download,
  Settings,
  Users,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, where, Timestamp, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
// inside useEffect or on first render:
import {
  MALOLOS_BARANGAYS,
  VITALS_MATRIX,
  TRIAGE_CATEGORIES,
  FIRE_ALARM_LEVELS,
  PROTOCOLS
} from './constants';
import { Incident, IncidentStatus, UserRole, Ambulance, Operator } from './types';
import ClinicalEntry from './components/ClinicalEntry';
import ReportGenerator from './components/ReportGenerator';
import FireOperations from './components/FireOperations';
import CallCounter from './components/CallCounter';


// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- SYSTEM ASSETS & CONFIG ---
const SEAL_URL = "https://lh3.googleusercontent.com/d/1iM50PbjJYwSiCSuCLE9RdBnvDh4JF9Yg";
const LOGO_URL = "https://lh3.googleusercontent.com/d/19f1fiV9TlL4aD_NK_7VP1_EON-zXOLQR";
const BG_IMAGE_URL = "https://lh3.googleusercontent.com/d/10ALcSZUZmpSSV5Ph0MPCNg-zzCWUgUHn";

// --- SUB-COMPONENT: LANDING PAGE (ENTRY PORTAL) ---
const LandingPage = ({ onEnter, isLoading }: { onEnter: () => void, isLoading: boolean }) => {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.88)), url('${BG_IMAGE_URL}')` }}
    >
      {/* Locked Header Banner */}
      <div className="absolute top-0 left-0 w-full p-6 md:p-8 flex items-center gap-5 z-10 text-white">
        <div className="flex-shrink-0">
          <div className="w-[60px] h-[60px] flex items-center justify-center">
            <img src={SEAL_URL} alt="Seal" className="max-w-full max-h-full object-contain drop-shadow-xl" referrerPolicy="no-referrer" />
          </div>
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-3 mb-0.5 opacity-80">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">Republika ng Pilipinas</span>
            <div className="h-[1px] w-full max-w-[300px] bg-white opacity-20"></div>
          </div>
          <h2 className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.3em] leading-none">Pamahalaang Lungsod ng Malolos</h2>
        </div>
      </div>

      <div className="w-full max-w-4xl text-center flex flex-col items-center animate-in fade-in duration-700 px-6 mt-[80px] z-10">
        {/* IDROS title above 210px logo */}
        <div className="mb-2">
          <h1 className="text-2xl font-black text-gold-500 uppercase mb-1 drop-shadow-lg tracking-tighter italic">
            IDROS <span className="text-slate-400 font-medium italic text-[10px] lowercase not-italic">v2.5</span>
          </h1>
        </div>

        <div className="mb-6 transform hover:scale-105 transition-all duration-500">
          <img src={LOGO_URL} alt="IDROS Logo" className="w-[210px] h-[210px] object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
        </div>

        <div className="space-y-2 max-w-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 leading-relaxed">
            Integrated Disaster Response & Operations System
          </p>
          <p className="text-red-600 text-[14px] font-black whitespace-nowrap uppercase tracking-[0.2em]">
            CITY DISASTER RISK REDUCTION AND MANAGEMENT OFFICE
          </p>
        </div>

        <div className="h-px w-20 bg-gold-500/40 my-10 mx-auto"></div>

        <button
          onClick={onEnter}
          disabled={isLoading}
          className="group relative px-16 py-6 font-black text-white bg-navy-900/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden transition-all hover:bg-navy-800 active:scale-95 shadow-3xl shadow-black/60 border border-white/10 text-[12px] uppercase tracking-[0.3em] flex items-center gap-4 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Syncing Nodes...</span>
            </div>
          ) : (
            <>
              Access Portal <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <div className="pt-16 text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-60">
          AUTHORIZED PERSONNEL ONLY | SECURED ACCESS NODE
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-navy-900 to-transparent opacity-50 pointer-events-none" />
    </div>
  );
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={cn(
      "fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 border",
      type === 'success' ? "bg-emerald-500 border-emerald-400 text-white" : "bg-red-500 border-red-400 text-white"
    )}
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
    <span className="text-sm font-bold">{message}</span>
    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

const Card = ({ children, className, title, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
  <div className={cn("bg-navy-800 border border-white/10 rounded-2xl p-6 shadow-xl", className)}>
    {(title || Icon) && (
      <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
        {Icon && <Icon className="w-5 h-5 text-gold-500" />}
        {title && <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">{title}</h3>}
      </div>
    )}
    {children}
  </div>
);

const KPI = ({ label, value, color, icon: Icon }: { label: string, value: string | number, color: string, icon: any }) => (
  <Card className="flex flex-col items-center justify-center text-center py-4">
    <div className={cn("p-3 rounded-full mb-2", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="text-2xl font-black text-white">{value}</div>
    <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</div>
  </Card>
);

const MalolosMap = ({ incidents, onPinClick }: { incidents: Incident[], onPinClick: (incident: Incident) => void }) => {
  // Simplified grid representation of Malolos
  return (
    <div className="relative w-full aspect-square bg-navy-900/50 rounded-xl border border-white/5 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-20 pointer-events-none">
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-white/10" />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <MapIcon className="w-48 h-48 text-white" />
      </div>
      {/* Incident Pins */}
      {incidents.filter(i => i.status !== 'Cleared').map((incident, idx) => {
        // Random-ish position based on ID for demo
        const hash = incident.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const x = (hash % 80) + 10;
        const y = ((hash / 2) % 80) + 10;
        return (
          <motion.div
            key={incident.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            onClick={() => onPinClick(incident)}
            className="absolute cursor-pointer group z-10"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className={cn(
              "w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center",
              incident.priority === 'Critical' ? "bg-red-500 animate-pulse" :
                incident.priority === 'High' ? "bg-orange-500" : "bg-gold-500"
            )}>
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-navy-800 border border-white/20 p-2 rounded text-[10px] whitespace-nowrap z-50 shadow-2xl">
              <div className="font-black text-gold-500">{incident.id}</div>
              <div className="text-white/70">{incident.nature}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const Icon = ({ path, className = "w-5 h-5" }: { path: string, className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d={path}></path>
  </svg>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-navy-800 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-navy-900/50">
            <h3 className="text-sm font-black uppercase tracking-widest text-gold-500">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const AuthScreen = ({ onAuthSuccess }: { onAuthSuccess: (role: UserRole) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('EMT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles: UserRole[] = ['Tech Head', 'LDRRMO', 'Division Head', 'Admin', 'EMT', 'Fire', 'OpCen'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Fetch role from Firestore
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) throw new Error("User record not found. Contact admin.");

        const fetchedRole = userDoc.data().role as UserRole;
        onAuthSuccess(fetchedRole);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        onAuthSuccess(role); // new users still use dropdown for now
      }
    } catch (err: any) {
      console.error(err);
      if (isLogin) {
        setError("Email or password is incorrect");
      } else {
        if (err.code === 'auth/email-already-in-use') {
          setError("User already exists. Please sign in");
        } else {
          setError(err.message || "An error occurred during authentication");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.95)), url('${BG_IMAGE_URL}')` }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <img src={LOGO_URL} alt="IDROS" className="w-32 h-32 object-contain mb-4 drop-shadow-2xl" referrerPolicy="no-referrer" />
          <h1 className="text-3xl font-black text-white tracking-tighter italic">IDROS <span className="text-gold-500">COMMAND</span></h1>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] mt-2">Tactical Operations Portal</p>
        </div>

        <Card className="bg-navy-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2.5rem] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Access Node (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="email"
                  required
                  className="w-full bg-navy-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 transition-all"
                  placeholder="name@malolos.gov.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Security Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="password"
                  required
                  className="w-full bg-navy-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Operational Role</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <select
                  className="w-full bg-navy-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 transition-all appearance-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  {roles.map(r => <option key={r} value={r} className="bg-navy-900 text-white">{r}</option>)}
                </select>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold"
              >
                <ShieldAlert className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 text-navy-900 font-black py-5 rounded-2xl shadow-xl shadow-gold-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-[12px] uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Initialize Command' : 'Register Tactical ID')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-[10px] font-black text-white/20 hover:text-gold-500 transition-colors uppercase tracking-widest"
            >
              {isLogin ? "Request New Tactical ID" : "Return to Access Node"}
            </button>
          </div>
        </Card>

        <div className="mt-12 text-center opacity-30">
          <p className="text-[8px] font-black text-white uppercase tracking-[0.5em]">Malolos Tactical Ops Center | IDROS v2.5</p>
        </div>
      </motion.div>
    </div>
  );
}
// --- Main App ---

export default function App() {
  const [view, setView] = useState<'home' | 'auth' | 'portal'>('home');
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('Admin');
  const [authLoading, setAuthLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dispatch' | 'emt' | 'fire' | 'reports' | 'accomplishment'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [systemInterventions, setSystemInterventions] = useState<{ id: string, name: string }[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [activeFireRecords, setActiveFireRecords] = useState<any[]>([]);
  const [traumaRecords, setTraumaRecords] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [fireRecords, setFireRecords] = useState<any[]>([]);
  const [traumaRecords, setTraumaRecords] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [otherInquiries, setOtherInquiries] = useState<any[]>([]);


  // Form States
  const [formData, setFormData] = useState<Partial<Incident>>({
    priority: 'Medium',
    triage: 'TE',
    nature: '',
    barangay: '',
    locationDetails: '',
    locationLandmark: '',
    callerName: '',
    callerContact: '',
    toc: '',
    numberInvolved: 'Single',
    numberPatients: 1,
    operatorName: '',
    responders: ['', '', ''],
    unitNumber: '',
    tod: '',
    toa: '',
    odometerStart: 0,
    odometerEnd: 0,
    units: [],
    status: 'Active'
  });

  // OTP Protocol State
  const [isOtpActive, setIsOtpActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [language, setLanguage] = useState<'English' | 'Tagalog'>('English');
  const [metronomePulse, setMetronomePulse] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        setView('portal');
      } else {
        setView('home');
      }
    });

    return () => {
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'incidents'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Incident));
      setIncidents(docs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'ambulances'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Ambulance));
      setAmbulances(docs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'fire_records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFireRecords(docs);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'trauma_records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTraumaRecords(docs);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'medical_records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMedicalRecords(docs);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'other_inquiries'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOtherInquiries(docs);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'operators'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Operator));
      setOperators(docs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'system_interventions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as { id: string, name: string }));
      setSystemInterventions(docs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'fire_records'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Fire records:', snapshot.docs.length);
      setActiveFireRecords(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'trauma_records'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTraumaRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'medical_records'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setMedicalRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // CPR METRONOME LOGIC
  useEffect(() => {
    let interval: any;
    if (isMetronomeActive && isOtpActive) {
      interval = setInterval(() => {
        setMetronomePulse(true);
        setTimeout(() => setMetronomePulse(false), 150);
      }, 545);
    }
    return () => clearInterval(interval);
  }, [isMetronomeActive, isOtpActive]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('home');
      setToast({ message: "Signed out successfully", type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to sign out", type: 'error' });
    }
  };

  const generateRefId = (caseType: string, date?: Date) => {
    if (!caseType) return "SELECT CATEGORY";

    const now = date || new Date();

    // YYMMDD
    const YY = now.getFullYear().toString().slice(-2);
    const MM = (now.getMonth() + 1).toString().padStart(2, '0');
    const DD = now.getDate().toString().padStart(2, '0');
    const dateStr = `${YY}${MM}${DD}`;

    // HHMM
    const HH = now.getHours().toString().padStart(2, '0');
    const MIN = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${HH}${MIN}`;

    // 3-Digit Random
    const random = Math.floor(100 + Math.random() * 899);

    return `${caseType}${dateStr}-${timeStr}-${random}`;
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nature || !formData.barangay) {
      setToast({ message: "Please fill in all required fields", type: 'error' });
      return;
    }

    const logTime = new Date();
    const refId = generateRefId(formData.triage || 'TE', logTime);
    const newIncident: Incident = {
      ...formData as any,
      id: refId,
      timestamp: logTime,
      status: 'Active' as IncidentStatus,
    };

    try {
      await addDoc(collection(db, 'incidents'), newIncident);
      setFormData({
        priority: 'Medium',
        triage: 'TE',
        nature: '',
        barangay: '',
        locationDetails: '',
        locationLandmark: '',
        callerName: '',
        callerContact: '',
        toc: '',
        numberInvolved: 'Single',
        numberPatients: 1,
        operatorName: '',
        responders: ['', '', ''],
        unitNumber: '',
        tod: '',
        toa: '',
        odometerStart: 0,
        odometerEnd: 0,
        units: []
      });
      setToast({ message: `Incident ${refId} Dispatched Successfully`, type: 'success' });
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to dispatch incident", type: 'error' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Initializing Tactical Link...</p>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    return <LandingPage onEnter={() => setView('auth')} isLoading={authLoading} />;
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={(role) => {
      setUserRole(role);
      setView('portal');
    }} />;
  }

  const activeIncidentsCount = incidents.filter(i => i.status !== 'Cleared').length;
  const criticalCount = incidents.filter(i => i.priority === 'Critical' && i.status !== 'Cleared').length;

  return (
    <div className="flex flex-col h-screen bg-navy-900 text-white font-sans overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-navy-800 border-r border-white/5 flex flex-col shadow-2xl z-20">
          <div className="p-8 mb-4 flex flex-col items-center gap-4 text-center">
            <img src={LOGO_URL} className="w-32 h-32 object-contain cursor-pointer drop-shadow-2xl" alt="IDROS" onClick={() => setView('home')} referrerPolicy="no-referrer" />
            <h1 className="text-xl font-black uppercase tracking-tighter italic">IDROS <span className="text-gold-500">COMMAND</span></h1>
            <div className="px-3 py-1 bg-gold-500/10 border border-gold-500/20 rounded-full">
              <span className="text-[8px] font-black uppercase text-gold-500 tracking-widest">{userRole}</span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all",
                activeTab === 'dashboard' ? "bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Activity className="w-4 h-4" />
              <span className="text-sm">Command Dashboard</span>
            </button>

            {(userRole === 'Tech Head' || userRole === 'LDRRMO' || userRole === 'OpCen' || userRole === 'Division Head' || userRole === 'Admin') && (
              <button
                onClick={() => setActiveTab('dispatch')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all",
                  activeTab === 'dispatch' ? "bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <Truck className="w-4 h-4" />
                <span className="text-sm">Dispatch Intake</span>
              </button>
            )}

            {(userRole === 'Tech Head' || userRole === 'LDRRMO' || userRole === 'EMT' || userRole === 'Division Head' || userRole === 'Admin') && (
              <button
                onClick={() => setActiveTab('emt')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all",
                  activeTab === 'emt' ? "bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <Stethoscope className="w-4 h-4" />
                <span className="text-sm">Clinical Entry</span>
              </button>
            )}

            {(userRole === 'Tech Head' || userRole === 'LDRRMO' || userRole === 'Fire' || userRole === 'Division Head' || userRole === 'Admin') && (
              <button
                onClick={() => setActiveTab('fire')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all",
                  activeTab === 'fire' ? "bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <Flame className="w-4 h-4" />
                <span className="text-sm">Fire Operations</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('calls')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                activeTab === 'calls' ? "bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">Call Counter</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all",
                "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'reports'
                ? 'bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20'
                : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('accomplishment')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'accomplishment'
                ? 'bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20'
                : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">Accomplishment</span>
            </button>
          </nav>

          <div className="p-6 m-4 bg-navy-900/50 rounded-3xl text-center">
            <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-3">Live Tactical Link Active</p>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <LogOut className="w-3 h-3" /> Terminate Link
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-navy-900 border-r border-white/5">
          <header className="px-10 py-6 border-b border-white/5 bg-navy-800/50 backdrop-blur-md flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase italic">
                {activeTab === 'dashboard' ? 'Tactical Command Dashboard' :
                  activeTab === 'dispatch' ? 'Emergency Dispatch Node' :
                    activeTab === 'emt' ? 'Clinical Data Entry' :
                      activeTab === 'fire' ? 'Fire Suppression Node' :
                        activeTab === 'reports' ? 'Report Generator' :
                          'Daily Accomplishment Report'}
              </h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] mt-1">Malolos City DRRMO | Authorized Node</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-gold-500 tracking-widest">{new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-lg font-black text-white tracking-tighter">{time}</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-navy-900 font-black text-xs">
                  {user?.email?.[0].toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                >
                  {/* Top KPIs */}
                  <div className="lg:col-span-12 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-8 bg-gold-500 rounded-full" />
                      <h3 className="text-lg font-black uppercase tracking-widest italic">Live Operations Feed</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {(userRole === 'Admin' || userRole === 'Tech Head' || userRole === 'LDRRMO' || userRole === 'OpCen') && (
                        <button
                          onClick={() => setActiveTab('dispatch')}
                          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-navy-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-gold-500/20"
                        >
                          <Plus className="w-3 h-3" /> New Dispatch
                        </button>
                      )}
                      {(userRole === 'Admin' || userRole === 'EMT' || userRole === 'Fire' || userRole === 'Tech Head' || userRole === 'LDRRMO') && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-navy-800 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-500 hover:text-navy-900 transition-all shadow-lg">
                          <Download className="w-3 h-3" /> Generate Tactical Report
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KPI label="Active Incidents" value={activeIncidentsCount} color="bg-red-500" icon={Activity} />
                    <KPI label="Units Dispatched" value={incidents.filter(i => i.status === 'Dispatched').length} color="bg-blue-500" icon={Truck} />
                    <KPI label="Avg Response" value="4.2m" color="bg-gold-500" icon={Clock} />
                    <KPI label="High Priority" value={criticalCount} color="bg-orange-500" icon={AlertTriangle} />
                  </div>
                  {activeFireRecords.length > 0 && (
                    <div className="lg:col-span-12 space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                        <Flame className="w-4 h-4" /> Active Fire Incidents ({activeFireRecords.length})
                      </h3>
                      {activeFireRecords.map(record => (
                        <div key={record.id} className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black uppercase text-white">{record.nature}</p>
                            <p className="text-[10px] text-white/40 uppercase">Brgy. {record.barangay} · {record.timeOfCall}</p>
                          </div>
                          <div className="text-[9px] font-black uppercase text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full">
                            {record.unitsDispatched?.length > 0 ? record.unitsDispatched.join(', ') : 'Pending Dispatch'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Center Map */}
                  <div className="lg:col-span-8">
                    <Card title="Tactical Geographic Map" icon={MapIcon} className="h-full">
                      <MalolosMap incidents={incidents} onPinClick={setViewingIncident} />
                    </Card>
                  </div>

                  {/* Right Panel: SLA & Resources */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <Card title="SLA Performance" icon={Activity}>
                      <div className="flex items-center justify-center py-8">
                        <div className="relative w-32 h-32">
                          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ffffff10" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f4b400" strokeWidth="3" strokeDasharray="85, 100" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black">85%</span>
                            <span className="text-[8px] uppercase text-white/40">Target</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                    <Card title="Resource Status" icon={Truck}>
                      <div className="space-y-3">
                        {['A-01', 'A-02', 'F-01', 'QRV-1'].map(unit => (
                          <div key={unit} className="flex items-center justify-between p-3 bg-navy-900/50 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-xs font-bold">{unit}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-white/30">Available</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Bottom Queue */}
                  <div className="lg:col-span-12">
                    <Card title="Live Incident Queue" icon={Activity}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40 font-black">
                              <th className="py-4 px-2">Ref ID</th>
                              <th className="py-4 px-2">Priority</th>
                              <th className="py-4 px-2">Nature</th>
                              <th className="py-4 px-2">Barangay</th>
                              <th className="py-4 px-2">Status</th>
                              <th className="py-4 px-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {incidents.map((incident) => (
                              <tr
                                key={incident.id}
                                className={cn(
                                  "border-b border-white/5 hover:bg-white/5 transition-colors",
                                  incident.priority === 'Critical' && incident.status !== 'Cleared' && "animate-pulse-red"
                                )}
                              >
                                <td className="py-4 px-2 font-mono text-xs">
                                  {incident.status === 'DOA' && <span className="bg-red-500 text-white px-1 rounded mr-1 text-[8px] font-black">00</span>}
                                  {incident.id}
                                </td>
                                <td className="py-4 px-2">
                                  <span className={cn(
                                    "px-2 py-1 rounded text-[10px] font-bold uppercase",
                                    incident.priority === 'Critical' ? "bg-red-500" :
                                      incident.priority === 'High' ? "bg-orange-500" : "bg-gold-500 text-navy-900"
                                  )}>
                                    {incident.priority}
                                  </span>
                                </td>
                                <td className="py-4 px-2 font-bold">{incident.nature}</td>
                                <td className="py-4 px-2 text-white/60">{incident.barangay}</td>
                                <td className="py-4 px-2">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full",
                                      incident.status === 'Active' ? "bg-red-500" :
                                        incident.status === 'Cleared' ? "bg-white/20" : "bg-blue-500"
                                    )} />
                                    <span className="text-xs uppercase font-bold">{incident.status}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-2 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedIncident(incident);
                                      setActiveTab('emt');
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                  >
                                    <ChevronRight className="w-4 h-4 text-gold-500" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeTab === 'dispatch' && (
                <motion.div
                  key="dispatch"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-4xl mx-auto space-y-6"
                >
                  <Card title="Dispatch Intake (01-FORM)" icon={Plus}>
                    <form onSubmit={handleDispatchSubmit} className="space-y-6">
                      {/* Section A: Common Fields */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-500 border-b border-white/5 pb-2">A. Common Fields (Always Visible)</h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">TOC (Time of Call)</label>
                            <input
                              type="time"
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500"
                              value={formData.toc}
                              onChange={(e) => setFormData({ ...formData, toc: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Operator Name</label>
                            <input
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500"
                              placeholder="Dispatcher Name"
                              value={formData.operatorName}
                              onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Caller Name</label>
                            <input
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500"
                              placeholder="Full Name"
                              value={formData.callerName}
                              onChange={(e) => setFormData({ ...formData, callerName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Contact Number</label>
                            <input
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500"
                              placeholder="09XX-XXX-XXXX"
                              value={formData.callerContact}
                              onChange={(e) => setFormData({ ...formData, callerContact: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Barangay Location</label>
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                              <input
                                list="barangays"
                                placeholder="Search 51 Barangays..."
                                className="w-full bg-navy-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-gold-500 transition-colors"
                                value={formData.barangay}
                                onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                              />
                              <datalist id="barangays">
                                {MALOLOS_BARANGAYS.map(b => <option key={b} value={b} />)}
                              </datalist>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Landmark / Specifics</label>
                            <input
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500"
                              placeholder="e.g. Near Church, Red Gate"
                              value={formData.locationLandmark}
                              onChange={(e) => setFormData({ ...formData, locationLandmark: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Number of Involved</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['Single', 'Multiple'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, numberInvolved: opt as any })}
                                  className={cn(
                                    "py-3 rounded-xl border text-[10px] font-black uppercase transition-all",
                                    formData.numberInvolved === opt
                                      ? "bg-gold-500 text-navy-900 border-gold-500 shadow-lg shadow-gold-500/20"
                                      : "bg-navy-900 border-white/5 text-white/40 hover:text-white"
                                  )}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                          {formData.numberInvolved === 'Multiple' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="space-y-2"
                            >
                              <label className="text-[10px] uppercase tracking-widest text-red-500 font-bold flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" />
                                Number of Patients
                              </label>
                              <input
                                type="number"
                                min={1}
                                className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-500 focus:outline-none focus:border-red-500"
                                value={formData.numberPatients}
                                onChange={(e) => setFormData({ ...formData, numberPatients: parseInt(e.target.value) })}
                              />
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Triage Selection */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-500 border-b border-white/5 pb-2">Triage & Nature</h3>
                        <div className="grid grid-cols-5 gap-2">
                          {TRIAGE_CATEGORIES.map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, triage: cat.id as any, nature: '' })}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                                formData.triage === cat.id
                                  ? `${cat.color} border-white/20 shadow-lg`
                                  : "bg-navy-900 border-white/5 text-white/40 hover:text-white"
                              )}
                            >
                              <span className="text-xs font-black">{cat.id}</span>
                              <span className="text-[8px] uppercase tracking-widest font-bold">{cat.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Nature Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {TRIAGE_CATEGORIES.find(c => c.id === formData.triage)?.natures.map(nature => (
                            <button
                              key={nature}
                              type="button"
                              onClick={() => setFormData({ ...formData, nature })}
                              className={cn(
                                "px-4 py-3 rounded-xl border text-xs font-bold transition-all",
                                formData.nature === nature
                                  ? "bg-gold-500 text-navy-900 border-gold-500"
                                  : "bg-navy-900 border-white/5 text-white/60 hover:border-white/20"
                              )}
                            >
                              {nature}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Section B: Operational Fields */}
                      <div className="space-y-4 pt-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-500 border-b border-white/5 pb-2">B. Operational Fields (Filled as team moves)</h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Unit Number</label>
                            <select
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500 appearance-none"
                              value={formData.unitNumber}
                              onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                            >
                              <option value="">Select Unit</option>
                              {ambulances.map(amb => (
                                <option key={amb.id} value={amb.unitId}>{amb.unitId} ({amb.plateNumber})</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Priority Level</label>
                            <select
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500 appearance-none"
                              value={formData.priority}
                              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                            >
                              <option value="Low">Low Priority</option>
                              <option value="Medium">Medium Priority</option>
                              <option value="High">High Priority</option>
                              <option value="Critical">Critical (Immediate)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {[0, 1, 2].map(idx => (
                            <div key={idx} className="space-y-2">
                              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Responder {idx + 1}</label>
                              <select
                                className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-gold-500 appearance-none"
                                value={formData.responders?.[idx] || ''}
                                onChange={(e) => {
                                  const newResponders = [...(formData.responders || ['', '', ''])];
                                  newResponders[idx] = e.target.value;
                                  setFormData({ ...formData, responders: newResponders });
                                }}
                              >
                                <option value="">Select Operator</option>
                                {operators.map(op => (
                                  <option key={op.id} value={op.name}>{op.name} ({op.designation})</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">TOD (Time of Dispatch)</label>
                            <input
                              type="time"
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500"
                              value={formData.tod}
                              onChange={(e) => setFormData({ ...formData, tod: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">TOA (Time of Arrival)</label>
                            <input
                              type="time"
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500"
                              value={formData.toa}
                              onChange={(e) => setFormData({ ...formData, toa: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Odometer Start</label>
                            <input
                              type="number"
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500"
                              value={formData.odometerStart}
                              onChange={(e) => setFormData({ ...formData, odometerStart: parseInt(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Odometer End</label>
                            <input
                              type="number"
                              className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-gold-500"
                              value={formData.odometerEnd}
                              onChange={(e) => setFormData({ ...formData, odometerEnd: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* First Aid OTP Protocol Section */}
                      <div className="space-y-4 pt-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-500 border-b border-white/5 pb-2">First Aid OTP Protocol</h3>

                        {/* 01. THE ACTIVATION BAR */}
                        <div className={cn(
                          "p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between",
                          isOtpActive ? 'bg-gold-500 border-gold-400 shadow-lg shadow-gold-500/20' : 'bg-navy-900 border-white/5'
                        )}>
                          <div className="flex items-center gap-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isOtpActive}
                                onChange={() => {
                                  setIsOtpActive(!isOtpActive);
                                  if (isOtpActive) setIsMetronomeActive(false);
                                }}
                              />
                              <div className={cn(
                                "w-11 h-6 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all",
                                isOtpActive ? 'bg-navy-800 after:translate-x-full' : 'bg-navy-700'
                              )}></div>
                              <span className={cn(
                                "ml-3 text-xs font-black uppercase tracking-[0.2em]",
                                isOtpActive ? 'text-navy-900' : 'text-white/40'
                              )}>
                                First Aid OTP Protocol
                              </span>
                            </label>
                          </div>
                          {isOtpActive && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                              <span className="text-[10px] font-black text-navy-900/60 uppercase tracking-widest">Active Session</span>
                              <div className="w-2 h-2 bg-navy-900 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>

                        {/* 02. THE CONDITIONAL CONTENT */}
                        {isOtpActive && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                          >
                            <div className="bg-navy-900 p-6 rounded-2xl border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                              <div>
                                <h1 className="text-2xl font-black uppercase tracking-tighter italic text-white">IDROS <span className="text-gold-500 underline">FIRST-AID</span></h1>
                                <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase italic">Node: Dispatch Assistance</p>
                              </div>

                              <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                                  <input
                                    type="text"
                                    placeholder="Quick Search Protocol..."
                                    className="bg-navy-800 border border-white/10 p-3 pl-10 rounded-xl text-xs w-full focus:border-gold-500 outline-none transition-all text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                  />
                                </div>
                                <button
                                  onClick={() => setLanguage(l => l === 'English' ? 'Tagalog' : 'English')}
                                  className="bg-gold-500 text-navy-900 px-4 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-gold-500/20 active:scale-95 transition-transform"
                                >
                                  {language}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                              <div className="lg:col-span-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {PROTOCOLS.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() => setSelectedProtocol(p)}
                                    className={cn(
                                      "w-full p-4 rounded-2xl border flex items-center gap-4 transition-all group",
                                      selectedProtocol?.id === p.id
                                        ? 'bg-gold-500 border-gold-500 text-navy-900 shadow-xl'
                                        : 'bg-navy-900 border-white/5 text-white/40 hover:border-white/20 hover:text-white'
                                    )}
                                  >
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      selectedProtocol?.id === p.id ? 'bg-navy-800/10' : 'bg-navy-800'
                                    )}>
                                      <Icon path={p.icon} className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                      <p className="text-xs font-black uppercase">{p.title}</p>
                                      <p className={cn(
                                        "text-[8px] font-bold uppercase tracking-widest",
                                        selectedProtocol?.id === p.id ? 'text-navy-900/60' : 'text-white/20'
                                      )}>
                                        {p.category}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>

                              <div className="lg:col-span-8">
                                {selectedProtocol ? (
                                  <div className="bg-navy-900 rounded-3xl border border-white/5 shadow-2xl overflow-hidden h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
                                    <div className="p-8 bg-navy-800 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
                                      {isMetronomeActive && metronomePulse && (
                                        <div className="absolute inset-0 bg-red-500/5 animate-ping"></div>
                                      )}

                                      <div className="relative z-10">
                                        <span className={cn(
                                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-2 inline-block",
                                          selectedProtocol.category === 'Critical' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                                        )}>
                                          {selectedProtocol.category}
                                        </span>
                                        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{selectedProtocol.title}</h2>
                                      </div>

                                      {selectedProtocol.metronome && (
                                        <button
                                          onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                                          className={cn(
                                            "relative z-10 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all",
                                            isMetronomeActive
                                              ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                              : 'bg-navy-900 border-white/10 text-white/40 hover:border-white/20'
                                          )}
                                        >
                                          <Activity className={cn("w-6 h-6 mb-1", isMetronomeActive ? 'animate-pulse' : '')} />
                                          <span className="text-[8px] font-black uppercase">Metronome</span>
                                        </button>
                                      )}
                                    </div>

                                    <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                      {selectedProtocol.steps[language].map((step: string, i: number) => (
                                        <div key={i} className="flex gap-6 group">
                                          <div className="w-10 h-10 rounded-full bg-navy-800 border border-white/10 flex items-center justify-center text-xs font-black text-gold-500 shrink-0 group-hover:border-gold-500 transition-colors">
                                            {i + 1}
                                          </div>
                                          <p className="text-lg font-bold leading-relaxed text-white/60 group-hover:text-white transition-colors">
                                            {step}
                                          </p>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="p-6 bg-navy-800/50 border-t border-white/5 text-center italic text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
                                      End of Protocol Instructions
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full bg-navy-900 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-white/20 gap-4 min-h-[400px]">
                                    <AlertTriangle className="w-12 h-12 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Select an Emergency Category from the menu</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div className="pt-6">
                        <button
                          type="submit"
                          className="w-full bg-gold-500 text-navy-900 font-black py-4 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <Truck className="w-5 h-5" />
                          INITIATE DISPATCH
                        </button>
                      </div>
                    </form>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'emt' && (
                <motion.div
                  key="clinical"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ClinicalEntry initialRefId={selectedIncident?.id} />
                </motion.div>
              )}

              {activeTab === 'fire' && (
                <motion.div
                  key="fire"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-3xl mx-auto"
                >
                  <FireOperations userEmail={user?.email} />
                </motion.div>
              )}
              {activeTab === 'calls' && (
                <motion.div
                  key="calls"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-3xl mx-auto"
                >
                  <CallCounter userEmail={user?.email} />
                </motion.div>
              )}
              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6"
                >
                  <ReportGenerator
                    incidents={[
                      ...incidents,
                      ...traumaRecords.map(r => ({
                        ...r,
                        triage: 'TE',
                        timestamp: r.createdAt,
                        toc: r.timeOfCall,
                        tod: r.timeOfDispatch,
                        toa: r.timeOfArrival,
                        operatorName: r.operator,
                        callerName: r.caller,
                        callerContact: r.callerNumber,
                        locationLandmark: r.landmark,
                        responders: [r.responder1, r.responder2, r.responder3],
                        unitNumber: r.unit,
                      })),
                      ...medicalRecords.map(r => ({
                        ...r,
                        triage: 'ME',
                        timestamp: r.createdAt,
                        toc: r.timeOfCall,
                        tod: r.timeOfDispatch,
                        toa: r.timeOfArrival,
                        operatorName: r.operator,
                        callerName: r.caller,
                        callerContact: r.callerNumber,
                        locationLandmark: r.landmark,
                        responders: [r.responder1, r.responder2, r.responder3],
                        unitNumber: r.unit,
                      })),
                    ]}
                    fireRecords={fireRecords}
                    otherInquiries={otherInquiries}
                  />
                </motion.div>
              )}

              {activeTab === 'accomplishment' && (
                <motion.div
                  key="accomplishment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6"
                >
                  <AccomplishmentReport
                    incidents={[
                      ...incidents,
                      ...traumaRecords.map(r => ({ ...r, triage: 'TE', timestamp: r.createdAt })),
                      ...medicalRecords.map(r => ({ ...r, triage: 'ME', timestamp: r.createdAt })),
                      ...fireRecords.map(r => ({ ...r, triage: 'FE', timestamp: r.createdAt })),
                    ]}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <aside className="w-80 bg-navy-800 border-l border-white/5 flex flex-col shadow-2xl z-20 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-navy-900/50">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-500 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> Intelligence Rail
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-navy-900 rounded-xl border border-white/5">
                <div className="text-[8px] uppercase text-white/30 font-bold mb-1">Sync Status</div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
                </div>
              </div>
              <div className="p-3 bg-navy-900 rounded-xl border border-white/5">
                <div className="text-[8px] uppercase text-white/30 font-bold mb-1">Node Latency</div>
                <div className="text-[10px] font-black text-gold-500 uppercase tracking-widest">24ms</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <section>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-4 flex items-center justify-between">
                Live Comms Feed <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              </h4>
              <div className="space-y-4">
                {[
                  { time: '00:54', unit: 'DISPATCH', msg: 'Form 01 generated for Brgy. San Juan' },
                  { time: '00:52', unit: 'AMBU-01', msg: 'En route to Bulacan Medical Center' },
                  { time: '00:50', unit: 'SYSTEM', msg: 'Master Node sync completed (v2.5)' },
                  { time: '00:48', unit: 'OPCEN', msg: 'Weather advisory: Heavy rain in Malolos' },
                  { time: '00:45', unit: 'FIRE-01', msg: 'Structure fire reported in Brgy. Dakila' },
                ].map((log, i) => (
                  <div key={i} className="flex gap-3 group">
                    <span className="text-[9px] font-mono text-white/20 mt-0.5">{log.time}</span>
                    <div className="flex-1">
                      <span className="text-[9px] font-black text-gold-500 uppercase mr-2">[{log.unit}]</span>
                      <p className="text-[11px] text-white/60 leading-relaxed group-hover:text-white transition-colors">{log.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-6 border-t border-white/5">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-4">Tactical Alerts</h4>
              <div className="space-y-3">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Critical Priority</span>
                  </div>
                  <p className="text-[11px] text-white/80 font-bold leading-tight">MVA with Multiple Injuries reported at McArthur Highway.</p>
                </div>
                <div className="p-4 bg-gold-500/10 border border-gold-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-3 h-3 text-gold-500" />
                    <span className="text-[9px] font-black text-gold-500 uppercase tracking-widest">Resource Alert</span>
                  </div>
                  <p className="text-[11px] text-white/80 font-bold leading-tight">Ambu-02 is due for tactical maintenance in 48 hours.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="p-6 bg-navy-900/50 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">Encryption Node</span>
              <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">AES-256 Active</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 10, repeat: Infinity }}
                className="h-full bg-gold-500 shadow-[0_0_10px_rgba(244,180,0,0.5)]"
              />
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-navy-800 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-navy-900/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gold-500/10 rounded-2xl">
                    <Settings className="w-6 h-6 text-gold-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">System <span className="text-gold-500">Settings</span></h2>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Malolos Command Node Configuration</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-all text-white/20 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Ambulance Management */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gold-500 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Ambulance Fleet
                      </h3>
                      <span className="text-[10px] font-mono text-white/20">{ambulances.length} Units Active</span>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        const unitId = formData.get('unitId') as string;
                        const plateNumber = formData.get('plateNumber') as string;
                        if (!unitId || !plateNumber) return;
                        await addDoc(collection(db, 'ambulances'), { unitId, plateNumber, status: 'Active' });
                        form.reset();
                      }}
                      className="grid grid-cols-2 gap-2"
                    >
                      <input name="unitId" placeholder="Unit ID (e.g. AMBU-01)" className="bg-navy-900 border border-white/5 rounded-xl p-3 text-xs focus:border-gold-500 outline-none" required />
                      <input name="plateNumber" placeholder="Plate Number" className="bg-navy-900 border border-white/5 rounded-xl p-3 text-xs focus:border-gold-500 outline-none" required />
                      <button type="submit" className="col-span-2 py-3 bg-gold-500 text-navy-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all">
                        Register New Unit
                      </button>
                    </form>

                    <div className="space-y-2">
                      {ambulances.map(amb => (
                        <div key={amb.id} className="p-4 bg-navy-900/50 border border-white/5 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-navy-800 flex items-center justify-center text-gold-500 font-black text-xs">
                              {amb.unitId.split('-')[1] || amb.unitId[0]}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase text-white">{amb.unitId}</p>
                              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{amb.plateNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2 py-1 rounded-full",
                              amb.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gold-500/10 text-gold-500'
                            )}>
                              {amb.status}
                            </span>
                            <button
                              onClick={() => deleteDoc(doc(db, 'ambulances', amb.id))}
                              className="p-2 text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Operator Management */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gold-500 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Tactical Operators
                      </h3>
                      <span className="text-[10px] font-mono text-white/20">{operators.length} Personnel</span>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        const name = formData.get('name') as string;
                        const designation = formData.get('designation') as string;
                        const shift = formData.get('shift') as string;
                        if (!name || !designation) return;
                        await addDoc(collection(db, 'operators'), { name, designation, shift });
                        form.reset();
                      }}
                      className="grid grid-cols-2 gap-2"
                    >
                      <input name="name" placeholder="Full Name" className="bg-navy-900 border border-white/5 rounded-xl p-3 text-xs focus:border-gold-500 outline-none" required />
                      <select name="designation" className="bg-navy-900 border border-white/5 rounded-xl p-3 text-xs focus:border-gold-500 outline-none" required>
                        <option value="EMT-B">EMT-B</option>
                        <option value="EMT-A">EMT-A</option>
                        <option value="Driver">Driver</option>
                        <option value="OpCen">OpCen</option>
                      </select>
                      <select name="shift" className="bg-navy-900 border border-white/5 rounded-xl p-3 text-xs focus:border-gold-500 outline-none" required>
                        <option value="Day">Day Shift</option>
                        <option value="Night">Night Shift</option>
                        <option value="24h">24h Duty</option>
                      </select>
                      <button type="submit" className="py-3 bg-gold-500 text-navy-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all">
                        Add Operator
                      </button>
                    </form>

                    <div className="space-y-2">
                      {operators.map(op => (
                        <div key={op.id} className="p-4 bg-navy-900/50 border border-white/5 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-navy-800 flex items-center justify-center text-gold-500 font-black text-xs">
                              {op.name[0]}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase text-white">{op.name}</p>
                              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{op.designation} | {op.shift}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteDoc(doc(db, 'operators', op.id))}
                            className="p-2 text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Clinical Interventions Management */}
                <section className="mt-12 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gold-500 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Clinical Interventions
                    </h3>
                    <span className="text-[10px] font-mono text-white/20">{systemInterventions.length} Protocols</span>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const formData = new FormData(form);
                      const name = formData.get('name') as string;
                      if (!name) return;
                      await addDoc(collection(db, 'system_interventions'), { name });
                      form.reset();
                    }}
                    className="flex gap-2"
                  >
                    <input name="name" placeholder="New Intervention Name (e.g. Advanced Airway)" className="flex-1 bg-navy-900 border border-white/5 rounded-xl p-3 text-xs focus:border-gold-500 outline-none" required />
                    <button type="submit" className="px-8 py-3 bg-gold-500 text-navy-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all">
                      Add Protocol
                    </button>
                  </form>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {systemInterventions.map(int => (
                      <div key={int.id} className="p-3 bg-navy-900/50 border border-white/5 rounded-xl flex items-center justify-between group">
                        <span className="text-[10px] font-bold text-white/60 uppercase">{int.name}</span>
                        <button
                          onClick={() => deleteDoc(doc(db, 'system_interventions', int.id))}
                          className="p-1 text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-8 bg-navy-900/50 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Real-time Asset Sync Active</span>
                </div>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Malolos Tactical Node v2.5.4</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Status Bar */}
      <footer className="bg-navy-800 border-t border-white/10 px-6 py-2 flex items-center justify-between text-[8px] uppercase tracking-[0.2em] font-black text-white/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Server Online</span>
          </div>
          <span>Malolos CDRRMO HQ</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{new Date().toLocaleTimeString()}</span>
          <span className="text-gold-500">IDROS v2.5.0-STABLE</span>
        </div>
      </footer>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <Modal
        isOpen={!!viewingIncident}
        onClose={() => setViewingIncident(null)}
        title={`Incident Details - ${viewingIncident?.id}`}
      >
        {viewingIncident && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-navy-900/50 rounded-2xl border border-white/5">
                <div className="text-[8px] uppercase tracking-widest text-white/30 font-bold mb-1">Status</div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    viewingIncident.status === 'Active' ? "bg-red-500" : "bg-blue-500"
                  )} />
                  <span className="text-xs font-black uppercase">{viewingIncident.status}</span>
                </div>
              </div>
              <div className="p-4 bg-navy-900/50 rounded-2xl border border-white/5">
                <div className="text-[8px] uppercase tracking-widest text-white/30 font-bold mb-1">Priority</div>
                <span className={cn(
                  "text-xs font-black uppercase",
                  viewingIncident.priority === 'Critical' ? "text-red-500" : "text-gold-500"
                )}>{viewingIncident.priority}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gold-500/10 rounded-lg">
                  <Info className="w-4 h-4 text-gold-500" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Nature of Emergency</div>
                  <div className="text-lg font-black text-white">{viewingIncident.nature}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MapIcon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Location</div>
                  <div className="text-sm font-bold text-white">Brgy. {viewingIncident.barangay}</div>
                  <div className="text-xs text-white/60 italic">{viewingIncident.locationDetails}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex gap-3">
              <button
                onClick={() => {
                  setSelectedIncident(viewingIncident);
                  setActiveTab('emt');
                  setViewingIncident(null);
                }}
                className="flex-1 bg-gold-500 text-navy-900 font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
              >
                Open Clinical Form
              </button>
              <button
                onClick={() => setViewingIncident(null)}
                className="px-6 bg-white/5 text-white/60 font-bold py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}