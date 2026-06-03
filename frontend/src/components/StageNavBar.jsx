import React from 'react';
import { LayoutDashboard, Settings, Sliders } from 'lucide-react';

export default function StageNavBar({ activeStage, onSelectStage, stageHealth = {} }) {
  // 6 primary process phases for standard sugar production
  const stages = [
    { id: 'cane_handling', label: 'Cane Handling', icon: '🌾' },
    { id: 'milling', label: 'Milling', icon: '⚙️' },
    { id: 'clarification', label: 'Clarification', icon: '🧪' },
    { id: 'evaporation', label: 'Evaporation', icon: '💨' },
    { id: 'crystallization', label: 'Crystallization', icon: '💎' },
    { id: 'centrifugation', label: 'Centrifugation', icon: '🔄' },
  ];

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'RED': return 'red';
      case 'YELLOW': return 'amber';
      default: return 'green';
    }
  };

  return (
    <nav 
      className="flex items-center justify-between px-6 py-3 border-b mb-6 backdrop-blur-md sticky top-0"
      style={{ 
        background: 'var(--bg-panel)', 
        borderColor: 'var(--border)',
        zIndex: 50
      }}
    >
      {/* Brand logo / System Label */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectStage(null)}>
        <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan to-purple flex items-center justify-center font-bold text-xs text-slate-900 shadow-[0_0_10px_var(--cyan-glow)]">
          ST
        </div>
        <div>
          <h1 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] leading-none">
            SUGARTECH
          </h1>
          <span className="text-[8px] mono text-cyan tracking-widest uppercase font-bold">
            DIGITAL TWIN
          </span>
        </div>
      </div>

      {/* Primary Navigation list */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[70%] no-scrollbar">
        {/* Overview button */}
        <button
          onClick={() => onSelectStage(null)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
          style={{
            background: activeStage === null ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
            borderColor: activeStage === null ? 'var(--cyan)' : 'transparent',
            color: activeStage === null ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          <LayoutDashboard size={13} style={{ color: activeStage === null ? 'var(--cyan)' : 'inherit' }} />
          <span>Plant Overview</span>
        </button>

        {/* Factory Simulator button */}
        <button
          onClick={() => onSelectStage('simulator')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap"
          style={{
            background: activeStage === 'simulator' ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
            borderColor: activeStage === 'simulator' ? 'var(--cyan)' : 'transparent',
            color: activeStage === 'simulator' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          <Sliders size={13} style={{ color: activeStage === 'simulator' ? 'var(--cyan)' : 'inherit' }} />
          <span>Factory Simulator</span>
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-2" />

        {/* Dynamic stage links */}
        {stages.map((st) => {
          const health = stageHealth[st.id] || { status: 'GREEN' };
          const active = activeStage === st.id;
          const statusClass = getStatusClass(health.status);

          return (
            <button
              key={st.id}
              onClick={() => onSelectStage(st.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap"
              style={{
                background: active ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                borderColor: active ? 'var(--cyan)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <span>{st.icon}</span>
              <span>{st.label}</span>
              <span className={`pulse-dot ${statusClass}`} style={{ width: 5, height: 5 }} />
            </button>
          );
        })}
      </div>

      {/* Right details clock / settings */}
      <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="pulse-dot green" style={{ width: 6, height: 6 }} />
          <span className="mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            Twin synchronized
          </span>
        </div>
      </div>
    </nav>
  );
}
