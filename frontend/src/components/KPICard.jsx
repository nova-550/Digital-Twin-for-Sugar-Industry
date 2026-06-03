import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function KPICard({ title, value, unit, status = 'green', trend = 0, target, subtitle, history = [] }) {
  const [flash, setFlash] = useState(false);
  const prevVal = useRef(value);

  useEffect(() => {
    if (prevVal.current !== value) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 800);
      prevVal.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const getStatusColor = (s) => {
    switch (s?.toLowerCase()) {
      case 'red': return 'var(--red)';
      case 'amber': return 'var(--amber)';
      case 'purple': return 'var(--purple)';
      case 'cyan': return 'var(--cyan)';
      default: return 'var(--green)';
    }
  };

  const getStatusBg = (s) => {
    switch (s?.toLowerCase()) {
      case 'red': return 'rgba(255, 51, 102, 0.06)';
      case 'amber': return 'rgba(255, 184, 0, 0.06)';
      case 'purple': return 'rgba(180, 79, 255, 0.06)';
      case 'cyan': return 'rgba(0, 212, 255, 0.06)';
      default: return 'rgba(0, 255, 136, 0.06)';
    }
  };

  const color = getStatusColor(status);
  const bg = getStatusBg(status);

  // Parse numeric value for comparison
  const numVal = parseFloat(value);
  const numTarget = parseFloat(target);
  const deviation = numTarget && !isNaN(numVal) ? ((numVal - numTarget) / numTarget) * 100 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel"
      style={{
        background: `linear-gradient(135deg, var(--bg-card) 0%, ${bg} 100%)`,
        borderLeft: `3px solid ${color}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      whileHover={{
        y: -3,
        boxShadow: `0 12px 30px -5px rgba(15, 23, 42, 0.08), 0 0 1px 1px ${color}33`,
        borderColor: color,
      }}
    >
      {/* Background glow pulse for status */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: `radial-gradient(circle at 80% 20%, ${color}08 0%, transparent 60%)`
        }} 
      />

      <div className="flex justify-between items-start mb-2">
        <span className="panel-title" style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
          {title}
        </span>
        <div 
          className="p-1.5 rounded"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
        >
          <Activity size={12} style={{ color }} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-2">
        <span 
          className={`mono text-2xl font-bold tracking-tight transition-colors duration-300 ${flash ? 'value-updated' : ''}`}
          style={{ 
            color: 'var(--text-primary)',
            textShadow: status === 'red' ? '0 0 10px rgba(255, 51, 102, 0.2)' : 'none'
          }}
        >
          {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : value}
        </span>
        {unit && (
          <span className="text-xs font-semibold mono" style={{ color: 'var(--text-secondary)' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Sparkline mini-visualizer if history is provided */}
      {history.length > 1 && (
        <div className="h-6 w-full my-2 opacity-80 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d={history.reduce((acc, point, idx) => {
                const x = (idx / (history.length - 1)) * 100;
                // Normalize points between 2 and 22
                const vals = history.map(p => p.value || 0);
                const min = Math.min(...vals);
                const max = Math.max(...vals);
                const range = max - min || 1;
                const y = 22 - ((point.value - min) / range) * 20;
                return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
              }, '')}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={`${history.reduce((acc, point, idx) => {
                const x = (idx / (history.length - 1)) * 100;
                const vals = history.map(p => p.value || 0);
                const min = Math.min(...vals);
                const max = Math.max(...vals);
                const range = max - min || 1;
                const y = 22 - ((point.value - min) / range) * 20;
                return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
              }, '')} L 100 24 L 0 24 Z`}
              fill={`url(#grad-${title.replace(/\s+/g, '')})`}
            />
          </svg>
        </div>
      )}

      <div className="divider opacity-30 my-2" />

      <div className="flex justify-between items-center text-xs font-semibold">
        <span style={{ color: 'var(--text-muted)' }}>
          {subtitle || (target ? `Target: ${target} ${unit || ''}` : 'Optimal State')}
        </span>
        {deviation !== null && (
          <span 
            className="flex items-center gap-0.5 mono"
            style={{ color: deviation >= 0 ? 'var(--green)' : 'var(--red)' }}
          >
            {deviation >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(deviation).toFixed(1)}%
          </span>
        )}
        {trend !== 0 && deviation === null && (
          <span 
            className="flex items-center gap-0.5 mono"
            style={{ color: trend > 0 ? 'var(--green)' : 'var(--red)' }}
          >
            {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
