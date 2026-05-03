import React from 'react';
import { motion } from 'motion/react';
import { BodyZone } from '../types';

interface BodyMapProps {
  selectedZones: BodyZone[];
  onZoneClick: (zoneId: string, label: string, side: 'Front' | 'Back') => void;
  isDOA?: boolean;
}

const BodyMap: React.FC<BodyMapProps> = ({ selectedZones, onZoneClick, isDOA }) => {
  const [view, setView] = React.useState<'Front' | 'Back'>('Front');

  const zones = [
    { id: 'H', label: 'Head', front: { cx: 50, cy: 10, r: 8 }, back: { cx: 50, cy: 10, r: 8 } },
    { id: 'N', label: 'Neck', front: { x: 45, y: 18, w: 10, h: 5 }, back: { x: 45, y: 18, w: 10, h: 5 } },
    { id: 'CH', label: 'Chest', front: { x: 35, y: 24, w: 30, h: 15 }, back: { x: 35, y: 24, w: 30, h: 15 } },
    { id: 'AB', label: 'Abdomen', front: { x: 35, y: 40, w: 30, h: 15 }, back: { x: 35, y: 40, w: 30, h: 15 } },
    { id: 'EXT_UL', label: 'Upper Left Arm', front: { x: 66, y: 24, w: 8, h: 30 }, back: { x: 26, y: 24, w: 8, h: 30 } },
    { id: 'EXT_UR', label: 'Upper Right Arm', front: { x: 26, y: 24, w: 8, h: 30 }, back: { x: 66, y: 24, w: 8, h: 30 } },
    { id: 'EXT_LL', label: 'Lower Left Leg', front: { x: 52, y: 56, w: 12, h: 40 }, back: { x: 36, y: 56, w: 12, h: 40 } },
    { id: 'EXT_LR', label: 'Lower Right Leg', front: { x: 36, y: 56, w: 12, h: 40 }, back: { x: 52, y: 56, w: 12, h: 40 } },
  ];

  const isZoneSelected = (id: string) => selectedZones.some(z => z.id === id && z.side === view);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex bg-navy-800 rounded-lg p-1 border border-white/10">
        <button
          onClick={() => setView('Front')}
          className={`px-4 py-1 rounded-md text-xs font-bold transition-colors ${view === 'Front' ? 'bg-gold-500 text-navy-900' : 'text-white/60 hover:text-white'}`}
        >
          FRONT
        </button>
        <button
          onClick={() => setView('Back')}
          className={`px-4 py-1 rounded-md text-xs font-bold transition-colors ${view === 'Back' ? 'bg-gold-500 text-navy-900' : 'text-white/60 hover:text-white'}`}
        >
          BACK
        </button>
      </div>

      <div className="relative w-64 h-96 bg-navy-800/50 rounded-2xl border border-white/5 p-4">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Outline */}
          <path
            d="M50,2 C55,2 60,5 60,12 C60,18 55,22 50,22 C45,22 40,18 40,12 C40,5 45,2 50,2 M40,24 L30,24 L25,55 L33,55 L35,40 L35,98 L48,98 L50,60 L52,98 L65,98 L65,40 L67,55 L75,55 L70,24 L60,24 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            opacity="0.2"
          />

          {zones.map((zone) => {
            const isSelected = isZoneSelected(zone.id);
            const activeColor = isDOA ? 'fill-slate-500' : 'fill-red-500';
            const baseColor = 'fill-white/10';

            if (zone.id === 'H') {
              const pos = view === 'Front' ? zone.front : zone.back;
              return (
                <circle
                  key={zone.id}
                  cx={pos.cx}
                  cy={pos.cy}
                  r={pos.r}
                  className={`cursor-pointer transition-colors ${isSelected ? activeColor : baseColor} hover:fill-gold-500/30`}
                  onClick={() => onZoneClick(zone.id, zone.label, view)}
                />
              );
            }

            const pos = view === 'Front' ? zone.front : zone.back;
            if (!pos) return null;

            return (
              <rect
                key={zone.id}
                x={pos.x}
                y={pos.y}
                width={pos.w}
                height={pos.h}
                rx="2"
                className={`cursor-pointer transition-colors ${isSelected ? activeColor : baseColor} hover:fill-gold-500/30`}
                onClick={() => onZoneClick(zone.id, zone.label, view)}
              />
            );
          })}
        </svg>
      </div>
      
      <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
        Anatomical Mapping Node v2.5
      </div>
    </div>
  );
};

export default BodyMap;
