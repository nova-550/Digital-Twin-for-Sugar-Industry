import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function SensorChart({ title, data = [], dataKey = "value", status = "cyan", height = 240, unit = "" }) {
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

  // Format the time for X Axis (e.g. HH:mm:ss)
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  // Safe data check
  const chartData = data.map((item, idx) => ({
    ...item,
    formattedTime: item.ts ? formatTime(item.ts) : `:${idx}`,
    // Ensure value is numeric
    [dataKey]: parseFloat(item.value ?? item[dataKey] ?? 0)
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      const timeVal = p.payload.ts ? new Date(p.payload.ts).toLocaleTimeString() : '';
      return (
        <div 
          className="p-2.5 rounded-lg border shadow-lg backdrop-blur-md"
          style={{ 
            background: 'var(--bg-card)', 
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-panel)'
          }}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
            {timeVal || 'Live Sensor'}
          </p>
          <div className="flex items-baseline gap-1.5 font-bold">
            <span className="mono text-sm" style={{ color }}>
              {p.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 })}
            </span>
            {unit && <span className="mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="panel flex flex-col h-full" style={{ position: 'relative', overflow: 'hidden' }}>
      <div 
        className="absolute inset-x-0 top-0 h-[2px]" 
        style={{ background: `linear-gradient(90deg, ${color} 0%, transparent 100%)` }} 
      />
      <div className="flex justify-between items-center mb-4">
        <span className="panel-title" style={{ marginBottom: 0 }}>{title}</span>
        <div className="flex items-center gap-2">
          <span className="pulse-dot green" style={{ width: 6, height: 6 }} />
          <span className="text-[10px] mono uppercase tracking-wider text-muted" style={{ color: 'var(--text-secondary)' }}>
            Live telemetry
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id={`colorGrad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.00} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(15, 23, 42, 0.06)', strokeWidth: 1 }} />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={1.8}
              fillOpacity={1}
              fill={`url(#colorGrad-${title.replace(/\s+/g, '')})`}
              isAnimationActive={false} // Disable entry animation for seamless live updates
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
