import React from 'react';
import { motion } from 'framer-motion';

export default function GaugeChart({ title, value, min = 0, max = 100, unit = "", status = "cyan", subtitle }) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const getStatusColor = (s) => {
    switch (s?.toLowerCase()) {
      case 'red': return 'var(--red)';
      case 'amber': return 'var(--amber)';
      case 'green': return 'var(--green)';
      case 'purple': return 'var(--purple)';
      default: return 'var(--cyan)';
    }
  };

  const color = getStatusColor(status);

  // SVG parameters for circular path
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  // Make a semi-circle gauge (270 degrees arc)
  const angleStart = 135;
  const angleEnd = 405;
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

  return (
    <div className="panel flex flex-col items-center justify-between h-full relative overflow-hidden" style={{ minHeight: 200 }}>
      <div className="w-full flex justify-between items-center">
        <span className="panel-title" style={{ marginBottom: 0 }}>{title}</span>
      </div>

      <div className="relative flex items-center justify-center my-3" style={{ width: 140, height: 140 }}>
        {/* SVG Circle Gauge */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <defs>
            <radialGradient id={`glow-${title.replace(/\s+/g, '')}`} cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="transparent" />
              <stop offset="100%" stopColor={color} stopOpacity="0.15" />
            </radialGradient>
          </defs>

          {/* Glowing center area */}
          <circle cx="60" cy="60" r={radius} fill={`url(#glow-${title.replace(/\s+/g, '')})`} />

          {/* Background track (270 degrees) */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(0, 212, 255, 0.05)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            className="transform rotate-[135deg] origin-[60px_60px]"
          />

          {/* Active progress arc */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            strokeLinecap="round"
            className="transform rotate-[135deg] origin-[60px_60px]"
            style={{
              filter: `drop-shadow(0 0 4px ${color}33)`
            }}
          />
        </svg>

        {/* Text values in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span 
            className="mono text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {unit}
          </span>
        </div>
      </div>

      <div className="w-full text-center text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {subtitle || `${min} - ${max} Range`}
      </div>
    </div>
  );
}
