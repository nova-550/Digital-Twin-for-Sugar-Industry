import React from 'react';
import { useStore } from '../store/useStore';
import { Sliders, RotateCcw, AlertTriangle, HelpCircle } from 'lucide-react';

export default function OverridePanel() {
  const activeStage = useStore((state) => state.activeStage);
  const telemetry = useStore((state) => state.telemetry);
  const overrides = useStore((state) => state.overrides);
  const sendOverride = useStore((state) => state.sendOverride);
  const clearOverrides = useStore((state) => state.clearOverrides);

  if (!activeStage || !telemetry) {
    return (
      <div className="panel flex flex-col items-center justify-center text-center p-8 h-full" style={{ minHeight: 320 }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--cyan-dim)', border: '1px solid var(--border)' }}>
          <Sliders size={18} style={{ color: 'var(--cyan)' }} />
        </div>
        <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-primary)' }}>Override Controller Desk</h4>
        <p className="text-[11px] text-muted max-w-[200px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Select any production sector from the P&ID schematic above to open manual loop setpoint overrides.
        </p>
      </div>
    );
  }

  const stageLabel = activeStage.replace('_', ' ').toUpperCase();
  const currentOverrides = overrides[activeStage] || {};
  const currentState = telemetry.state?.[activeStage] || {};

  // Slider controls structure mapped to each of the 6 stages
  const stageControls = {
    cane_handling: [
      { param: 'cane_feed_rate_tph', label: 'Conveyor Feed Rate', min: 100, max: 300, step: 5, unit: 'T/H', desc: 'Regulates net raw sugarcane tonnage entering the plant conveyances.' },
      { param: 'trash_pct', label: 'Cane Trash Impurity', min: 0.5, max: 10.0, step: 0.1, unit: '%', desc: 'Simulates raw cane cleanliness before screening.' }
    ],
    milling: [
      { param: 'imbibition_water_pct', label: 'Imbibition Water Ratio', min: 15.0, max: 40.0, step: 0.5, unit: '%', desc: 'Controls dilution water spray ratio. High values wash sugar but strain evaporators.' },
      { param: 'mill_speed_rpm', label: 'Roller RPM Speed', min: 2.0, max: 8.0, step: 0.1, unit: 'RPM', desc: 'Controls rotation velocity of the crushing milling gear.' },
      { param: 'bagasse_moisture_pct', label: 'Hydraulic Pressure (Moisture)', min: 40.0, max: 60.0, step: 0.5, unit: '%', desc: 'Simulates roller squeezer hydraulic compression performance.' }
    ],
    clarification: [
      { param: 'lime_dosage_kg_tc', label: 'Lime Milk Dosing', min: 0.4, max: 1.6, step: 0.02, unit: 'kg/TC', desc: 'Regulates calcium oxide buffer chemical addition. Targets 7.2 pH optimum.' },
      { param: 'clarification_temp_c', label: 'Heater Thermal Temperature', min: 85.0, max: 115.0, step: 0.5, unit: '°C', desc: 'Regulates juice heating exchanger outlet temperature.' }
    ],
    evaporation: [
      { param: 'steam_flow_tph', label: 'Heating Steam Flow', min: 20.0, max: 60.0, step: 0.5, unit: 'T/H', desc: 'Regulates primary calandria boiler steam delivery.' },
      { param: 'steam_economy', label: 'Quintuple Effect Economy', min: 2.5, max: 4.5, step: 0.1, unit: 'ratio', desc: 'Calibrates internal heat transfer efficiency.' }
    ],
    crystallization: [
      { param: 'supersaturation_coeff', label: 'Target Supersaturation', min: 0.90, max: 1.40, step: 0.01, unit: 'coeff', desc: 'Regulates boiling sugar syrup concentration. Bounded between dissolving and spontaneous nucleating zones.' },
      { param: 'vacuum_pressure_mbar', label: 'Pan Condenser Vacuum', min: 40.0, max: 100.0, step: 1, unit: 'mbar', desc: 'Regulates absolute vacuum draft to drop sugar boiling points.' }
    ],
    centrifugation: [
      { param: 'centrifuge_speed_rpm', label: 'Rotor Basket Speed', min: 800.0, max: 1400.0, step: 10, unit: 'RPM', desc: 'Regulates rotation speed to generate centrifugal G-Force separation.' },
      { param: 'wash_water_m3_hr', label: 'Crystals Purge Wash Water', min: 0.2, max: 2.0, step: 0.1, unit: 'm³/H', desc: 'Regulates water volume sprayed inside rotating decanter baskets.' }
    ]
  };

  const controls = stageControls[activeStage] || [];

  const handleSliderChange = (param, value) => {
    sendOverride(activeStage, param, value);
  };

  // Safe checks to trigger warn bounds in sliders
  const isValueUnsafe = (param, val) => {
    if (param === 'estimated_ph' || param === 'lime_dosage_kg_tc') {
      const ph = currentState.estimated_ph;
      return ph < 6.4 || ph > 8.0;
    }
    if (param === 'imbibition_water_pct') return val < 22.0 || val > 28.0;
    if (param === 'supersaturation_coeff') return val > 1.28 || val < 1.02;
    return false;
  };

  return (
    <div className="panel flex flex-col justify-between h-full" style={{ minHeight: 320 }}>
      {/* Panel Header */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="panel-title mb-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <Sliders size={12} className="text-sky-500" />
              Manual Override: {stageLabel}
            </span>
            <p className="text-[10px] text-slate-500 tracking-tight">Manual SCADA setpoint overrides bypass automated PLC algorithms.</p>
          </div>
          <button 
            onClick={clearOverrides}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--border)] text-[9px] font-extrabold uppercase transition-colors hover:bg-[var(--cyan-dim)]"
            style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <RotateCcw size={10} /> Auto-Loops
          </button>
        </div>

        <div className="divider opacity-30 my-2" />

        {/* Sliders Grid */}
        <div className="flex flex-col gap-4 mt-3">
          {controls.map((ctrl) => {
            const currentVal = currentOverrides[ctrl.param] !== undefined 
              ? currentOverrides[ctrl.param] 
              : (currentState[ctrl.param] ?? ctrl.min);
            
            const isManual = currentOverrides[ctrl.param] !== undefined;
            const isUnsafe = isValueUnsafe(ctrl.param, currentVal);

            return (
              <div key={ctrl.param} className="flex flex-col gap-1.5 p-3 rounded-lg border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{ctrl.label}</span>
                    {isManual && <span className="text-[8px] uppercase tracking-wider font-extrabold px-1 bg-amber-100 text-amber-700 rounded border border-amber-300">Manual</span>}
                  </div>
                  <span className="mono text-xs font-bold" style={{ color: isUnsafe ? 'var(--red)' : 'var(--cyan)' }}>
                    {currentVal.toFixed(ctrl.step % 1 === 0 ? 0 : 2)} <span className="text-[9px] text-slate-400 font-semibold">{ctrl.unit}</span>
                  </span>
                </div>

                <div className="flex gap-4 items-center">
                  <input
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step}
                    value={currentVal}
                    onChange={(e) => handleSliderChange(ctrl.param, e.target.value)}
                    className="flex-1 h-1.5 rounded-full cursor-pointer accent-sky-600"
                    style={{ background: 'var(--border)' }}
                  />
                </div>

                {isUnsafe && (
                  <div className="flex items-start gap-1 text-[9px] text-red-600 font-semibold mt-1">
                    <AlertTriangle size={10} className="mt-0.5" />
                    <span>Warning: Overridden setpoint pushes downstream variables into alert limits!</span>
                  </div>
                )}
                
                <p className="text-[9px] text-slate-500 leading-snug mt-1 font-sans" style={{ color: 'var(--text-secondary)' }}>
                  {ctrl.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* DCS Operator Desk notice */}
      <div className="text-[9px] text-slate-500 mt-4 flex items-center gap-1 border-t pt-2" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        <HelpCircle size={10} />
        <span>DCS Manual Override Desk — Adjustments feed into live physical models.</span>
      </div>
    </div>
  );
}
