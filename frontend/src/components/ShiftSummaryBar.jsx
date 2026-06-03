import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, Clock, DollarSign } from 'lucide-react';

export default function ShiftSummaryBar({ shiftData = {} }) {
  const progress = shiftData.shift_progress_pct || 65;
  const oee = shiftData.plant_oee_pct || 88.5;

  return (
    <div className="panel w-full flex flex-col gap-4 relative overflow-hidden" style={{ padding: '16px 20px' }}>
      {/* Visual background accents */}
      <div 
        className="absolute right-0 top-0 w-96 h-full pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle at 100% 0%, var(--cyan-glow) 0%, transparent 70%)'
        }}
      />

      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        {/* Left Side: Shift Context */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--cyan-dim)] border border-[var(--border)]" style={{ color: 'var(--cyan)' }}>
            <Clock size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Shift: {shiftData.shift_name || "A-Shift (Morning)"}
              </h3>
              <span className="badge badge-cyan">Active</span>
            </div>
            <p className="text-[10px] text-muted font-mono tracking-tight" style={{ color: 'var(--text-secondary)' }}>
              Operator: {shiftData.operator || "Dr. Patil"} | Target: {shiftData.crush_target_tons || 5000} Tons
            </p>
          </div>
        </div>

        {/* Middle: Progress bar */}
        <div className="flex-1 max-w-xl flex flex-col gap-1.5 lg:mx-8">
          <div className="flex justify-between text-xs font-semibold mono">
            <span style={{ color: 'var(--text-secondary)' }}>Shift Production Progress</span>
            <span style={{ color: 'var(--cyan)' }}>{progress.toFixed(1)}% Completed</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--border)] relative overflow-hidden" style={{ minHeight: 8 }}>
            <motion.div 
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--cyan-dim) 0%, var(--cyan) 100%)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Right Side: Quick Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted font-bold" style={{ color: 'var(--text-muted)' }}>
              Cane Crushed
            </span>
            <span className="mono text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {(shiftData.cane_crushed_tons || 3240).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-[10px] text-muted ml-0.5" style={{ color: 'var(--text-secondary)' }}>Tons</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted font-bold" style={{ color: 'var(--text-muted)' }}>
              Sugar Produced
            </span>
            <span className="mono text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {(shiftData.sugar_produced_tons || 382).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              <span className="text-[10px] text-muted ml-0.5" style={{ color: 'var(--text-secondary)' }}>Tons</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted font-bold" style={{ color: 'var(--text-muted)' }}>
              Plant OEE
            </span>
            <span className="mono text-sm font-bold text-green flex items-center gap-1">
              <ShieldCheck size={12} /> {oee.toFixed(1)}%
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted font-bold" style={{ color: 'var(--text-muted)' }}>
              Shift Revenue
            </span>
            <span className="mono text-sm font-bold text-cyan flex items-center">
              <DollarSign size={12} className="text-cyan-dim" style={{ color: 'var(--cyan)' }} />
              {(shiftData.projected_revenue_usd || 185300).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
