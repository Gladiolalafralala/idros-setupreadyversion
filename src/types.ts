
export type IncidentStatus = 'Active' | 'Dispatched' | 'On-Scene' | 'Transporting' | 'At-Hospital' | 'Cleared' | 'DOA';

export type UserRole = 'Tech Head' | 'LDRRMO' | 'Division Head' | 'Admin' | 'EMT' | 'Fire' | 'OpCen';

export type AgeCategory = 'Infant' | 'Toddler' | 'Preschool' | 'School Age' | 'Adolescent' | 'Adult';

export interface VitalsReading {
  timestamp: string;
  hr: number;
  rr: number;
  bp_sys: number;
  bp_dia: number;
  spo2: number;
  temp: number;
}

export interface BodyZone {
  id: string; // H, N, CH, AB, EXT_UL, EXT_UR, EXT_LL, EXT_LR
  label: string;
  findings: string[]; // Fracture, Laceration, Burn, etc.
  side: 'Front' | 'Back';
}

export interface ClinicalData {
  referenceId: string;
  patientName: string;
  dob?: string;
  age?: number;
  ageCategory: AgeCategory;
  patientStatus: 'Stable' | 'Critical' | 'DOA' | 'Conscious' | 'Unconscious';
  caseCategory: 'Medical' | 'Trauma';
  address?: string;
  contactNumber?: string;
  medicalConditions?: string[];
  chiefComplaint?: string;
  injury?: string;
  vitalsLog: VitalsReading[];
  bodyMapping: BodyZone[];
  interventions: string[];
  disposition: string;
  destination: string;
  injurySummary: string;
}

export interface Incident {
  id: string; // Ref ID: [Case][YYMMDD]-[Random]
  timestamp: any;
  status: IncidentStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  triage: 'TRAUMA' | 'MEDICAL' | 'FIRE' | 'TRANSFER' | 'STANDBY MEDIC' | 'OTHERS'
       | 'TE' | 'ME' | 'FE' | 'TR' | 'ST'; // legacy codes kept for backward compat
  nature: string;
  barangay: string;
  locationDetails: string;
  locationLandmark?: string;
  callerName?: string;
  callerContact?: string;
  units: string[];
  
  // New Dispatch Intake Fields
  toc?: string; // Time of Call
  numberInvolved?: 'Single' | 'Multiple';
  numberPatients?: number;
  operatorName?: string;
  
  // Operational Fields
  responders?: string[]; // Slots for Responder 1, 2, and 3
  unitNumber?: string;
  tod?: string; // Time of Dispatch
  toa?: string; // Time of Arrival
  odometerStart?: number;
  odometerEnd?: number;
  
  // Clinical Data (02-Form)
  clinicalData?: ClinicalData;
  
  // Fire Data
  fireAlarmLevel?: string;
  hazards?: string[];
  hydrantProximity?: string;
  entryWidth?: 'Narrow' | 'Wide';
}

export interface Ambulance {
  id: string;
  unitId: string;
  plateNumber: string;
  status: 'Active' | 'Maintenance' | 'Inactive';
}

export interface Operator {
  id: string;
  name: string;
  designation: string;
  shift: 'Day' | 'Night' | '24h';
}

export interface UserProfile {
  uid: string;
  role: 'Dispatcher' | 'EMT' | 'Fire' | 'Admin';
  name: string;
  unit?: string;
}
