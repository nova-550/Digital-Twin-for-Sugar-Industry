import React from 'react';
import { motion } from 'framer-motion';

export default function ProcessFlow({ stageHealth = {}, stageHighlights = {}, onSelectStage, activeStage }) {
  // We extract all process highlights to display next to the equipment
  const cane = stageHighlights['cane_handling'] || {};
  const mill = stageHighlights['milling'] || {};
  const clarif = stageHighlights['clarification'] || {};
  const evap = stageHighlights['evaporation'] || {};
  const cryst = stageHighlights['crystallization'] || {};
  const centr = stageHighlights['centrifugation'] || {};

  const getStatusColor = (id) => {
    const status = stageHealth[id]?.status;
    switch (status?.toUpperCase()) {
      case 'RED': return '#dc2626'; // Red 600
      case 'YELLOW': return '#d97706'; // Amber 600
      default: return '#059669'; // Emerald 600
    }
  };

  const getStatusBg = (id) => {
    const status = stageHealth[id]?.status;
    switch (status?.toUpperCase()) {
      case 'RED': return 'rgba(220, 38, 38, 0.08)';
      case 'YELLOW': return 'rgba(217, 119, 6, 0.08)';
      default: return 'rgba(5, 150, 105, 0.08)';
    }
  };

  return (
    <div className="panel w-full overflow-hidden flex flex-col gap-4" style={{ minHeight: 480 }}>
      {/* 1. Header with HMI Legend & Status */}
      <div className="flex justify-between items-start flex-wrap gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <span className="panel-title mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            ISA-101 High-Performance HMI Process Schematic (P&ID)
          </span>
          <p className="text-xs text-muted" style={{ color: 'var(--text-secondary)' }}>
            Digital Twin refinery flowline. Click on any colored plant section to isolate telemetry and analyze sensor channels.
          </p>
        </div>
        
        {/* SCADA Valve & Pipeline Legend */}
        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-[3px] bg-sky-400" /> Mixed Juice / Water
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-[3px] bg-amber-500" /> Concentrated Syrup
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-[3px] bg-red-400" /> Hot Steam / Vapor
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-[3px]" style={{ borderBottom: '3px dashed #b44fff' }} /> Molasses Bypass
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Blueprint Panel */}
      <div className="relative overflow-x-auto pb-4" style={{ background: '#fafbfc', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
        <svg 
          viewBox="0 0 1200 380" 
          className="w-full min-w-[1100px] h-auto select-none"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {/* Grid Blueprint Overlay */}
          <defs>
            <pattern id="pid-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148, 163, 184, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pid-grid)" />

          {/* ==================== 1. CANE HANDLING SECTOR ==================== */}
          <g 
            className="cursor-pointer" 
            onClick={() => onSelectStage('cane_handling')}
            style={{ opacity: activeStage && activeStage !== 'cane_handling' ? 0.45 : 1, transition: 'all 0.3s' }}
          >
            {/* Sector Boundary Box */}
            <rect x="10" y="40" width="160" height="310" rx="6" fill={getStatusBg('cane_handling')} stroke={activeStage === 'cane_handling' ? 'var(--cyan)' : 'transparent'} strokeWidth="1.5" />
            <text x="20" y="60" className="font-bold text-[10px]" fill="var(--text-muted)">01. CANE RECEP</text>
            
            {/* Cane Feeder Conveyor Outline */}
            <line x1="20" y1="280" x2="140" y2="200" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <circle cx="25" cy="283" r="5" fill="#334155" />
            <circle cx="135" cy="203" r="5" fill="#334155" />
            
            {/* Shredder Knife Assembly Icon */}
            <path d="M 125,175 L 155,205 M 155,175 L 125,205" stroke="#475569" strokeWidth="3" />
            <circle cx="140" cy="190" r="12" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="3 2" />

            {/* ISA Instruments & Metrics */}
            {/* WI-101 (Conveyor Weight) */}
            <circle cx="50" cy="120" r="16" fill="white" stroke="#64748b" strokeWidth="1.5" />
            <line x1="50" y1="136" x2="50" y2="260" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
            <text x="50" y="117" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">WI</text>
            <text x="50" y="129" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">101</text>
            <text x="74" y="125" className="text-[10px] font-bold" fill="var(--text-primary)">
              {cane.net_cane_tph || 210} <tspan fill="var(--text-muted)" fontSize="8">T/H</tspan>
            </text>

            {/* QI-102 (Trash Impurity) */}
            <circle cx="120" cy="120" r="16" fill="white" stroke="#64748b" strokeWidth="1.5" />
            <text x="120" y="117" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">QI</text>
            <text x="120" y="129" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">102</text>
            <text x="120" y="147" textAnchor="middle" className="text-[9px] font-bold" fill="var(--text-primary)">
              {cane.trash_pct || 3.2}% <tspan fill="var(--text-muted)" fontSize="7">TRASH</tspan>
            </text>
          </g>

          {/* Connect 1 -> 2 (Shredded Cane flow) */}
          <path d="M 155,190 L 195,190" stroke="#64748b" strokeWidth="3" strokeDasharray="5 3" />

          {/* ==================== 2. MILLING TRAIN SECTOR ==================== */}
          <g 
            className="cursor-pointer" 
            onClick={() => onSelectStage('milling')}
            style={{ opacity: activeStage && activeStage !== 'milling' ? 0.45 : 1, transition: 'all 0.3s' }}
          >
            {/* Sector Boundary Box */}
            <rect x="180" y="40" width="180" height="310" rx="6" fill={getStatusBg('milling')} stroke={activeStage === 'milling' ? 'var(--cyan)' : 'transparent'} strokeWidth="1.5" />
            <text x="190" y="60" className="font-bold text-[10px]" fill="var(--text-muted)">02. EXTRACTION MILL</text>

            {/* Three Rollers schematic (Triangular configuration) */}
            <g transform="translate(200, 180)">
              {/* Roller 1 (Top) */}
              <circle cx="50" cy="20" r="22" fill="none" stroke="#475569" strokeWidth="3" />
              <circle cx="50" cy="20" r="4" fill="#475569" />
              {/* Roller 2 (Bottom Left) */}
              <circle cx="25" cy="55" r="22" fill="none" stroke="#475569" strokeWidth="3" />
              <circle cx="25" cy="55" r="4" fill="#475569" />
              {/* Roller 3 (Bottom Right) */}
              <circle cx="75" cy="55" r="22" fill="none" stroke="#475569" strokeWidth="3" />
              <circle cx="75" cy="55" r="4" fill="#475569" />
              {/* Connecting housing gear */}
              <path d="M 50,20 L 25,55 L 75,55 Z" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            </g>

            {/* Imbibition Water Spray nozzle */}
            <path d="M 230,140 L 270,140" stroke="#0ea5e9" strokeWidth="2.5" />
            <path d="M 270,140 L 285,160 M 270,140 L 285,145 M 270,140 L 285,135" stroke="#0ea5e9" strokeWidth="1.5" />
            <text x="215" y="130" className="text-[8px] font-bold text-sky-600" fill="var(--cyan)">IMBIBITION</text>

            {/* ISA Instruments & Metrics */}
            {/* FIC-102 (Imbibition flow) */}
            <circle cx="210" cy="100" r="16" fill="white" stroke="#0ea5e9" strokeWidth="1.5" />
            <text x="210" y="97" textAnchor="middle" className="text-[8px] font-bold" fill="#0284c7">FIC</text>
            <text x="210" y="109" textAnchor="middle" className="text-[8px] font-bold" fill="#0284c7">102</text>
            <text x="232" y="104" className="text-[10px] font-bold text-sky-700">
              {mill.imbibition_water_pct || 25.0}% <tspan fill="var(--text-muted)" fontSize="8">RATIO</tspan>
            </text>

            {/* BI-103 (Raw juice Brix index) */}
            <circle cx="310" cy="100" r="16" fill="white" stroke="#059669" strokeWidth="1.5" />
            <text x="310" y="97" textAnchor="middle" className="text-[8px] font-bold" fill="#059669">BI</text>
            <text x="310" y="109" textAnchor="middle" className="text-[8px] font-bold" fill="#059669">103</text>
            <text x="310" y="130" textAnchor="middle" className="text-[10px] font-bold" fill="var(--text-primary)">
              {mill.juice_brix_pct || 15.2}° <tspan fill="var(--text-muted)" fontSize="8">Bx</tspan>
            </text>
          </g>

          {/* Connect 2 -> 3 (Raw juice piping with flow animation) */}
          <path d="M 285,260 L 285,320 L 400,320" stroke="#0284c7" strokeWidth="3" fill="none" />
          <circle cx="340" cy="320" r="4" fill="#0ea5e9" className="animate-ping" style={{ animationDuration: '1.5s' }} />

          {/* ==================== 3. CLARIFICATION SECTOR ==================== */}
          <g 
            className="cursor-pointer" 
            onClick={() => onSelectStage('clarification')}
            style={{ opacity: activeStage && activeStage !== 'clarification' ? 0.45 : 1, transition: 'all 0.3s' }}
          >
            {/* Sector Boundary Box */}
            <rect x="375" y="40" width="180" height="310" rx="6" fill={getStatusBg('clarification')} stroke={activeStage === 'clarification' ? 'var(--cyan)' : 'transparent'} strokeWidth="1.5" />
            <text x="385" y="60" className="font-bold text-[10px]" fill="var(--text-muted)">03. JUICE CLARIFIER</text>

            {/* Clarifier Tank Vessel outline (Conical bottom cylindrical settler) */}
            <g transform="translate(425, 170)">
              {/* Cylindrical main body */}
              <rect x="0" y="10" width="80" height="70" fill="none" stroke="#475569" strokeWidth="2.5" />
              {/* Conical bottom */}
              <path d="M 0,80 L 40,115 L 80,80" fill="none" stroke="#475569" strokeWidth="2.5" />
              {/* Internal scraper paddles */}
              <line x1="40" y1="20" x2="40" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="15" y1="50" x2="65" y2="50" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="20" y1="80" x2="60" y2="80" stroke="#94a3b8" strokeWidth="1.5" />
            </g>

            {/* Lime milk feed valve bubble */}
            <path d="M 405,150 L 425,180" stroke="#7c3aed" strokeWidth="2" strokeDasharray="3 2" />
            <circle cx="405" cy="145" r="4" fill="#7c3aed" />

            {/* ISA Instruments & Metrics */}
            {/* AIC-201 (pH Loop) */}
            <circle cx="410" cy="100" r="16" fill="white" stroke="#7c3aed" strokeWidth="1.5" />
            <text x="410" y="97" textAnchor="middle" className="text-[8px] font-bold" fill="#7c3aed">AIC</text>
            <text x="410" y="109" textAnchor="middle" className="text-[8px] font-bold" fill="#7c3aed">201</text>
            <text x="432" y="104" className="text-[10px] font-bold text-violet-700">
              {clarif.estimated_ph || 7.2} <tspan fill="var(--text-muted)" fontSize="8">pH</tspan>
            </text>

            {/* QI-202 (Juice Purity) */}
            <circle cx="510" cy="100" r="16" fill="white" stroke="#64748b" strokeWidth="1.5" />
            <text x="510" y="97" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">QI</text>
            <text x="510" y="109" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">202</text>
            <text x="510" y="130" textAnchor="middle" className="text-[10px] font-bold" fill="var(--text-primary)">
              {clarif.clarified_purity_pct || 86.5}% <tspan fill="var(--text-muted)" fontSize="8">PUR</tspan>
            </text>
          </g>

          {/* Connect 3 -> 4 (Clarified juice piping to Evaporator) */}
          <path d="M 505,210 L 590,210" stroke="#0284c7" strokeWidth="3" />

          {/* ==================== 4. EVAPORATION SECTOR ==================== */}
          <g 
            className="cursor-pointer" 
            onClick={() => onSelectStage('evaporation')}
            style={{ opacity: activeStage && activeStage !== 'evaporation' ? 0.45 : 1, transition: 'all 0.3s' }}
          >
            {/* Sector Boundary Box */}
            <rect x="570" y="40" width="220" height="310" rx="6" fill={getStatusBg('evaporation')} stroke={activeStage === 'evaporation' ? 'var(--cyan)' : 'transparent'} strokeWidth="1.5" />
            <text x="580" y="60" className="font-bold text-[10px]" fill="var(--text-muted)">04. MULTIPLE EFFECT EVAPS</text>

            {/* Triple Effect Evaporator Columns series */}
            {/* Column 1 */}
            <g transform="translate(590, 180)">
              <rect x="0" y="0" width="30" height="80" rx="5" fill="none" stroke="#475569" strokeWidth="2.5" />
              <line x1="0" y1="40" x2="30" y2="40" stroke="#94a3b8" strokeWidth="1.5" />
            </g>
            {/* Column 2 */}
            <g transform="translate(640, 180)">
              <rect x="0" y="0" width="30" height="80" rx="5" fill="none" stroke="#475569" strokeWidth="2.5" />
              <line x1="0" y1="40" x2="30" y2="40" stroke="#94a3b8" strokeWidth="1.5" />
            </g>
            {/* Column 3 */}
            <g transform="translate(690, 180)">
              <rect x="0" y="0" width="30" height="80" rx="5" fill="none" stroke="#475569" strokeWidth="2.5" />
              <line x1="0" y1="40" x2="30" y2="40" stroke="#94a3b8" strokeWidth="1.5" />
            </g>

            {/* Connecting Interstage Vapor pipelines */}
            <path d="M 620,195 L 640,195" stroke="#ef4444" strokeWidth="2" />
            <path d="M 670,195 L 690,195" stroke="#ef4444" strokeWidth="2" />
            <path d="M 720,195 L 750,195 L 750,230" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />

            {/* ISA Instruments & Metrics */}
            {/* BIC-301 (Syrup Brix concentration) */}
            <circle cx="610" cy="100" r="16" fill="white" stroke="#d97706" strokeWidth="1.5" />
            <text x="610" y="97" textAnchor="middle" className="text-[8px] font-bold" fill="#d97706">BIC</text>
            <text x="610" y="109" textAnchor="middle" className="text-[8px] font-bold" fill="#d97706">301</text>
            <text x="632" y="104" className="text-[10px] font-bold text-amber-700">
              {evap.juice_brix_out_pct || 62.0}° <tspan fill="var(--text-muted)" fontSize="8">Bx</tspan>
            </text>

            {/* PIC-302 (1st Effect Steam pressure) */}
            <circle cx="710" cy="100" r="16" fill="white" stroke="#64748b" strokeWidth="1.5" />
            <text x="710" y="97" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">PIC</text>
            <text x="710" y="109" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">302</text>
            <text x="710" y="130" textAnchor="middle" className="text-[10px] font-bold" fill="var(--text-primary)">
              {evap.steam_economy || 3.32} <tspan fill="var(--text-muted)" fontSize="8">ECON</tspan>
            </text>
          </g>

          {/* Connect 4 -> 5 (Syrup flow lines) */}
          <path d="M 720,240 L 825,240" stroke="#d97706" strokeWidth="3" />

          {/* ==================== 5. CRYSTALLIZATION SECTOR ==================== */}
          <g 
            className="cursor-pointer" 
            onClick={() => onSelectStage('crystallization')}
            style={{ opacity: activeStage && activeStage !== 'crystallization' ? 0.45 : 1, transition: 'all 0.3s' }}
          >
            {/* Sector Boundary Box */}
            <rect x="805" y="40" width="180" height="310" rx="6" fill={getStatusBg('crystallization')} stroke={activeStage === 'crystallization' ? 'var(--cyan)' : 'transparent'} strokeWidth="1.5" />
            <text x="815" y="60" className="font-bold text-[10px]" fill="var(--text-muted)">05. VACUUM PAN BOILING</text>

            {/* Vacuum Pan Boiler outline (Domed top reactor with bottom calandria coil) */}
            <g transform="translate(855, 170)">
              {/* Domed structure */}
              <path d="M 10,25 C 10,0 70,0 70,25" fill="none" stroke="#475569" strokeWidth="2.5" />
              <rect x="10" y="25" width="60" height="60" fill="none" stroke="#475569" strokeWidth="2.5" />
              <path d="M 10,85 L 40,105 L 70,85" fill="none" stroke="#475569" strokeWidth="2.5" />
              {/* Heating calandria coils */}
              <path d="M 20,60 Q 30,50 40,60 T 60,60" fill="none" stroke="#e11d48" strokeWidth="1.5" />
              <path d="M 20,70 Q 30,60 40,70 T 60,70" fill="none" stroke="#e11d48" strokeWidth="1.5" />
            </g>

            {/* ISA Instruments & Metrics */}
            {/* MIC-401 (Mobility/Viscosity sensor) */}
            <circle cx="840" cy="100" r="16" fill="white" stroke="#64748b" strokeWidth="1.5" />
            <text x="840" y="97" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">MIC</text>
            <text x="840" y="109" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">401</text>
            <text x="862" y="104" className="text-[10px] font-bold text-slate-800">
              {cryst.supersaturation_coeff || 1.12} <tspan fill="var(--text-muted)" fontSize="8">SAT</tspan>
            </text>

            {/* PIC-402 (Condenser vacuum) */}
            <circle cx="940" cy="100" r="16" fill="white" stroke="#dc2626" strokeWidth="1.5" />
            <text x="940" y="97" textAnchor="middle" className="text-[8px] font-bold" fill="#dc2626">PIC</text>
            <text x="940" y="109" textAnchor="middle" className="text-[8px] font-bold" fill="#dc2626">402</text>
            <text x="940" y="130" textAnchor="middle" className="text-[10px] font-bold text-red-600">
              {cryst.boiling_point_c || 68.0}° <tspan fill="var(--text-muted)" fontSize="8">TEMP</tspan>
            </text>
          </g>

          {/* Connect 5 -> 6 (Massecuite heavy flow slurry line) */}
          <path d="M 925,260 L 925,295 L 1025,295" stroke="#b45309" strokeWidth="4" fill="none" />

          {/* ==================== 6. CENTRIFUGATION SECTOR ==================== */}
          <g 
            className="cursor-pointer" 
            onClick={() => onSelectStage('centrifugation')}
            style={{ opacity: activeStage && activeStage !== 'centrifugation' ? 0.45 : 1, transition: 'all 0.3s' }}
          >
            {/* Sector Boundary Box */}
            <rect x="1000" y="40" width="185" height="310" rx="6" fill={getStatusBg('centrifugation')} stroke={activeStage === 'centrifugation' ? 'var(--cyan)' : 'transparent'} strokeWidth="1.5" />
            <text x="1010" y="60" className="font-bold text-[10px]" fill="var(--text-muted)">06. DECANTER CENTRIFUGALS</text>

            {/* Centrifuge drum outlining */}
            <g transform="translate(1055, 175)">
              <rect x="0" y="0" width="70" height="70" fill="none" stroke="#475569" strokeWidth="2.5" />
              {/* Rotating inner perforated basket */}
              <rect x="10" y="10" width="50" height="50" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 2" />
              {/* Center drive shaft rotor */}
              <line x1="35" y1="0" x2="35" y2="70" stroke="#475569" strokeWidth="2.5" />
              <line x1="20" y1="35" x2="50" y2="35" stroke="#475569" strokeWidth="1.5" />
            </g>

            {/* Separated molasses discharge bypass loop */}
            <path d="M 1090,245 L 1090,270 L 1150,270 M 1150,270 L 1150,340" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />

            {/* ISA Instruments & Metrics */}
            {/* SIC-501 (Basket RPM speed) */}
            <circle cx="1035" cy="100" r="16" fill="white" stroke="#64748b" strokeWidth="1.5" />
            <text x="1035" y="97" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">SIC</text>
            <text x="1035" y="109" textAnchor="middle" className="text-[8px] font-bold" fill="#0f172a">501</text>
            <text x="1057" y="104" className="text-[10px] font-bold text-slate-800">
              {centr.g_factor || 920} <tspan fill="var(--text-muted)" fontSize="8">G</tspan>
            </text>

            {/* QI-502 (Final sugar purity) */}
            <circle cx="1135" cy="100" r="16" fill="white" stroke="#059669" strokeWidth="1.5" />
            <text x="1135" y="97" textAnchor="middle" className="text-[8px] font-bold" fill="#059669">QI</text>
            <text x="1135" y="109" textAnchor="middle" className="text-[8px] font-bold" fill="#059669">502</text>
            <text x="1135" y="130" textAnchor="middle" className="text-[10px] font-bold" fill="var(--text-primary)">
              {centr.final_sugar_purity_pct || 99.5}% <tspan fill="var(--text-muted)" fontSize="8">PUR</tspan>
            </text>
          </g>

          {/* Plant Discharge outlet (Crystals conveying line) */}
          <path d="M 1090,265 L 1090,320 L 1180,320" stroke="#d97706" strokeWidth="3.5" fill="none" />
          <path d="M 1180,320 L 1172,315 M 1180,320 L 1172,325" stroke="#d97706" strokeWidth="2.5" />
          <text x="1110" y="336" className="text-[9px] font-bold text-amber-700" fill="var(--amber)">REFINED SUGAR DISPATCH</text>

        </svg>
      </div>

      {/* 3. Bottom quick status details */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
        {['cane_handling', 'milling', 'clarification', 'evaporation', 'crystallization', 'centrifugation'].map((id) => {
          const health = stageHealth[id] || { health_score: 100, label: id };
          const active = activeStage === id;
          return (
            <div 
              key={id}
              onClick={() => onSelectStage(active ? null : id)}
              className="p-2.5 rounded border text-center cursor-pointer transition-all flex flex-col gap-0.5"
              style={{
                background: active ? 'var(--cyan-dim)' : 'var(--bg-card)',
                borderColor: active ? 'var(--cyan)' : 'var(--border)',
                boxShadow: active ? 'var(--shadow-card)' : 'none'
              }}
            >
              <span className="text-[10px] font-bold text-slate-500 uppercase truncate" style={{ color: 'var(--text-secondary)' }}>
                {health.label?.replace('🧪 ', '').replace('⚙️ ', '').replace('🔄 ', '').replace('💨 ', '').replace('💎 ', '').replace('🌾 ', '')}
              </span>
              <span className="mono text-xs font-bold" style={{ color: getStatusColor(id) }}>
                {health.health_score}% Health
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
