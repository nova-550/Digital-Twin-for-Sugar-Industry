import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStore } from '../store/useStore';
import { Activity } from 'lucide-react';

export default function DiagnosticsChart() {
  const activeStage = useStore((state) => state.activeStage);
  const selectedParam = useStore((state) => state.selectedParam);
  const history = useStore((state) => state.history);
  const selectParam = useStore((state) => state.selectParam);

  if (!activeStage || !selectedParam || history.length === 0) {
    return (
      <div className="panel flex flex-col items-center justify-center text-center p-8 h-full" style={{ minHeight: 320 }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--cyan-dim)', border: '1px solid var(--border)' }}>
          <Activity size={18} style={{ color: 'var(--cyan)' }} />
        </div>
        <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-primary)' }}>Telemetry Diagnostics Desk</h4>
        <p className="text-[11px] text-muted max-w-[200px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Click on any circular instrument tag inside the P&ID schematic above to graph scrolling telemetry history.
        </p>
      </div>
    );
  }

  // Formatting X Axis Time (e.g. HH:mm:ss)
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  const chartData = history.map((item, idx) => ({
    ...item,
    formattedTime: item.ts ? formatTime(item.ts) : `:${idx}`,
    value: parseFloat(item.value ?? 0)
  }));

  const chartTitle = `${activeStage.replace('_', ' ').toUpperCase()} -> ${selectedParam.replace(/_/g, ' ').toUpperCase()}`;

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
            {timeVal || 'Live telemetry'}
          </p>
          <div className="flex items-baseline gap-1 font-bold">
            <span className="mono text-sm" style={{ color: 'var(--cyan)' }}>
              {p.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 })}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="panel flex flex-col h-full relative overflow-hidden" style={{ minHeight: 320 }}>
      {/* Decorative Cyan active bar */}
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, var(--cyan) 0%, transparent 100%)' }} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <span className="panel-title flex items-center gap-1.5" style={{ marginBottom: 0, color: 'var(--text-primary)' }}>
          <Activity size={12} className="text-cyan" />
          Real-Time Sensor Plot: {chartTitle}
        </span>
        <div className="flex items-center gap-3">
          {activeStage === 'milling' && (
            <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <button
                onClick={() => selectParam('imbibition_water_pct')}
                className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded transition-all"
                style={{
                  background: selectedParam === 'imbibition_water_pct' ? 'var(--cyan-dim)' : 'transparent',
                  color: selectedParam === 'imbibition_water_pct' ? 'var(--cyan)' : 'var(--text-secondary)',
                  border: selectedParam === 'imbibition_water_pct' ? '1px solid var(--border-strong)' : '1px solid transparent'
                }}
              >
                Imbibition Water
              </button>
              <button
                onClick={() => selectParam('mill_extraction_pct')}
                className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded transition-all"
                style={{
                  background: selectedParam === 'mill_extraction_pct' ? 'var(--cyan-dim)' : 'transparent',
                  color: selectedParam === 'mill_extraction_pct' ? 'var(--cyan)' : 'var(--text-secondary)',
                  border: selectedParam === 'mill_extraction_pct' ? '1px solid var(--border-strong)' : '1px solid transparent'
                }}
              >
                Extraction Efficiency
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="pulse-dot green" style={{ width: 6, height: 6 }} />
            <span className="text-[9px] mono uppercase tracking-wider text-muted" style={{ color: 'var(--text-secondary)' }}>
              DCS Live Stream
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-[260px] min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="scadaChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.20" />
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.00" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              minTickGap={45}
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
              dataKey="value" 
              stroke="var(--cyan)" 
              strokeWidth={1.8}
              fillOpacity={1}
              fill="url(#scadaChartGrad)"
              isAnimationActive={false} // Prevents UI frame lag
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
