import React from 'react';
import { Cpu } from 'lucide-react';
import { inputStructure } from './constants';

export default function SimulatorInputs({
  inputs,
  liveSync,
  telemetry,
  lockedParams,
  handleSliderChange,
  handleOptimizeParam,
  handleMouseEnter,
  handleMouseLeave
}) {
  return (
    <div className="lg:col-span-5 flex flex-col gap-5 max-h-[85vh] overflow-y-auto pr-1">
      {inputStructure.map((group) => (
        <div key={group.stage} className="panel flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm">{group.icon}</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{group.label}</h3>
          </div>
          
          <div className="flex flex-col gap-4 mt-1">
            {group.params.map((param) => {
              const currentVal = inputs[param.key] ?? param.min;
              const liveVal = telemetry?.state?.[group.stage]?.[param.key];
              const hasChanged = lockedParams.has(param.key);
              const isOptimizable = !['cane_feed_rate_tph', 'trash_pct', 'cane_pol_pct', 'cane_brix_pct'].includes(param.key);

              return (
                <div key={param.key} className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="text-[10px] font-bold text-slate-700 cursor-help hover:text-sky-600 transition-colors border-b border-dashed border-slate-300"
                        onMouseEnter={(e) => handleMouseEnter(e, param.key)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {param.label}
                      </span>
                      {hasChanged && (
                        <span className="text-[8px] bg-sky-50 text-sky-600 px-1 border border-sky-100 rounded font-bold uppercase">Adjusted</span>
                      )}
                      {!liveSync && isOptimizable && (
                        <button
                          onClick={() => handleOptimizeParam(param.key)}
                          className="text-[8.5px] font-extrabold uppercase px-1 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded transition-colors inline-flex items-center gap-0.5 scale-90"
                          title="Auto-tune loop to optimum setting"
                        >
                          <Cpu size={8} /> Tune
                        </button>
                      )}
                    </div>
                    <span 
                      className="mono text-xs font-bold text-sky-700 cursor-help hover:text-sky-850 transition-colors"
                      onMouseEnter={(e) => handleMouseEnter(e, param.key)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {currentVal.toFixed(param.step % 1 === 0 ? 0 : 2)} <span className="text-[9px] text-slate-400 font-semibold">{param.unit}</span>
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={currentVal}
                    disabled={liveSync}
                    onChange={(e) => handleSliderChange(param.key, e.target.value)}
                    className={`w-full h-1 rounded-full cursor-pointer accent-sky-600 ${liveSync ? 'opacity-60 cursor-not-allowed' : ''}`}
                    style={{ background: 'var(--border)' }}
                  />
                  
                  <div className="flex justify-between items-center text-[8.5px] text-slate-400 leading-snug">
                    <span>{param.desc}</span>
                    {liveVal !== undefined && !liveSync && (
                      <span 
                        className="text-emerald-600 font-bold ml-2 cursor-help hover:text-emerald-700 transition-colors"
                        onMouseEnter={(e) => handleMouseEnter(e, param.key)}
                        onMouseLeave={handleMouseLeave}
                      >
                        Live: {liveVal.toFixed(param.step % 1 === 0 ? 0 : 2)}{param.unit}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
