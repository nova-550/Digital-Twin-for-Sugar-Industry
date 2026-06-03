import React from 'react';
import { Cpu } from 'lucide-react';

export default function SimulatorKPIs({
  sugarRate,
  sugarRatePhysics,
  sugarPurity,
  mlExtraction,
  mlExtractionPhysics,
  overallRecovery,
  liveSync,
  handleMouseEnter,
  handleMouseLeave
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* KPI 1: Final Sugar TPH */}
      <div 
        className="panel flex flex-col justify-between p-4 relative overflow-hidden cursor-help hover:border-sky-300 hover:shadow-md transition-all" 
        style={{ minHeight: 96 }}
        onMouseEnter={(e) => handleMouseEnter(e, 'sugar_tph')}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Sugar Production</span>
          <span className="text-xs">🔄</span>
        </div>
        <div className="my-1 flex flex-col">
          <div>
            <span className={`mono text-2xl font-bold tracking-tight text-slate-900 ${liveSync ? 'value-updated' : ''}`}>{sugarRate.toFixed(2)}</span>
            <span className="text-[10px] text-slate-500 font-semibold ml-1">T/H <span className="text-[8px] bg-slate-100 text-slate-500 px-0.5 rounded font-bold uppercase">ML</span></span>
          </div>
          <div className="text-slate-500 font-medium -mt-1 text-[10px]">
            Physics: <span className="mono font-bold text-slate-700">{sugarRatePhysics.toFixed(2)} T/H</span>
          </div>
        </div>
        <div className="text-[8.5px] text-slate-400 border-t pt-1 flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
          <span>Discrepancy:</span>
          <span className={`mono font-extrabold ${(sugarRate - sugarRatePhysics) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {(sugarRate - sugarRatePhysics) >= 0 ? '+' : ''}{(sugarRate - sugarRatePhysics).toFixed(2)} T/H
          </span>
        </div>
      </div>

      {/* KPI 2: Final Sugar Purity */}
      <div 
        className="panel flex flex-col justify-between p-4 relative overflow-hidden cursor-help hover:border-sky-300 hover:shadow-md transition-all" 
        style={{ minHeight: 96 }}
        onMouseEnter={(e) => handleMouseEnter(e, 'final_sugar_purity_pct')}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Crystal Purity</span>
          <span className={`badge text-[8px] ${sugarPurity >= 99.4 ? 'badge-green' : sugarPurity >= 99.0 ? 'badge-amber' : 'badge-red'}`}>
            {sugarPurity >= 99.4 ? 'Grade A' : sugarPurity >= 99.0 ? 'Grade B' : 'Sub-std'}
          </span>
        </div>
        <div className="my-2">
          <span className={`mono text-2xl font-bold tracking-tight text-slate-900 ${liveSync ? 'value-updated' : ''}`}>{sugarPurity.toFixed(3)}</span>
          <span className="text-[10px] text-slate-500 font-semibold ml-1">%</span>
        </div>
        <div className="text-[8.5px] text-slate-400 border-t pt-1" style={{ borderColor: 'var(--border)' }}>
          Purge polarimetric assay
        </div>
      </div>

      {/* KPI 3: Milling Extraction efficiency (ML vs Physics) */}
      <div 
        className="panel flex flex-col justify-between p-4 relative overflow-hidden bg-sky-50/20 cursor-help hover:border-sky-450 hover:shadow-md transition-all" 
        style={{ minHeight: 96, borderColor: 'var(--border-strong)' }}
        onMouseEnter={(e) => handleMouseEnter(e, 'mill_extraction_pct')}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
            <Cpu size={9} /> Ext. Efficiency
          </span>
          <span className="badge badge-cyan text-[7px] font-extrabold tracking-widest uppercase">ML vs Physics</span>
        </div>
        <div className="my-1 flex flex-col">
          <div>
            <span className={`mono text-2xl font-bold tracking-tight text-sky-800 ${liveSync ? 'value-updated' : ''}`}>{mlExtraction.toFixed(2)}%</span>
            <span className="text-[9px] text-sky-600 font-semibold ml-1">(ML)</span>
          </div>
          <div className="text-slate-500 font-medium -mt-1 text-[10px]">
            Physics: <span className="mono font-bold text-slate-700">{mlExtractionPhysics.toFixed(2)}%</span>
          </div>
        </div>
        <div className="text-[8.5px] text-sky-600 font-medium border-t pt-1 flex justify-between items-center" style={{ borderColor: 'var(--border-strong)' }}>
          <span>Variance:</span>
          <span className={`mono font-extrabold ${(mlExtraction - mlExtractionPhysics) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {(mlExtraction - mlExtractionPhysics) >= 0 ? '+' : ''}{(mlExtraction - mlExtractionPhysics).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* KPI 4: Overall Recovery Rate */}
      <div 
        className="panel flex flex-col justify-between p-4 relative overflow-hidden cursor-help hover:border-sky-300 hover:shadow-md transition-all" 
        style={{ minHeight: 96 }}
        onMouseEnter={(e) => handleMouseEnter(e, 'overall_recovery')}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Overall Recovery</span>
          <span className="text-xs">📈</span>
        </div>
        <div className="my-2">
          <span className={`mono text-2xl font-bold tracking-tight text-slate-900 ${liveSync ? 'value-updated' : ''}`}>{overallRecovery.toFixed(1)}</span>
          <span className="text-[10px] text-slate-500 font-semibold ml-1">%</span>
        </div>
        <div className="text-[8.5px] text-slate-400 border-t pt-1" style={{ borderColor: 'var(--border)' }}>
          Sucrose in cane recovered
        </div>
      </div>
    </div>
  );
}
