
export const MALOLOS_BARANGAYS = Array.from(new Set([
  "Anat", "Bagna", "Bagong Bayan", "Batuhan", "Bulihan", "Bungahan", "Caingin", "Calero", "Caliligawan", "Canalate", "Caniogan", "Catmon", "Cofradia", "Dakila", "Guinhawa", "Liang", "Ligas", "Look 1st", "Look 2nd", "Lugam", "Mabolo", "Mambog", "Masile", "Matimbo", "Mojon", "Namayan", "Niugan", "Pamarawan", "Panasahan", "Pinagbakahan", "San Gabriel", "San Juan", "San Pablo", "San Pascual", "San Vicente", "Santiago", "Santol", "Santisima Trinidad", "Sto. Cristo", "Sto. Niño", "Sto. Rosario", "Sumapang Bata", "Sumapang Matanda", "Talaba", "Tikay", "Barihan", "Bunsuran 1st", "Bunsuran 2nd", "Bunsuran 3rd", "Longos"
])).sort();

export const VITALS_MATRIX = {
  'Infant': { hr: [100, 160], rr: [30, 60], bp_sys: [70, 100] },
  'Toddler': { hr: [90, 150], rr: [24, 40], bp_sys: [80, 110] },
  'Preschool': { hr: [80, 140], rr: [22, 34], bp_sys: [82, 110] },
  'School Age': { hr: [70, 120], rr: [18, 30], bp_sys: [84, 120] },
  'Adolescent': { hr: [60, 100], rr: [12, 16], bp_sys: [94, 120] },
  'Adult': { hr: [60, 100], rr: [12, 20], bp_sys: [90, 140] }
};

export const TRIAGE_CATEGORIES = [
  { id: 'TRAUMA',        prefix: 'T',  label: 'Trauma',        color: 'bg-red-500',     natures: ['MVA', 'Fall', 'Assault', 'Gunshot', 'Stabbing', 'Burn'] },
  { id: 'MEDICAL',       prefix: 'M',  label: 'Medical',       color: 'bg-blue-500',    natures: ['Difficulty Breathing', 'Chest Pain', 'Seizure', 'Stroke', 'Abdominal Pain', 'Unconscious'] },
  { id: 'FIRE',          prefix: 'F',  label: 'Fire',          color: 'bg-orange-500',  natures: ['Residential', 'Commercial', 'Grass Fire', 'Electrical', 'Vehicular Fire'] },
  { id: 'TRANSFER',      prefix: 'TR', label: 'Transfer',      color: 'bg-emerald-500', natures: ['Inter-facility', 'Home to Hospital', 'Hospital to Home'] },
  { id: 'STANDBY MEDIC', prefix: 'SM', label: 'Standby Medic', color: 'bg-yellow-500',  natures: ['Event', 'VIP', 'Drill'] },
  { id: 'OTHERS',        prefix: 'OT', label: 'Others',        color: 'bg-slate-500',   natures: ['Assistance', 'Information', 'Non-Emergency', 'Miscellaneous'] },
];

// Maps old shorthand codes stored in Firestore to the new full Case Type names
export const LEGACY_TRIAGE_MAP: Record<string, string> = {
  'TE': 'TRAUMA',
  'ME': 'MEDICAL',
  'FE': 'FIRE',
  'TR': 'TRANSFER',
  'ST': 'STANDBY MEDIC',
};

export function normalizeCaseType(value: string): string {
  return LEGACY_TRIAGE_MAP[value] ?? value;
}

export const FIRE_ALARM_LEVELS = [
  '1st Alarm', '2nd Alarm', '3rd Alarm', '4th Alarm', '5th Alarm', 'Task Force Alpha', 'Task Force Bravo', 'Task Force Charlie', 'General Alarm'
];

export const MEDICAL_CONDITIONS = [
  'Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Stroke History', 'Seizure Disorder', 'Allergies', 'COPD', 'Kidney Disease', 'None'
];

export const INJURY_TYPES = [
  'Fracture', 'Laceration', 'Burn', 'Abrasion', 'Contusion', 'Puncture', 'Gunshot', 'Amputation', 'None'
];

export const PROTOCOLS = [
  {
    id: 'CPR_ADULT',
    title: 'Adult CPR',
    category: 'Critical',
    icon: "M22 12h-4l-3 9L9 3l-3 9H2",
    steps: {
      English: [
        "Ensure the scene is safe for the caller.",
        "Lay the patient flat on their back on a hard surface.",
        "Place the heel of one hand in the center of the chest.",
        "Push HARD and FAST (at least 2 inches deep).",
        "Do not stop until the ambulance arrives."
      ],
      Tagalog: [
        "Siguraduhin na ligtas ang paligid.",
        "Ikahiga ang pasyente sa matigas na sahig.",
        "Ipatong ang dulo ng palad sa gitna ng dibdib.",
        "Umiin nang MALAKAS at MABILIS (lalim na 2 pulgada).",
        "Huwag hihinto hanggang dumating ang ambulansya."
      ]
    },
    metronome: true
  },
  {
    id: 'CHOKING',
    title: 'Choking (Conscious)',
    category: 'Critical',
    icon: "M12 2v20M2 12h20",
    steps: {
      English: [
        "Stand behind the person and wrap arms around waist.",
        "Make a fist and place it just above the navel.",
        "Perform quick, upward thrusts (Heimlich Maneuver).",
        "Repeat until the object is forced out or patient faints."
      ],
      Tagalog: [
        "Tumayo sa likod ng pasyente at yakapin ang baywang.",
        "Isara ang kamao sa itaas ng pusod.",
        "Hilahin nang paitaas nang mabilis (Heimlich Maneuver).",
        "Ulitin hanggang lumabas ang bara o mawalan ng malay."
      ]
    }
  },
  {
    id: 'BLEEDING',
    title: 'Severe Bleeding',
    category: 'Trauma',
    icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    steps: {
      English: [
        "Find a clean cloth or bandage.",
        "Apply firm, direct pressure on the wound.",
        "Do not lift the cloth to check the wound.",
        "If blood soaks through, add more cloth on top."
      ],
      Tagalog: [
        "Kumuha ng malinis na tela o bendahe.",
        "Diinan nang husto ang sugat.",
        "Huwag aalisin ang tela para silipin ang sugat.",
        "Kung bumaha ang dugo, patungan pa ng dagdag na tela."
      ]
    }
  },
  {
    id: 'CHILDBIRTH',
    title: 'Emergency Childbirth',
    category: 'Medical',
    icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2",
    steps: {
      English: [
        "Support the baby's head as it emerges.",
        "Do not pull the baby.",
        "Clear the baby's nose and mouth.",
        "Keep the baby warm and at the level of the mother's heart."
      ],
      Tagalog: [
        "Saluin ang ulo ng bata habang lumalabas.",
        "Huwag hihilahin ang bata.",
        "Linisin ang ilong at bibig ng bata.",
        "Panatilihing mainit ang bata at kapantay ng puso ng ina."
      ]
    }
  }
];
