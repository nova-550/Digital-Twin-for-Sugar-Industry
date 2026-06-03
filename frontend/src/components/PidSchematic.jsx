import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Activity, HelpCircle, ArrowRight } from 'lucide-react';
import { parameterCalculations } from './simulator/constants';

const PARAM_LABELS = {
  cane_feed_rate_tph: "Conveyor Feed Rate",
  trash_pct: "Cane Trash Impurity",
  cane_pol_pct: "Sucrose Content",
  cane_brix_pct: "Soluble Solids Brix",
  imbibition_water_pct: "Imbibition Water Ratio",
  mill_speed_rpm: "Roller RPM Speed",
  bagasse_moisture_pct: "Bagasse Moisture Spec",
  lime_dosage_kg_tc: "Lime Milk Dosing",
  clarification_temp_c: "Juice Heating Temp",
  steam_flow_tph: "Heating Steam Flow",
  steam_economy: "Evaporation Economy",
  supersaturation_coeff: "Target Supersaturation",
  vacuum_pressure_mbar: "Pan Vacuum Pressure",
  centrifuge_speed_rpm: "Centrifuge Speed",
  wash_water_m3_hr: "Crystal Wash Water",
  net_cane_tph: "Net Cane Crushed",
  fibre_tph: "Insoluble Fiber Flow",
  sucrose_tph: "Total Sucrose Tonnage",
  cane_purity_pct: "Cane Purity",
  juice_tph: "Raw Juice Flow",
  imbibition_tph: "Imbibition Water Flow",
  mill_extraction_pct: "Milling Extraction",
  juice_brix_pct: "Juice Brix Concentration",
  juice_pol_pct: "Juice Pol Content",
  bagasse_wet_tph: "Wet Bagasse Bypass",
  clarified_juice_tph: "Clarified Juice Tonnage",
  mud_tph: "Settled Mud Flow",
  estimated_ph: "Defecation pH",
  clarified_purity_pct: "Clarified Juice Purity",
  turbidity_reduction_pct: "Turbidity Reduction",
  syrup_out_tph: "Syrup Output Tonnage",
  juice_brix_out_pct: "Syrup Brix (Out)",
  water_evaporated_tph: "Water Evaporated",
  actual_steam_needed_tph: "Boiler Steam Needed",
  massecuite_brix_pct: "Massecuite Brix",
  pan_temp_c: "Boiling Temperature",
  crystal_yield_pct: "Crystal Yield Ratio",
  crystal_tph: "Pure Crystal Flow",
  molasses_tph: "Mother Liquor Molasses",
  massecuite_tph: "Total Massecuite Slurry",
  sugar_tph: "Sugar Production Rate",
  molasses_tph_out: "Separated Molasses Out",
  g_factor: "Centrifuge G-Force",
  separation_efficiency_pct: "Separation Efficiency",
  final_sugar_purity_pct: "Final Sugar Purity",
  overall_recovery: "Overall Sugar Recovery"
};

const PARAM_UNITS = {
  cane_feed_rate_tph: " T/H",
  trash_pct: "%",
  imbibition_water_pct: "%",
  juice_brix_pct: "%",
  estimated_ph: " pH",
  clarified_purity_pct: "%",
  juice_brix_out_pct: "%",
  steam_economy: " econ ratio",
  supersaturation_coeff: " coeff",
  pan_temp_c: "°C",
  g_factor: " G",
  final_sugar_purity_pct: "%"
};

const STAGE_DETAILS = {
  cane_handling: {
    title: "Stage 01: Cane Prep & Conveying",
    description: "Receives raw conveyor sugarcane, removes trash impurities, and shreds stalks before milling juice extraction.",
  },
  milling: {
    title: "Stage 02: Extraction Milling Train",
    description: "Mechanically crushes sugarcane through heavy rollers to extract cane juice, spraying water (imbibition) to wash out remaining sugars.",
  },
  clarification: {
    title: "Stage 03: Lime Defecation Clarifier",
    description: "Heats raw juice and injects lime milk to neutralize acids, causing mud coagulants to settle as waste.",
  },
  evaporation: {
    title: "Stage 04: Evaporation Concentration",
    description: "Boils off excess water across a series of quadruple-effect evaporator vessels, turning clear juice into concentrated thick syrup.",
  },
  crystallization: {
    title: "Stage 05: Vacuum Crystallization Pans",
    description: "Boils heavy concentrated syrup under vacuum to form sugar crystal grains inside a thick molasses slurry (massecuite).",
  },
  centrifugation: {
    title: "Stage 06: Centrifugal Purge Separators",
    description: "Spins massecuite slurry at high velocity (G-force), purging brown liquid molasses to wash and separate grade-purity sugar crystals.",
  }
};

const INSTRUMENT_TAGS = {
  WI: {
    title: "Weight Indicator",
    description: "Raw sugarcane conveyor load cells continuously measuring input mass flow."
  },
  QI: {
    title: "Quality/Analysis Indicator",
    description: "Sensory analysis checking impurity ratios, sucrose purity levels, or chemical settling quality."
  },
  FIC: {
    title: "Flow Indicator Controller",
    description: "Process control loop regulating fluid flow rates (e.g. imbibition wash spray, steam feeds)."
  },
  BI: {
    title: "Brix Indicator",
    description: "Refractometric sensor measuring dissolved sugar solids concentration in solution."
  },
  AIC: {
    title: "Analysis Indicator Controller",
    description: "Continuous analyzer monitoring and regulating chemical parameters (like pH neutralizer feeds)."
  },
  BIC: {
    title: "Brix Indicator Controller",
    description: "Process control loop maintaining dissolved solid concentration targets in syrup."
  },
  PIC: {
    title: "Pressure/Vacuum Indicator Controller",
    description: "Regulates pressure, vacuum levels, or steam economies in evaporation/boiling vessels."
  },
  MIC: {
    title: "Massecuite Indicator Controller",
    description: "Analyzes and controls crystalline supersaturation ratios in boiling massecuite pans."
  },
  SIC: {
    title: "Speed Indicator Controller",
    description: "Monitors centrifuge drum rotor speed and regulates separation G-force values."
  }
};

