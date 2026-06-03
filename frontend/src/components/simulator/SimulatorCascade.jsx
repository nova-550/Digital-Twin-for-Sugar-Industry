import React from 'react';
import { ChevronRight, Cpu } from 'lucide-react';

export default function SimulatorCascade({
  activeResults,
  activeResultsPhysics,
  liveSync,
  handleMouseEnter,
  handleMouseLeave
}) {
  if (!activeResults || !activeResultsPhysics) return null;

  return (
    <div className="flex flex-col gap-3 relative">
      {/* 1. Cane Handling */}
      <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded border" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100">
          🌾
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'net_cane_tph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Cane Crushed</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.cane_handling?.net_cane_tph ?? 0).toFixed(2)} <span className="text-[9px] font-normal">T/H</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'trash_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Trash Impurity</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.cane_handling?.trash_pct ?? 0).toFixed(2)}%</div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'sucrose_tph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Total Sucrose</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.cane_handling?.sucrose_tph ?? 0).toFixed(2)} <span className="text-[9px] font-normal">T/H</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'cane_purity_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Cane Purity</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.cane_handling?.cane_purity_pct ?? 0).toFixed(2)}%</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-0.5 text-slate-300">
        <ChevronRight size={14} className="rotate-90" />
      </div>

      {/* 2. Milling */}
      <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded border" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm shrink-0 border border-sky-100">
          ⚙️
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'juice_tph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Mixed Juice</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.milling?.juice_tph ?? 0).toFixed(2)} <span className="text-[9px] font-normal">T/H</span> <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.milling?.juice_tph ?? 0).toFixed(2)} Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'juice_brix_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Juice Brix</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.milling?.juice_brix_pct ?? 0).toFixed(2)}% <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.milling?.juice_brix_pct ?? 0).toFixed(2)} Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'mill_extraction_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-sky-600 uppercase font-extrabold flex items-center gap-0.5"><Cpu size={7} /> Extraction</div>
            <div className={`mono font-extrabold text-sky-700 ${liveSync ? 'value-updated' : ''}`}>{(activeResults.milling?.mill_extraction_pct ?? 0).toFixed(2)}% <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.milling?.mill_extraction_pct ?? 0).toFixed(2)} Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'bagasse_wet_tph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Wet Bagasse</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.milling?.bagasse_wet_tph ?? 0).toFixed(2)} <span className="text-[9px] font-normal">T/H</span> <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.milling?.bagasse_wet_tph ?? 0).toFixed(2)} Phys)</span></div>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-0.5 text-slate-300">
        <ChevronRight size={14} className="rotate-90" />
      </div>

      {/* 3. Clarification */}
      <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded border" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-sm shrink-0 border border-violet-100">
          🧪
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'clarified_juice_tph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Clarified Juice</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.clarification?.clarified_juice_tph ?? 0).toFixed(2)} <span className="text-[9px] font-normal">T/H</span> <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.clarification?.clarified_juice_tph ?? 0).toFixed(2)} Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'estimated_ph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">estimated pH</div>
            <div className={`mono font-bold flex items-center gap-1 ${liveSync ? 'value-updated' : ''}`}>
              {(activeResults.clarification?.estimated_ph ?? 0).toFixed(2)}
              <span className={`w-2 h-2 rounded-full ${Math.abs(7.2 - (activeResults.clarification?.estimated_ph ?? 7.2)) < 0.1 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.clarification?.estimated_ph ?? 0).toFixed(2)} Phys)</span>
            </div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'clarified_purity_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Purity Uplift</div>
            <div className={`mono font-bold text-emerald-600 ${liveSync ? 'value-updated' : ''}`}>{(activeResults.clarification?.clarified_purity_pct ?? 0).toFixed(2)}% <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.clarification?.clarified_purity_pct ?? 0).toFixed(2)} Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'turbidity_reduction_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Settling Turbidity</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>-{(activeResults.clarification?.turbidity_reduction_pct ?? 0).toFixed(1)}% <span className="text-[8px] text-slate-400 font-semibold">(vs -{(activeResultsPhysics.clarification?.turbidity_reduction_pct ?? 0).toFixed(1)}% Phys)</span></div>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-0.5 text-slate-300">
        <ChevronRight size={14} className="rotate-90" />
      </div>

      {/* 4. Evaporation */}
      <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded border" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-100">
          💨
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'syrup_out_tph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Syrup Output</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.evaporation?.syrup_out_tph ?? 0).toFixed(2)} <span className="text-[9px] font-normal">T/H</span> <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.evaporation?.syrup_out_tph ?? 0).toFixed(2)} Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'juice_brix_out_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Syrup Brix (Out)</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.evaporation?.juice_brix_out_pct ?? 0).toFixed(2)}% <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.evaporation?.juice_brix_out_pct ?? 0).toFixed(2)}% Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'water_evaporated_tph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Water Evap.</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.evaporation?.water_evaporated_tph ?? 0).toFixed(2)} <span className="text-[9px] font-normal">T/H</span> <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.evaporation?.water_evaporated_tph ?? 0).toFixed(2)} Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'actual_steam_needed_tph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Boiler Steam Needed</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.evaporation?.actual_steam_needed_tph ?? 0).toFixed(2)} <span className="text-[9px] font-normal">T/H</span> <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.evaporation?.actual_steam_needed_tph ?? 0).toFixed(2)} Phys)</span></div>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-0.5 text-slate-300">
        <ChevronRight size={14} className="rotate-90" />
      </div>

      {/* 5. Crystallization */}
      <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded border" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-sm shrink-0 border border-cyan-100">
          💎
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'massecuite_tph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Massecuite Slurry</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.crystallization?.massecuite_tph ?? 0).toFixed(2)} <span className="text-[9px] font-normal">T/H</span> <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.crystallization?.massecuite_tph ?? 0).toFixed(2)} Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'massecuite_brix_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Massecuite Brix</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.crystallization?.massecuite_brix_pct ?? 0).toFixed(2)}% <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.crystallization?.massecuite_brix_pct ?? 0).toFixed(2)}% Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'crystal_yield_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Crystal Yield</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.crystallization?.crystal_yield_pct ?? 0).toFixed(2)}% <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.crystallization?.crystal_yield_pct ?? 0).toFixed(2)}% Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'pan_temp_c')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Boiling Temp</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.crystallization?.pan_temp_c ?? 0).toFixed(2)}°C <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.crystallization?.pan_temp_c ?? 0).toFixed(2)}°C Phys)</span></div>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-0.5 text-slate-300">
        <ChevronRight size={14} className="rotate-90" />
      </div>

      {/* 6. Centrifugation */}
      <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded border animate-pulse-light" style={{ borderColor: 'var(--border-strong)' }}>
        <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm shrink-0 border border-red-100">
          🔄
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'sugar_tph')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Pure Crystals</div>
            <div className={`mono font-bold text-emerald-600 ${liveSync ? 'value-updated' : ''}`}>{(activeResults.centrifugation?.sugar_tph ?? 0).toFixed(2)} <span className="text-[9px] font-normal">T/H</span> <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.centrifugation?.sugar_tph ?? 0).toFixed(2)} Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'g_factor')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Centrifugal G-Force</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.centrifugation?.g_factor ?? 0).toFixed(2)} G <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.centrifugation?.g_factor ?? 0).toFixed(2)} G Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'separation_efficiency_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Separation Eff.</div>
            <div className={`mono font-bold ${liveSync ? 'value-updated' : ''}`}>{(activeResults.centrifugation?.separation_efficiency_pct ?? 0).toFixed(2)}% <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.centrifugation?.separation_efficiency_pct ?? 0).toFixed(2)}% Phys)</span></div>
          </div>
          <div 
            className="cursor-help hover:text-sky-600 transition-all p-1 rounded hover:bg-slate-100"
            onMouseEnter={(e) => handleMouseEnter(e, 'final_sugar_purity_pct')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[9px] text-slate-400 uppercase font-bold">Crystals Purity</div>
            <div className={`mono font-bold text-emerald-600 ${liveSync ? 'value-updated' : ''}`}>{(activeResults.centrifugation?.final_sugar_purity_pct ?? 0).toFixed(2)}% <span className="text-[8px] text-slate-400 font-semibold">(vs {(activeResultsPhysics.centrifugation?.final_sugar_purity_pct ?? 0).toFixed(2)}% Phys)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
