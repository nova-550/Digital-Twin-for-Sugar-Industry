import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Sliders, RotateCcw, AlertTriangle, AlertOctagon, CheckCircle, HelpCircle, Activity, ChevronRight, RefreshCw, Cpu } from 'lucide-react';

import { baselineDefaults, inputStructure, parameterCalculations, getParamTitle } from './simulator/constants';
import SimulatorInputs from './simulator/SimulatorInputs';
import SimulatorKPIs from './simulator/SimulatorKPIs';
import SimulatorCascade from './simulator/SimulatorCascade';
import SimulatorWarnings from './simulator/SimulatorWarnings';
import SimulatorDiagnostics from './simulator/SimulatorDiagnostics';

export default function FactorySimulator() {
  const telemetry = useStore((state) => state.telemetry);
  const connected = useStore((state) => state.connected);

  const [tooltip, setTooltip] = useState({ visible: false, text: '', title: '', x: 0, y: 0, below: false });
  const [activeTab, setActiveTab] = useState('cascade');

  const handleMouseEnter = (e, key) => {
    const text = parameterCalculations[key];
    if (!text) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const showBelow = rect.top < 150;
    setTooltip({
      visible: true,
      text,
      title: getParamTitle(key),
      x: rect.left + rect.width / 2,
      y: showBelow ? rect.bottom + 8 : rect.top - 8,
      below: showBelow
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const [liveSync, setLiveSync] = useState(true); // Default to live sync for WOW factor
  const [inputs, setInputs] = useState(baselineDefaults);
  const [results, setResults] = useState(null);
  const [resultsPhysics, setResultsPhysics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lockedParams, setLockedParams] = useState(new Set());
  
  const debounceTimerRef = useRef(null);

  // Sync inputs and results directly from live SCADA WebSocket when liveSync is enabled
  useEffect(() => {
    if (liveSync && telemetry && telemetry.state) {
      const liveInputs = {};
      let hasUpdate = false;
      
      inputStructure.forEach(group => {
        group.params.forEach(param => {
          const liveVal = telemetry.state[group.stage]?.[param.key];
          if (liveVal !== undefined) {
            liveInputs[param.key] = liveVal;
            hasUpdate = true;
          }
        });
      });

      if (hasUpdate) {
        setInputs(liveInputs);
      }
    }
  }, [liveSync, telemetry]);

  // Calls the sandbox simulator API
  const fetchSimulation = async (currentInputs) => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentInputs),
      });

      if (!res.ok) {
        throw new Error(`Simulation request failed: status ${res.status}`);
      }

      const data = await res.json();
      if (data.status === 'success') {
        setResults(data.stages);
        setResultsPhysics(data.stages_physics);
        setError(null);
      } else {
        throw new Error('Simulation failed to compute.');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run simulation only when liveSync is disabled and inputs change
  useEffect(() => {
    if (liveSync) return; // Do not call sandbox simulator if in live sync mode

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSimulation(inputs);
    }, 120);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputs, liveSync]);

  // Fetch initial simulation defaults when liveSync is turned off or on mount
  useEffect(() => {
    if (liveSync) {
      setLockedParams(new Set());
    }
    if (!liveSync) {
      fetchSimulation(inputs);
    }
  }, [liveSync]);

  const handleSliderChange = (key, value) => {
    if (liveSync) return; // Read-only in live sync mode
    setInputs(prev => ({
      ...prev,
      [key]: parseFloat(value)
    }));
    setLockedParams(prev => new Set([...prev, key]));
  };

  const handleReset = () => {
    if (liveSync) return;
    setInputs(baselineDefaults);
    setLockedParams(new Set());
  };

  // Solve for optimal parameter value
  const optimizeParameter = (key, currentInputs = inputs) => {
    let optimalVal = currentInputs[key];
    const feed = currentInputs.cane_feed_rate_tph;

    // Check outputs to run math-based optimization
    const activeRes = (liveSync && telemetry?.state) ? telemetry.state : results;

    switch (key) {
      case 'lime_dosage_kg_tc':
        optimalVal = 0.80; // Solves 7.2 pH target exactly
        break;
      case 'clarification_temp_c':
        optimalVal = 102.0; // Minimal thermal inversion loss
        break;
      case 'supersaturation_coeff':
        optimalVal = 1.15; // Fast crystal growth while avoiding spontaneous false grains
        break;
      case 'centrifuge_speed_rpm':
        optimalVal = 1120.0; // Minimum speed to reach max G-force separation efficiency (99.2%)
        break;
      case 'wash_water_m3_hr':
        optimalVal = 0.8; // Ideal purging film removal
        break;
      case 'imbibition_water_pct':
        optimalVal = 15.0 + (feed - 100.0) * 0.125; // Proportional wash water to feed rate
        break;
      case 'mill_speed_rpm':
        optimalVal = 2.0 + (feed - 100.0) * 0.03; // Match roller RPM speed to tonnage load
        break;
      case 'bagasse_moisture_pct':
        optimalVal = 50.5; // Optimal mechanical compression moisture spec
        break;
      case 'steam_flow_tph': {
        // Solves mass balance: evaporator steam flow needed to hit exactly 62 Brix syrup
        const juiceIn = (activeRes?.clarification?.clarified_juice_tph) || (feed * 0.88);
        const brixIn = (activeRes?.milling?.juice_brix_pct) || 15.0;
        const econ = currentInputs.steam_economy;
        const waterEvap = juiceIn * (1.0 - brixIn / 62.0);
        optimalVal = waterEvap / econ;
        break;
      }
      case 'steam_economy':
        optimalVal = 3.4; // Quintuple effect design balance
        break;
      default:
        break;
    }

    // Apply limits and stepping constraints defined in inputStructure
    let min = 0, max = 100, step = 1;
    for (const group of inputStructure) {
      const param = group.params.find(p => p.key === key);
      if (param) {
        min = param.min;
        max = param.max;
        step = param.step;
        break;
      }
    }

    optimalVal = Math.max(min, Math.min(max, optimalVal));
    const factor = 1 / step;
    optimalVal = Math.round(optimalVal * factor) / factor;

    return optimalVal;
  };

  const handleOptimizeParam = (key) => {
    if (liveSync) return;
    const optVal = optimizeParameter(key);
    setInputs(prev => ({
      ...prev,
      [key]: optVal
    }));
    setLockedParams(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleOptimizeAll = () => {
    if (liveSync) return;
    const newInputs = { ...inputs };
    
    const keysToOptimize = [
      'imbibition_water_pct',
      'mill_speed_rpm',
      'bagasse_moisture_pct',
      'lime_dosage_kg_tc',
      'clarification_temp_c',
      'steam_flow_tph',
      'steam_economy',
      'supersaturation_coeff',
      'centrifuge_speed_rpm',
      'wash_water_m3_hr'
    ];

    keysToOptimize.forEach(key => {
      if (!lockedParams.has(key)) {
        newInputs[key] = optimizeParameter(key, newInputs);
      }
    });

    setInputs(newInputs);
  };

  // Select active values: live telemetry if synced, else sandbox simulation outputs
  const activeResults = (liveSync && telemetry?.state) ? telemetry.state : results;
  const activeResultsPhysics = (liveSync && telemetry?.state_physics) ? telemetry.state_physics : resultsPhysics;

  // Extract alarms dynamically based on active results
  const computeActiveAlarms = () => {
    if (!activeResults) return [];
    
    // In liveSync mode, we show live alarms from telemetry
    if (liveSync && telemetry?.alerts) {
      return telemetry.alerts.map(a => ({
        stage: a.stage_id,
        severity: a.severity,
        message: a.message
      }));
    }

    const alarms = [];
    // Milling
    const imb = activeResults.milling?.imbibition_water_pct ?? 25.0;
    if (imb < 22.0) {
      alarms.push({ stage: 'milling', severity: 'WARNING', message: 'Water spray is too low! We are leaving valuable sugar behind in the waste fiber. (Fix: Increase Imbibition Water)' });
    } else if (imb > 28.0) {
      alarms.push({ stage: 'milling', severity: 'WARNING', message: 'Water spray is too high! The juice is too watery, putting a heavy load on evaporators. (Fix: Decrease Imbibition Water)' });
    }

    // Clarification pH
    const ph = activeResults.clarification?.estimated_ph ?? 7.2;
    if (ph < 6.4) {
      alarms.push({ stage: 'clarification', severity: 'CRITICAL', message: 'Juice is too acidic! The acid is actively destroying the sugar molecules. (Fix: Increase Lime Dosing)' });
    } else if (ph < 6.8) {
      alarms.push({ stage: 'clarification', severity: 'WARNING', message: "Juice is slightly acidic. Dirt and impurities won't settle properly. (Fix: Increase Lime Dosing slightly)" });
    } else if (ph > 8.0) {
      alarms.push({ stage: 'clarification', severity: 'CRITICAL', message: 'Juice is too alkaline! This will cause heavy mineral scale buildup in the heaters. (Fix: Decrease Lime Dosing)' });
    }

    // Evaporation
    const brixOut = activeResults.evaporation?.juice_brix_out_pct ?? 62.0;
    if (brixOut < 57.0) {
      alarms.push({ stage: 'evaporation', severity: 'WARNING', message: 'Syrup is too watery! Crystallization pans will have to work much harder to boil it. (Fix: Increase Steam Flow)' });
    }

    // Crystallization Supersaturation
    const sat = activeResults.crystallization?.supersaturation_coeff ?? 1.15;
    if (sat > 1.28) {
      alarms.push({ stage: 'crystallization', severity: 'CRITICAL', message: "Syrup is too thick! Tiny unwanted 'false crystals' will form and ruin the batch. (Fix: Decrease Supersaturation or adjust vacuum)" });
    } else if (sat < 1.02) {
      alarms.push({ stage: 'crystallization', severity: 'WARNING', message: 'Syrup is too thin! The liquid is actually melting the sugar crystals we already grew. (Fix: Increase Supersaturation)' });
    }

    // Centrifugation Purity
    const purity = activeResults.centrifugation?.final_sugar_purity_pct ?? 99.5;
    if (purity < 99.0) {
      alarms.push({ stage: 'centrifugation', severity: 'CRITICAL', message: 'Sugar purity is too low! The crystals still have brown molasses stuck to them. (Fix: Increase Centrifuge Speed or Wash Water)' });
    }

    return alarms;
  };

  const alarms = computeActiveAlarms();

  // Helper metrics
  const sugarRate = activeResults?.centrifugation?.sugar_tph ?? 0;
  const sugarRatePhysics = activeResultsPhysics?.centrifugation?.sugar_tph ?? 0;
  const sugarPurity = activeResults?.centrifugation?.final_sugar_purity_pct ?? 0;
  const mlExtraction = activeResults?.milling?.mill_extraction_pct ?? 0;
  const mlExtractionPhysics = activeResultsPhysics?.milling?.mill_extraction_pct ?? 0;
  
  // Overall Sugar Recovery: Sugar Produced / Sucrose entering plant in Cane Handling
  const sucroseInCane = activeResults?.cane_handling?.sucrose_tph ?? 1;
  const overallRecovery = sucroseInCane > 0 ? (sugarRate / sucroseInCane) * 100.0 : 0;

  return (
    <div className="flex flex-col gap-6 fade-in">
      {/* Simulation Dashboard Header Banner */}
      <div className="panel flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden" style={{ borderLeft: '4px solid var(--cyan)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-sky-50 border border-sky-200">
            {liveSync ? (
              <Activity size={20} className="text-emerald-600 animate-pulse" />
            ) : (
              <Sliders size={20} className="text-sky-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">Refinery Sandbox Simulator</h2>
              {liveSync ? (
                <span className="badge badge-green flex items-center gap-1 text-[7px] tracking-wider uppercase font-extrabold px-1.5 py-0.5">
                  <span className="pulse-dot green" style={{ width: 4, height: 4 }} /> Live Sync Active
                </span>
              ) : (
                <span className="badge badge-cyan text-[7px] tracking-wider uppercase font-extrabold px-1.5 py-0.5">
                  Sandbox Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-snug">
              {liveSync 
                ? 'Syncing live telemetry parameters in real-time. Disable Live Sync to slide parameters and simulate custom configurations.' 
                : 'Sandbox mode enabled. Adjust parameters below or click Auto-tune triggers to solve for optimal setpoints.'}
            </p>
          </div>
        </div>
        
        {/* Toggle Mode Desk */}
        <div className="flex items-center gap-4">
          
          <label className="inline-flex items-center gap-2 cursor-pointer bg-[var(--border)] px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors hover:bg-slate-100">
            <input 
              type="checkbox" 
              checked={liveSync} 
              onChange={(e) => setLiveSync(e.target.checked)} 
              className="sr-only peer" 
            />
            <span className={`w-2 h-2 rounded-full ${liveSync ? 'bg-emerald-500 shadow-[0_0_6px_var(--green)] animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-[10px] font-extrabold uppercase text-slate-700">Live Sync</span>
            <div className="relative w-8 h-4 bg-slate-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-sky-300 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>

          {!liveSync && (
            <>
              <button
                onClick={handleOptimizeAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase transition-colors hover:bg-emerald-100"
                style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}
              >
                <Cpu size={13} className="animate-pulse" /> Auto-tune all
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--border)] text-xs font-extrabold uppercase transition-colors hover:bg-[var(--cyan-dim)] text-[var(--text-primary)]"
                style={{ border: '1px solid var(--border)' }}
              >
                <RotateCcw size={13} /> Reset defaults
              </button>
            </>
          )}
        </div>
      </div>

      {error && !liveSync && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex gap-2 text-xs">
          <AlertOctagon size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">DCS Physics Engine Fault:</span> {error}. Please reload or verify model connection.
          </div>
        </div>
      )}

      {/* Main Grid: Sliders (Left) vs Simulation Outputs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Input Controller Panel */}
        <SimulatorInputs
          inputs={inputs}
          liveSync={liveSync}
          telemetry={telemetry}
          lockedParams={lockedParams}
          handleSliderChange={handleSliderChange}
          handleOptimizeParam={handleOptimizeParam}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
        />

        {/* Right: Simulated Output Results */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Top Panel: KPIs Grid */}
          <SimulatorKPIs
            sugarRate={sugarRate}
            sugarRatePhysics={sugarRatePhysics}
            sugarPurity={sugarPurity}
            mlExtraction={mlExtraction}
            mlExtractionPhysics={mlExtractionPhysics}
            overallRecovery={overallRecovery}
            liveSync={liveSync}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
          />

          {/* Sub-Tabs: Cascade Flow vs ML Diagnostics */}
          <div className="panel flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('cascade')}
                  className={`text-xs font-extrabold uppercase tracking-wider pb-1 transition-all ${activeTab === 'cascade' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Process Flow Cascade
                </button>
                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className={`text-xs font-extrabold uppercase tracking-wider pb-1 transition-all ${activeTab === 'diagnostics' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  ML Model Diagnostics
                </button>
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {activeTab === 'cascade' ? 'SCADA Flowline View' : 'XAI Diagnostics Desk'}
              </div>
            </div>

            {activeTab === 'cascade' ? (
              activeResults ? (
                <SimulatorCascade
                  activeResults={activeResults}
                  activeResultsPhysics={activeResultsPhysics}
                  liveSync={liveSync}
                  handleMouseEnter={handleMouseEnter}
                  handleMouseLeave={handleMouseLeave}
                />
              ) : (
                <div className="py-24 text-center text-xs text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-sky-400" />
                  Initializing refinery physical simulator...
                </div>
              )
            ) : (
              <SimulatorDiagnostics 
                inputs={inputs} 
                activeResults={activeResults} 
                activeResultsPhysics={activeResultsPhysics} 
              />
            )}
          </div>

          {/* Real-time Warnings Feed */}
          <SimulatorWarnings alarms={alarms} />

        </div>

      </div>

      {/* Floating Calculations Formula Tooltip */}
      {tooltip.visible && (
        <div 
          className="fixed bg-slate-950/95 text-white text-[11px] p-3 rounded-lg shadow-2xl z-[9999] w-72 whitespace-pre-line pointer-events-none transition-all duration-150 border border-slate-800 backdrop-blur-md"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: tooltip.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
        >
          <div className="font-extrabold text-sky-400 mb-1 border-b border-slate-800 pb-1 flex items-center gap-1.5">
            <Cpu size={10} /> {tooltip.title}
          </div>
          <div className="text-slate-300 leading-relaxed font-medium">
            {tooltip.text}
          </div>
        </div>
      )}
      
    </div>
  );
}