export default function PidSchematic() {
  const telemetry = useStore((state) => state.telemetry);
  const activeStage = useStore((state) => state.activeStage);
  const selectedParam = useStore((state) => state.selectedParam);
  const selectStage = useStore((state) => state.selectStage);
  const selectParam = useStore((state) => state.selectParam);

  const [hoverInfo, setHoverInfo] = useState(null);
  const [hoveredStage, setHoveredStage] = useState(null);
  const [hoveredTag, setHoveredTag] = useState(null);
  const [hoveredPipe, setHoveredPipe] = useState(null);

  if (!telemetry) return null;

  const { state = {}, stage_health = {} } = telemetry;
  const cane = state.cane_handling || {};
  const mill = state.milling || {};
  const clarif = state.clarification || {};
  const evap = state.evaporation || {};
  const cryst = state.crystallization || {};
  const centr = state.centrifugation || {};

  const getStatusColor = (id) => {
    const status = stageHealth[id]?.status || stage_health[id]?.status;
    switch (status?.toUpperCase()) {
      case 'RED': return 'var(--red)';
      case 'YELLOW': return 'var(--amber)';
      default: return 'var(--green)';
    }
  };

  const getStatusBg = (id) => {
    const status = stageHealth[id]?.status || stage_health[id]?.status;
    switch (status?.toUpperCase()) {
      case 'RED': return 'var(--red-dim)';
      case 'YELLOW': return 'var(--amber-dim)';
      default: return 'rgba(5, 150, 105, 0.04)';
    }
  };

  const stageHealthScore = (id) => {
    return stage_health[id]?.health_score ?? 100;
  };

  const handleStageMouseEnter = (e, stageId) => {
    setHoveredStage(stageId);
    const stage = STAGE_DETAILS[stageId];
    if (!stage) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const showBelow = rect.top < 150;

    const stageState = state[stageId] || {};
    const metricsList = Object.entries(stageState)
      .filter(([key]) => PARAM_LABELS[key])
      .map(([key, val]) => {
        const title = PARAM_LABELS[key];
        const unit = PARAM_UNITS[key] || '';
        const displayVal = typeof val === 'number' ? val.toFixed(2) + unit : val;
        return { label: title, value: displayVal };
      })
      .slice(0, 4);

    setHoverInfo({
      type: 'stage',
      title: stage.title,
      description: stage.description,
      health: stageHealthScore(stageId),
      metrics: metricsList,
      x: rect.left + rect.width / 2,
      y: showBelow ? rect.bottom + 8 : rect.top - 8,
      below: showBelow
    });
  };

  const handleTagMouseEnter = (e, label, tagNum, stageId, paramName) => {
    setHoveredTag(`${stageId}.${paramName}`);
    const tagType = INSTRUMENT_TAGS[label] || { title: label, description: 'Sensor reading' };
    const paramLabel = PARAM_LABELS[paramName] || paramName.replace(/_/g, ' ');
    const val = state[stageId]?.[paramName];
    const unit = PARAM_UNITS[paramName] || '';
    const displayVal = typeof val === 'number' ? val.toFixed(2) + unit : '—';
    const calculation = parameterCalculations[paramName];
    
    const rect = e.currentTarget.getBoundingClientRect();
    const showBelow = rect.top < 150;

    setHoverInfo({
      type: 'tag',
      title: `${tagType.title} (${label}-${tagNum})`,
      paramLabel,
      description: tagType.description,
      calculation,
      value: displayVal,
      x: rect.left + rect.width / 2,
      y: showBelow ? rect.bottom + 8 : rect.top - 8,
      below: showBelow
    });
  };

  const handlePipeMouseEnter = (e, pipeId) => {
    setHoveredPipe(pipeId);
    const rect = e.currentTarget.getBoundingClientRect();
    const showBelow = rect.top < 150;

    let title = '';
    let fluid = '';
    let flowRate = '';
    let extra = '';

    if (pipeId === 'cane_transfer') {
      title = "Sugarcane Conveyor Feed";
      fluid = "Solid shredded sugarcane stalks (dry fiber + raw sugar sap)";
      const rate = state.cane_handling?.cane_feed_rate_tph;
      const trash = state.cane_handling?.trash_pct;
      const netCane = typeof rate === 'number' && typeof trash === 'number' ? rate * (1.0 - trash / 100.0) : 0;
      flowRate = typeof rate === 'number' ? rate.toFixed(1) + " T/H" : "—";
      extra = `Net cane throughput: ${netCane ? netCane.toFixed(1) + " T/H" : "—"}\nFeeds prepared shredded cane stalks directly into the first extraction mill crushing rolls.`;
    } else if (pipeId === 'raw_juice') {
      title = "Raw Mixed Juice Pipeline";
      fluid = "Raw sucrose juice diluted with imbibition spray wash water";
      const rate = state.milling?.juice_tph;
      const brix = state.milling?.juice_brix_pct;
      flowRate = typeof rate === 'number' ? rate.toFixed(1) + " T/H" : "—";
      extra = `Concentration: ${typeof brix === 'number' ? brix.toFixed(1) + "% Brix" : "—"}\nTransports raw extracted juice from multi-roller extraction mills to chemical neutralization.`;
    } else if (pipeId === 'lime_feed') {
      title = "Lime Milk Dosing Feed";
      fluid = "Calcium hydroxide (lime milk) suspension neutralizing reagent";
      const dosage = state.clarification?.lime_dosage_kg_tc;
      flowRate = typeof dosage === 'number' ? dosage.toFixed(2) + " kg/TC" : "—";
      extra = "Continuous chemical reagent feed to neutralize juice acids, aiming for the optimum 7.2 pH target.";
    } else if (pipeId === 'clarified_juice') {
      title = "Clarified Juice Pipeline";
      fluid = "Purified juice with suspended mud particles precipitated out";
      const rate = state.clarification?.clarified_juice_tph;
      const pur = state.clarification?.clarified_purity_pct;
      flowRate = typeof rate === 'number' ? rate.toFixed(1) + " T/H" : "—";
      extra = `Sucrose purity: ${typeof pur === 'number' ? pur.toFixed(1) + "%" : "—"}\nFeeds hot, clear neutralized juice into multiple-effect evaporator vessels.`;
    } else if (pipeId === 'syrup') {
      title = "Concentrated Syrup Pipeline";
      fluid = "Thick, evaporated sugar syrup";
      const rate = state.evaporation?.syrup_out_tph;
      const brix = state.evaporation?.juice_brix_out_pct;
      flowRate = typeof rate === 'number' ? rate.toFixed(1) + " T/H" : "—";
      extra = `Concentration: ${typeof brix === 'number' ? brix.toFixed(1) + "% Brix" : "—"}\nTransports highly concentrated syrup to vacuum pan crystallization.`;
    } else if (pipeId === 'massecuite') {
      title = "Massecuite Slurry Drop Conduit";
      fluid = "Highly viscous mixture of sugar crystals and mother liquor molasses";
      const rate = state.crystallization?.massecuite_tph;
      const brix = state.crystallization?.massecuite_brix_pct;
      flowRate = typeof rate === 'number' ? rate.toFixed(1) + " T/H" : "—";
      extra = `Slurry density: ${typeof brix === 'number' ? brix.toFixed(1) + "% Brix" : "—"}\nDischarges crystallized massecuite mixture to high-speed centrifuge separators.`;
    } else if (pipeId === 'molasses_bypass') {
      title = "Molasses Run-off Pipeline";
      fluid = "Separated brown liquid molasses byproduct (mother liquor)";
      const rate = state.centrifugation?.molasses_tph_out;
      flowRate = typeof rate === 'number' ? rate.toFixed(1) + " T/H" : "—";
      extra = "Diverts purged molasses byproduct from centrifuge baskets for secondary pan boiling or ethanol processing.";
    } else if (pipeId === 'refined_sugar') {
      title = "Refined Sugar Conveyor";
      fluid = "Centrifuged and dried commercial-grade sucrose crystals";
      const rate = state.centrifugation?.sugar_tph;
      const purity = state.centrifugation?.final_sugar_purity_pct;
      flowRate = typeof rate === 'number' ? rate.toFixed(1) + " T/H" : "—";
      extra = `Refined purity: ${typeof purity === 'number' ? purity.toFixed(2) + "%" : "—"}\nTransports raw crystals from centrifugal separation to bagging and storage silos.`;
    }

    setHoverInfo({
      type: 'pipe',
      title,
      fluid,
      flowRate,
      extra,
      x: rect.left + rect.width / 2,
      y: showBelow ? rect.bottom + 8 : rect.top - 8,
      below: showBelow
    });
  };

  const handlePipeMouseLeave = () => {
    setHoveredPipe(null);
    handleHoverMouseLeave();
  };

  const handleHoverMouseLeave = () => {
    setHoverInfo(null);
    setHoveredStage(null);
    setHoveredTag(null);
    setHoveredPipe(null);
  };

  // Helper to draw circular ISA sensor bubble tags
  const renderISATag = (cx, cy, label, tagNum, stageId, paramName) => {
    const isParamTargeted = selectedParam === paramName;
    const isParamHovered = hoveredTag === `${stageId}.${paramName}`;
    const val = state[stageId]?.[paramName];
    const displayVal = typeof val === 'number' 
      ? val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) 
      : '—';

    return (
      <g 
        className="cursor-pointer select-none"
        onClick={(e) => {
          e.stopPropagation();
          selectStage(stageId);
          selectParam(paramName);
        }}
        onMouseEnter={(e) => handleTagMouseEnter(e, label, tagNum, stageId, paramName)}
        onMouseLeave={handleHoverMouseLeave}
      >
        {/* Connection lead line to equipment */}
        <line x1={cx} y1={cy + 16} x2={cx} y2={cy + 34} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="1.5 1.5" />
        
        {/* Ring background */}
        <circle 
          cx={cx} 
          cy={cy} 
          r="16" 
          fill="var(--bg-card)" 
          stroke={isParamTargeted || isParamHovered ? 'var(--cyan)' : 'var(--border)'} 
          strokeWidth={isParamTargeted || isParamHovered ? '2' : '1.2'}
          style={{
            filter: (isParamTargeted || isParamHovered) ? 'drop-shadow(0 0 6px rgba(2, 132, 199, 0.5))' : 'none',
            transition: 'all 0.2s'
          }}
        />
        {/* Tag split line */}
        <line x1={cx - 16} y1={cy} x2={cx + 16} y2={cy} stroke={isParamTargeted || isParamHovered ? 'var(--cyan)' : 'var(--border)'} strokeWidth="0.8" />
        
        {/* Tag Labels */}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-[7.5px] font-extrabold uppercase" fill={isParamTargeted || isParamHovered ? 'var(--cyan)' : 'var(--text-secondary)'}>{label}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="text-[8px] font-bold tracking-tight" fill="var(--text-primary)">{tagNum}</text>
        
        {/* Live numerical indicator box below tag */}
        <rect x={cx - 24} y={cy + 22} width="48" height="12" rx="3" fill="var(--bg-panel)" stroke={isParamTargeted || isParamHovered ? 'var(--cyan)' : 'var(--border)'} strokeWidth="0.8" />
        <text x={cx} y={cy + 31} textAnchor="middle" className="text-[8px] font-bold mono" fill="var(--text-primary)">{displayVal}</text>
      </g>
    );
  };

  const stageHealth = stage_health;

  return (
    <div className="panel flex flex-col gap-4 relative animate-fade-in" style={{ minHeight: 480 }}>
      {/* Schematic Header and Status Indicators */}
      <div className="flex justify-between items-start flex-wrap gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <span className="panel-title mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="pulse-dot green" style={{ width: 10, height: 10 }} />
            ISA-101 Distributed Control System (DCS) P&ID Flowline
          </span>
          <p className="text-xs text-muted" style={{ color: 'var(--text-secondary)' }}>
            Refinery physical schematic models. Hover over plant blocks or tags for live stats, click a block to lock selection, or click tags to stream timeseries.
          </p>
        </div>

        <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1.5"><span className="w-5 h-[3px] bg-sky-500" /> Cane Juice / Water</div>
          <div className="flex items-center gap-1.5"><span className="w-5 h-[3px] bg-amber-500" /> Concentrated Syrup</div>
          <div className="flex items-center gap-1.5"><span className="w-5 h-[3px] bg-red-500" /> Vapor Steam</div>
          <div className="flex items-center gap-1.5"><span className="w-5 h-[3px] bg-violet-500" strokeDasharray="2 1" /> Flocculant / Mud</div>
        </div>
      </div>

      {/* Industrial P&ID interactive SVG Canvas */}
      <div className="overflow-x-auto" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
        <svg 
          viewBox="0 0 1200 380" 
          className="w-full min-w-[1140px] h-auto select-none"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {/* Subtle engineering coordinate grid */}
          <defs>
            <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148,163,184,0.025)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />

          {/* ==================== 1. CANE PREPARATION SECTOR ==================== */}
          <g 
            className="cursor-pointer"
            onClick={() => selectStage('cane_handling')}
            onMouseEnter={(e) => handleStageMouseEnter(e, 'cane_handling')}
            onMouseLeave={handleHoverMouseLeave}
            style={{ opacity: activeStage && activeStage !== 'cane_handling' ? 0.5 : 1, transition: 'all 0.25s' }}
          >
            {/* Sector background bounds */}
            <rect 
              x="15" 
              y="45" 
              width="165" 
              height="300" 
              rx="6" 
              fill={hoveredStage === 'cane_handling' ? 'rgba(16, 185, 129, 0.08)' : getStatusBg('cane_handling')} 
              stroke={activeStage === 'cane_handling' || hoveredStage === 'cane_handling' ? 'var(--cyan)' : 'var(--border)'} 
              strokeWidth={activeStage === 'cane_handling' || hoveredStage === 'cane_handling' ? '1.8' : '0.8'} 
              style={{
                filter: (activeStage === 'cane_handling' || hoveredStage === 'cane_handling') ? 'drop-shadow(0 0 6px rgba(2, 132, 199, 0.2))' : 'none',
                transition: 'all 0.25s'
              }}
            />
            <text x="25" y="65" className="font-bold text-[9px]" fill="var(--text-muted)">01. CANE CONVEYOR</text>
            <text x="140" y="65" className="font-bold text-[9px] mono" fill={getStatusColor('cane_handling')}>{stageHealthScore('cane_handling')}%</text>

            {/* Conveyor graphic */}
            <line x1="25" y1="280" x2="145" y2="200" stroke={hoveredStage === 'cane_handling' ? 'var(--cyan)' : 'var(--text-muted)'} strokeWidth="6" strokeLinecap="round" className="equipment-element" />
            <circle cx="30" cy="283" r="5" fill={hoveredStage === 'cane_handling' ? 'var(--cyan)' : 'var(--text-primary)'} className="equipment-element" />
            <circle cx="140" cy="203" r="5" fill={hoveredStage === 'cane_handling' ? 'var(--cyan)' : 'var(--text-primary)'} className="equipment-element" />

            {/* Shredder Rotor graphics */}
            <g 
              className="equipment-element" 
              style={{
                transform: hoveredStage === 'cane_handling' ? 'rotate(180deg)' : 'rotate(0deg)',
                transformOrigin: '145px 180px',
                transition: 'transform 0.8s ease-in-out'
              }}
            >
              <circle cx="145" cy="180" r="14" fill="none" stroke={hoveredStage === 'cane_handling' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="1.5" strokeDasharray="3 2" className="equipment-element" />
              <line x1="135" y1="180" x2="155" y2="180" stroke={hoveredStage === 'cane_handling' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2" className="equipment-element" />
              <line x1="145" y1="170" x2="145" y2="190" stroke={hoveredStage === 'cane_handling' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2" className="equipment-element" />
            </g>

            {/* Instrument Tags */}
            {renderISATag(50, 110, 'WI', '101', 'cane_handling', 'cane_feed_rate_tph')}
            {renderISATag(125, 110, 'QI', '102', 'cane_handling', 'trash_pct')}
          </g>

          {/* Pipe Conduits: Conveying cane to mill train */}
          <g 
            className="cursor-pointer"
            onMouseEnter={(e) => handlePipeMouseEnter(e, 'cane_transfer')}
            onMouseLeave={handlePipeMouseLeave}
          >
            <line x1="165" y1="180" x2="205" y2="180" stroke="transparent" strokeWidth="12" />
            <line 
              x1="165" 
              y1="180" 
              x2="205" 
              y2="180" 
              stroke={hoveredPipe === 'cane_transfer' ? 'var(--cyan)' : 'var(--text-secondary)'} 
              strokeWidth={hoveredPipe === 'cane_transfer' ? '3.5' : '2.5'} 
              className={`pipe-flow ${hoveredPipe === 'cane_transfer' ? 'pipe-flow-fast glow-cyan' : ''}`}
            />
          </g>

          {/* ==================== 2. EXTRACTION MILL TRAIN ==================== */}
          <g 
            className="cursor-pointer"
            onClick={() => selectStage('milling')}
            onMouseEnter={(e) => handleStageMouseEnter(e, 'milling')}
            onMouseLeave={handleHoverMouseLeave}
            style={{ opacity: activeStage && activeStage !== 'milling' ? 0.5 : 1, transition: 'all 0.25s' }}
          >
            {/* Sector bounds */}
            <rect 
              x="195" 
              y="45" 
              width="180" 
              height="300" 
              rx="6" 
              fill={getStatusBg('milling')} 
              stroke={activeStage === 'milling' || hoveredStage === 'milling' ? 'var(--cyan)' : 'var(--border)'} 
              strokeWidth={activeStage === 'milling' || hoveredStage === 'milling' ? '1.8' : '0.8'} 
              style={{
                filter: (activeStage === 'milling' || hoveredStage === 'milling') ? 'drop-shadow(0 0 6px rgba(2, 132, 199, 0.2))' : 'none',
                transition: 'all 0.25s'
              }}
            />
            <text x="205" y="65" className="font-bold text-[9px]" fill="var(--text-muted)">02. MILLING EXTRACTOR</text>
            <text x="340" y="65" className="font-bold text-[9px] mono" fill={getStatusColor('milling')}>{stageHealthScore('milling')}%</text>

            {/* Three Rollers Gear configuration */}
            <g 
              transform="translate(225, 180)" 
              className="equipment-element"
              style={{
                transform: hoveredStage === 'milling' ? 'translate(225px, 180px) rotate(15deg)' : 'translate(225px, 180px) rotate(0deg)',
                transformOrigin: '45px 37px',
                transition: 'transform 0.6s ease'
              }}
            >
              <circle cx="45" cy="20" r="22" fill="none" stroke={hoveredStage === 'milling' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="3" className="equipment-element" />
              <circle cx="45" cy="20" r="4" fill={hoveredStage === 'milling' ? 'var(--cyan)' : 'var(--text-primary)'} className="equipment-element" />
              <circle cx="20" cy="54" r="22" fill="none" stroke={hoveredStage === 'milling' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="3" className="equipment-element" />
              <circle cx="20" cy="54" r="4" fill={hoveredStage === 'milling' ? 'var(--cyan)' : 'var(--text-primary)'} className="equipment-element" />
              <circle cx="70" cy="54" r="22" fill="none" stroke={hoveredStage === 'milling' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="3" className="equipment-element" />
              <circle cx="70" cy="54" r="4" fill={hoveredStage === 'milling' ? 'var(--cyan)' : 'var(--text-primary)'} className="equipment-element" />
              <path d="M 45,20 L 20,54 L 70,54 Z" fill="none" stroke={hoveredStage === 'milling' ? 'var(--cyan)' : 'var(--border)'} strokeWidth="1.5" className="equipment-element" />
            </g>

            {/* Spray Header for Imbibition Water */}
            <line x1="240" y1="140" x2="280" y2="140" stroke={hoveredStage === 'milling' ? 'var(--cyan)' : '#0ea5e9'} strokeWidth="2" className="equipment-element" />
            <path d="M 280,140 L 290,152 M 280,140 L 292,143 M 280,140 L 292,137" stroke={hoveredStage === 'milling' ? 'var(--cyan)' : '#0ea5e9'} strokeWidth="1.2" className="equipment-element" />
            <text x="220" y="132" className="text-[7.5px] font-bold text-sky-600">FIC-102 SPRAY</text>

            {/* Instrument Tags */}
            {renderISATag(230, 100, 'FIC', '102', 'milling', 'imbibition_water_pct')}
            {renderISATag(315, 100, 'BI', '103', 'milling', 'juice_brix_pct')}
          </g>

          {/* Diluted Juice pipeline to clarification tank */}
          <g 
            className="cursor-pointer"
            onMouseEnter={(e) => handlePipeMouseEnter(e, 'raw_juice')}
            onMouseLeave={handlePipeMouseLeave}
          >
            <path d="M 295,256 L 295,310 L 415,310" stroke="transparent" strokeWidth="12" fill="none" />
            <path 
              d="M 295,256 L 295,310 L 415,310" 
              stroke={hoveredPipe === 'raw_juice' ? 'var(--cyan)' : '#0284c7'} 
              strokeWidth={hoveredPipe === 'raw_juice' ? '4.5' : '3.2'} 
              fill="none" 
              className={`pipe-flow ${hoveredPipe === 'raw_juice' ? 'pipe-flow-fast glow-cyan' : ''}`}
            />
            <circle cx="350" cy="310" r="3.5" fill={hoveredPipe === 'raw_juice' ? 'var(--cyan)' : '#0ea5e9'} className="animate-ping" style={{ animationDuration: '1.2s' }} />
          </g>

          {/* ==================== 3. DEFECATION CLARIFIER ==================== */}
          <g 
            className="cursor-pointer"
            onClick={() => selectStage('clarification')}
            onMouseEnter={(e) => handleStageMouseEnter(e, 'clarification')}
            onMouseLeave={handleHoverMouseLeave}
            style={{ opacity: activeStage && activeStage !== 'clarification' ? 0.5 : 1, transition: 'all 0.25s' }}
          >
            {/* Sector bounds */}
            <rect 
              x="390" 
              y="45" 
              width="180" 
              height="300" 
              rx="6" 
              fill={hoveredStage === 'clarification' ? 'rgba(139, 92, 246, 0.08)' : getStatusBg('clarification')} 
              stroke={activeStage === 'clarification' || hoveredStage === 'clarification' ? 'var(--cyan)' : 'var(--border)'} 
              strokeWidth={activeStage === 'clarification' || hoveredStage === 'clarification' ? '1.8' : '0.8'} 
              style={{
                filter: (activeStage === 'clarification' || hoveredStage === 'clarification') ? 'drop-shadow(0 0 6px rgba(2, 132, 199, 0.2))' : 'none',
                transition: 'all 0.25s'
              }}
            />
            <text x="400" y="65" className="font-bold text-[9px]" fill="var(--text-muted)">03. LIME DEFECATION</text>
            <text x="535" y="65" className="font-bold text-[9px] mono" fill={getStatusColor('clarification')}>{stageHealthScore('clarification')}%</text>

            {/* Settler Reactor Vessel */}
            <g 
              transform="translate(440, 165)" 
              className="equipment-element"
              style={{
                transform: hoveredStage === 'clarification' ? 'translate(440px, 165px) scale(1.02)' : 'translate(440px, 165px) scale(1)',
                transformOrigin: '40px 60px',
                transition: 'transform 0.4s ease'
              }}
            >
              <rect x="0" y="15" width="80" height="75" fill="none" stroke={hoveredStage === 'clarification' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2.5" className="equipment-element" />
              <path d="M 0,90 L 40,120 L 80,90" fill="none" stroke={hoveredStage === 'clarification' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2.5" className="equipment-element" />
              <g
                style={{
                  transform: hoveredStage === 'clarification' ? 'rotate(8deg)' : 'rotate(0deg)',
                  transformOrigin: '40px 65px',
                  transition: 'transform 0.5s ease'
                }}
              >
                <line x1="40" y1="25" x2="40" y2="105" stroke={hoveredStage === 'clarification' ? 'var(--cyan)' : 'var(--border)'} strokeWidth="1.5" className="equipment-element" />
                <line x1="15" y1="50" x2="65" y2="50" stroke={hoveredStage === 'clarification' ? 'var(--cyan)' : 'var(--border)'} strokeWidth="1.5" className="equipment-element" />
                <line x1="20" y1="80" x2="60" y2="80" stroke={hoveredStage === 'clarification' ? 'var(--cyan)' : 'var(--border)'} strokeWidth="1.5" className="equipment-element" />
              </g>
            </g>

            {/* Flocculation Lime feed line */}
            <g
              className="cursor-pointer"
              onMouseEnter={(e) => handlePipeMouseEnter(e, 'lime_feed')}
              onMouseLeave={handlePipeMouseLeave}
            >
              <path d="M 420,150 L 440,180" stroke="transparent" strokeWidth="12" fill="none" />
              <path 
                d="M 420,150 L 440,180" 
                stroke={hoveredPipe === 'lime_feed' ? 'var(--cyan)' : '#8b5cf6'} 
                strokeWidth={hoveredPipe === 'lime_feed' ? '3.2' : '2'} 
                strokeDasharray="3 2.5" 
                className={`pipe-flow ${hoveredPipe === 'lime_feed' ? 'pipe-flow-fast glow-purple' : ''}`}
              />
              <circle cx="420" cy="146" r="4.5" fill={hoveredPipe === 'lime_feed' ? 'var(--cyan)' : '#8b5cf6'} className="equipment-element" />
            </g>

            {/* Instrument Tags */}
            {renderISATag(425, 100, 'AIC', '201', 'clarification', 'estimated_ph')}
            {renderISATag(515, 100, 'QI', '202', 'clarification', 'clarified_purity_pct')}
          </g>

          {/* Overflow pipeline conveying clear clarified juice */}
          <g 
            className="cursor-pointer"
            onMouseEnter={(e) => handlePipeMouseEnter(e, 'clarified_juice')}
            onMouseLeave={handlePipeMouseLeave}
          >
            <path d="M 520,210 L 600,210" stroke="transparent" strokeWidth="12" fill="none" />
            <path 
              d="M 520,210 L 600,210" 
              stroke={hoveredPipe === 'clarified_juice' ? 'var(--cyan)' : '#0284c7'} 
              strokeWidth={hoveredPipe === 'clarified_juice' ? '4.5' : '3.2'} 
              fill="none"
              className={`pipe-flow ${hoveredPipe === 'clarified_juice' ? 'pipe-flow-fast glow-cyan' : ''}`}
            />
          </g>

          {/* ==================== 4. QUINTUPLE EVAPORATION ==================== */}
          <g 
            className="cursor-pointer"
            onClick={() => selectStage('evaporation')}
            onMouseEnter={(e) => handleStageMouseEnter(e, 'evaporation')}
            onMouseLeave={handleHoverMouseLeave}
            style={{ opacity: activeStage && activeStage !== 'evaporation' ? 0.5 : 1, transition: 'all 0.25s' }}
          >
            {/* Sector bounds */}
            <rect 
              x="585" 
              y="45" 
              width="220" 
              height="300" 
              rx="6" 
              fill={hoveredStage === 'evaporation' ? 'rgba(217, 119, 6, 0.08)' : getStatusBg('evaporation')} 
              stroke={activeStage === 'evaporation' || hoveredStage === 'evaporation' ? 'var(--cyan)' : 'var(--border)'} 
              strokeWidth={activeStage === 'evaporation' || hoveredStage === 'evaporation' ? '1.8' : '0.8'} 
              style={{
                filter: (activeStage === 'evaporation' || hoveredStage === 'evaporation') ? 'drop-shadow(0 0 6px rgba(2, 132, 199, 0.2))' : 'none',
                transition: 'all 0.25s'
              }}
            />
            <text x="595" y="65" className="font-bold text-[9px]" fill="var(--text-muted)">04. THERMAL CONCENTRATION</text>
            <text x="765" y="65" className="font-bold text-[9px] mono" fill={getStatusColor('evaporation')}>{stageHealthScore('evaporation')}%</text>

            {/* Evaporator Vessels Columns in series */}
            <g transform="translate(605, 180)" className="equipment-element">
              <rect x="0" y="0" width="30" height="80" rx="4" fill="none" stroke={hoveredStage === 'evaporation' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2.5" className="equipment-element" />
              <line x1="0" y1="40" x2="30" y2="40" stroke={hoveredStage === 'evaporation' ? 'var(--cyan)' : 'var(--border)'} strokeWidth="1.5" className="equipment-element" />
            </g>
            <g transform="translate(660, 180)" className="equipment-element">
              <rect x="0" y="0" width="30" height="80" rx="4" fill="none" stroke={hoveredStage === 'evaporation' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2.5" className="equipment-element" />
              <line x1="0" y1="40" x2="30" y2="40" stroke={hoveredStage === 'evaporation' ? 'var(--cyan)' : 'var(--border)'} strokeWidth="1.5" className="equipment-element" />
            </g>
            <g transform="translate(715, 180)" className="equipment-element">
              <rect x="0" y="0" width="30" height="80" rx="4" fill="none" stroke={hoveredStage === 'evaporation' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2.5" className="equipment-element" />
              <line x1="0" y1="40" x2="30" y2="40" stroke={hoveredStage === 'evaporation' ? 'var(--cyan)' : 'var(--border)'} strokeWidth="1.5" className="equipment-element" />
            </g>

            {/* Vapor loops */}
            <path d="M 635,195 L 660,195" stroke={hoveredStage === 'evaporation' ? 'var(--cyan)' : 'var(--red)'} strokeWidth="2" className="equipment-element" />
            <path d="M 690,195 L 715,195" stroke={hoveredStage === 'evaporation' ? 'var(--cyan)' : 'var(--red)'} strokeWidth="2" className="equipment-element" />
            <path 
              d="M 745,195 L 775,195 L 775,230" 
              stroke={hoveredStage === 'evaporation' ? 'var(--cyan)' : 'var(--red)'} 
              strokeWidth="2" 
              strokeDasharray="3 2" 
              className={`equipment-element ${hoveredStage === 'evaporation' ? 'pipe-flow-fast glow-red' : ''}`}
            />

            {/* Instrument Tags */}
            {renderISATag(625, 100, 'BIC', '301', 'evaporation', 'juice_brix_out_pct')}
            {renderISATag(730, 100, 'PIC', '302', 'evaporation', 'steam_economy')}
          </g>

          {/* Hot thick syrup flowline to boiling pan */}
          <g 
            className="cursor-pointer"
            onMouseEnter={(e) => handlePipeMouseEnter(e, 'syrup')}
            onMouseLeave={handlePipeMouseLeave}
          >
            <path d="M 735,240 L 835,240" stroke="transparent" strokeWidth="12" fill="none" />
            <path 
              d="M 735,240 L 835,240" 
              stroke={hoveredPipe === 'syrup' ? 'var(--cyan)' : '#d97706'} 
              strokeWidth={hoveredPipe === 'syrup' ? '4.5' : '3.2'} 
              fill="none"
              className={`pipe-flow ${hoveredPipe === 'syrup' ? 'pipe-flow-fast glow-amber' : ''}`}
            />
          </g>

          {/* ==================== 5. VACUUM PAN BOILING ==================== */}
          <g 
            className="cursor-pointer"
            onClick={() => selectStage('crystallization')}
            onMouseEnter={(e) => handleStageMouseEnter(e, 'crystallization')}
            onMouseLeave={handleHoverMouseLeave}
            style={{ opacity: activeStage && activeStage !== 'crystallization' ? 0.5 : 1, transition: 'all 0.25s' }}
          >
            {/* Sector bounds */}
            <rect 
              x="820" 
              y="45" 
              width="180" 
              height="300" 
              rx="6" 
              fill={hoveredStage === 'crystallization' ? 'rgba(6, 182, 212, 0.08)' : getStatusBg('crystallization')} 
              stroke={activeStage === 'crystallization' || hoveredStage === 'crystallization' ? 'var(--cyan)' : 'var(--border)'} 
              strokeWidth={activeStage === 'crystallization' || hoveredStage === 'crystallization' ? '1.8' : '0.8'} 
              style={{
                filter: (activeStage === 'crystallization' || hoveredStage === 'crystallization') ? 'drop-shadow(0 0 6px rgba(2, 132, 199, 0.2))' : 'none',
                transition: 'all 0.25s'
              }}
            />
            <text x="830" y="65" className="font-bold text-[9px]" fill="var(--text-muted)">05. CRYSTALLIZER PANS</text>
            <text x="965" y="65" className="font-bold text-[9px] mono" fill={getStatusColor('crystallization')}>{stageHealthScore('crystallization')}%</text>

            {/* Vacuum crystallization dome reactor */}
            <g 
              transform="translate(870, 165)" 
              className="equipment-element"
              style={{
                transform: hoveredStage === 'crystallization' ? 'translate(870px, 165px) scale(1.02)' : 'translate(870px, 165px) scale(1)',
                transformOrigin: '40px 55px',
                transition: 'transform 0.4s ease'
              }}
            >
              <path d="M 10,25 C 10,0 70,0 70,25" fill="none" stroke={hoveredStage === 'crystallization' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2.5" className="equipment-element" />
              <rect x="10" y="25" width="60" height="65" fill="none" stroke={hoveredStage === 'crystallization' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2.5" className="equipment-element" />
              <path d="M 10,90 L 40,110 L 70,90" fill="none" stroke={hoveredStage === 'crystallization' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2.5" className="equipment-element" />
              {/* Internal steam boiling calandria coils - pulse on hover! */}
              <path d="M 20,60 Q 30,50 40,60 T 60,60" fill="none" stroke={hoveredStage === 'crystallization' ? 'var(--cyan)' : '#ef4444'} strokeWidth={hoveredStage === 'crystallization' ? '1.8' : '1.2'} className="equipment-element" />
              <path d="M 20,72 Q 30,62 40,72 T 60,72" fill="none" stroke={hoveredStage === 'crystallization' ? 'var(--cyan)' : '#ef4444'} strokeWidth={hoveredStage === 'crystallization' ? '1.8' : '1.2'} className="equipment-element" />
            </g>

            {/* Instrument Tags */}
            {renderISATag(855, 100, 'MIC', '401', 'crystallization', 'supersaturation_coeff')}
            {renderISATag(945, 100, 'PIC', '402', 'crystallization', 'pan_temp_c')}
          </g>

          {/* Heavy sucrose/molasses massecuite drop line */}
          <g 
            className="cursor-pointer"
            onMouseEnter={(e) => handlePipeMouseEnter(e, 'massecuite')}
            onMouseLeave={handlePipeMouseLeave}
          >
            <path d="M 940,256 L 940,290 L 1035,290" stroke="transparent" strokeWidth="12" fill="none" />
            <path 
              d="M 940,256 L 940,290 L 1035,290" 
              stroke={hoveredPipe === 'massecuite' ? 'var(--cyan)' : '#92400e'} 
              strokeWidth={hoveredPipe === 'massecuite' ? '5.5' : '4.2'} 
              fill="none"
              className={`pipe-flow ${hoveredPipe === 'massecuite' ? 'pipe-flow-fast glow-amber' : ''}`}
            />
          </g>

          {/* ==================== 6. BATCH CENTRIFUGALS ==================== */}
          <g 
            className="cursor-pointer"
            onClick={() => selectStage('centrifugation')}
            onMouseEnter={(e) => handleStageMouseEnter(e, 'centrifugation')}
            onMouseLeave={handleHoverMouseLeave}
            style={{ opacity: activeStage && activeStage !== 'centrifugation' ? 0.5 : 1, transition: 'all 0.25s' }}
          >
            {/* Sector bounds */}
            <rect 
              x="1015" 
              y="45" 
              width="170" 
              height="300" 
              rx="6" 
              fill={hoveredStage === 'centrifugation' ? 'rgba(239, 68, 68, 0.08)' : getStatusBg('centrifugation')} 
              stroke={activeStage === 'centrifugation' || hoveredStage === 'centrifugation' ? 'var(--cyan)' : 'var(--border)'} 
              strokeWidth={activeStage === 'centrifugation' || hoveredStage === 'centrifugation' ? '1.8' : '0.8'} 
              style={{
                filter: (activeStage === 'centrifugation' || hoveredStage === 'centrifugation') ? 'drop-shadow(0 0 6px rgba(2, 132, 199, 0.2))' : 'none',
                transition: 'all 0.25s'
              }}
            />
            <text x="1025" y="65" className="font-bold text-[9px]" fill="var(--text-muted)">06. DECANTER CENTRIFUGE</text>
            <text x="1150" y="65" className="font-bold text-[9px] mono" fill={getStatusColor('centrifugation')}>{stageHealthScore('centrifugation')}%</text>

            {/* Spinner machine basket */}
            <g 
              transform="translate(1065, 175)" 
              className="equipment-element"
              style={{
                transform: hoveredStage === 'centrifugation' ? 'translate(1065px, 175px) scale(1.02)' : 'translate(1065px, 175px) scale(1)',
                transformOrigin: '35px 35px',
                transition: 'transform 0.4s ease'
              }}
            >
              <rect x="0" y="0" width="70" height="70" fill="none" stroke={hoveredStage === 'centrifugation' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2.5" className="equipment-element" />
              {/* Rotating inner perforated basket */}
              <g
                style={{
                  transform: hoveredStage === 'centrifugation' ? 'rotate(90deg)' : 'rotate(0deg)',
                  transformOrigin: '35px 35px',
                  transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <rect x="10" y="10" width="50" height="50" fill="none" stroke={hoveredStage === 'centrifugation' ? 'var(--cyan)' : 'var(--text-muted)'} strokeWidth="1.5" strokeDasharray="3 1.5" className="equipment-element" />
                <line x1="35" y1="0" x2="35" y2="70" stroke={hoveredStage === 'centrifugation' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="2" className="equipment-element" />
                <line x1="15" y1="35" x2="55" y2="35" stroke={hoveredStage === 'centrifugation' ? 'var(--cyan)' : 'var(--text-secondary)'} strokeWidth="1.5" className="equipment-element" />
              </g>
            </g>

            {/* Molasses bypass pipe */}
            <g 
              className="cursor-pointer"
              onMouseEnter={(e) => handlePipeMouseEnter(e, 'molasses_bypass')}
              onMouseLeave={handlePipeMouseLeave}
            >
              <path d="M 1100,245 L 1100,270 L 1150,270 M 1150,270 L 1150,335" stroke="transparent" strokeWidth="12" fill="none" />
              <path 
                d="M 1100,245 L 1100,270 L 1150,270 M 1150,270 L 1150,335" 
                stroke={hoveredPipe === 'molasses_bypass' ? 'var(--cyan)' : 'var(--purple)'} 
                strokeWidth={hoveredPipe === 'molasses_bypass' ? '2.5' : '1.5'} 
                strokeDasharray="3 2" 
                fill="none" 
                className={`pipe-flow ${hoveredPipe === 'molasses_bypass' ? 'pipe-flow-fast glow-purple' : ''}`}
              />
            </g>

            {/* Instrument Tags */}
            {renderISATag(1050, 100, 'SIC', '501', 'centrifugation', 'g_factor')}
            {renderISATag(1135, 100, 'QI', '502', 'centrifugation', 'final_sugar_purity_pct')}
          </g>

          {/* Dry Sugar Conveying Discharge lines */}
          <g 
            className="cursor-pointer"
            onMouseEnter={(e) => handlePipeMouseEnter(e, 'refined_sugar')}
            onMouseLeave={handlePipeMouseLeave}
          >
            <path d="M 1100,265 L 1100,320 L 1175,320" stroke="transparent" strokeWidth="12" fill="none" />
            <path 
              d="M 1100,265 L 1100,320 L 1175,320" 
              stroke={hoveredPipe === 'refined_sugar' ? 'var(--cyan)' : 'var(--amber)'} 
              strokeWidth={hoveredPipe === 'refined_sugar' ? '4.5' : '3'} 
              fill="none"
              className={`pipe-flow ${hoveredPipe === 'refined_sugar' ? 'pipe-flow-fast glow-amber' : ''}`}
            />
            <path d="M 1175,320 L 1167,316 M 1175,320 L 1167,324" stroke={hoveredPipe === 'refined_sugar' ? 'var(--cyan)' : 'var(--amber)'} strokeWidth="2" className="equipment-element" />
          </g>
          <text x="1108" y="336" className="text-[8px] font-extrabold text-amber-700" fill="var(--amber)">REFINED SUGAR OUTPUT</text>

        </svg>
      </div>

      {/* Floating P&ID Info Tooltip */}
      {hoverInfo && (
        <div 
          className="fixed bg-slate-950/95 text-white text-[11px] p-3 rounded-lg shadow-2xl z-[9999] w-72 whitespace-pre-line pointer-events-none transition-all duration-150 border border-slate-800 backdrop-blur-md"
          style={{
            left: hoverInfo.x,
            top: hoverInfo.y,
            transform: hoverInfo.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
        >
          {hoverInfo.type === 'stage' ? (
            <div>
              <div className="font-extrabold text-sky-400 mb-1 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Activity size={10} className="text-sky-400" /> {hoverInfo.title}</span>
                <span className="text-[9px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 rounded font-bold">Health: {hoverInfo.health}%</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-medium mb-2">{hoverInfo.description}</p>
              <div className="border-t border-slate-900 pt-1.5 mt-1">
                <span className="font-extrabold text-[8.5px] uppercase tracking-wider text-slate-500 block mb-1">Key Live Metrics</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9.5px]">
                  {hoverInfo.metrics.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800/30">
                      <span className="text-slate-400 font-bold truncate max-w-[80px]" title={m.label}>{m.label}:</span>
                      <span className="mono font-bold text-sky-300 ml-1 shrink-0">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : hoverInfo.type === 'tag' ? (
            <div>
              <div className="font-extrabold text-sky-400 mb-1 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <HelpCircle size={10} /> {hoverInfo.title}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Sensor: {hoverInfo.paramLabel}
              </div>
              <p className="text-slate-300 leading-relaxed font-medium mb-2">{hoverInfo.description}</p>
              {hoverInfo.calculation && (
                <div className="border-t border-slate-900 pt-1.5 mt-1 mb-2">
                  <span className="font-extrabold text-[8px] uppercase tracking-wider text-amber-400 block mb-1">Calculation & Formula</span>
                  <div className="bg-amber-950/20 border border-amber-900/30 px-1.5 py-1 rounded text-slate-300 font-medium text-[9px] leading-tight mono">
                    {hoverInfo.calculation}
                  </div>
                </div>
              )}
              <div className="border-t border-slate-900 pt-1.5 mt-1 flex justify-between items-baseline">
                <span className="font-extrabold text-[8.5px] uppercase tracking-wider text-slate-500">Live Reading</span>
                <span className="mono font-extrabold text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded">{hoverInfo.value}</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="font-extrabold text-sky-400 mb-1 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <ArrowRight size={10} className="text-sky-400" /> {hoverInfo.title}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Fluid Composition
              </div>
              <p className="text-slate-400 text-[9.5px] leading-relaxed mb-1">{hoverInfo.fluid}</p>
              <p className="text-slate-300 leading-relaxed font-medium mb-2 whitespace-pre-wrap">{hoverInfo.extra}</p>
              <div className="border-t border-slate-900 pt-1.5 mt-1 flex justify-between items-baseline">
                <span className="font-extrabold text-[8.5px] uppercase tracking-wider text-slate-500">Live Flow Rate</span>
                <span className="mono font-extrabold text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded">{hoverInfo.flowRate}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
