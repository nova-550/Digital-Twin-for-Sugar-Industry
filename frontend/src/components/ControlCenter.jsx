import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Bell, Cpu, AlertTriangle, AlertOctagon, CheckCircle, ArrowRight, Zap, Target, Gauge } from 'lucide-react';

export default function ControlCenter() {
  const telemetry = useStore((state) => state.telemetry);

  if (!telemetry) return null;

  const { alerts = [], recommendations = [] } = telemetry;

  const getSeverityStyle = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL':
        return {
          icon: <AlertOctagon size={14} className="status-red" style={{ color: 'var(--red)' }} />,
          badgeClass: 'badge-red',
          borderLeft: '3px solid var(--red)',
          bg: 'rgba(220, 38, 38, 0.02)'
        };
      case 'WARNING':
        return {
          icon: <AlertTriangle size={14} className="status-amber" style={{ color: 'var(--amber)' }} />,
          badgeClass: 'badge-amber',
          borderLeft: '3px solid var(--amber)',
          bg: 'rgba(217, 119, 6, 0.02)'
        };
      default:
        return {
          icon: <CheckCircle size={14} className="status-green" style={{ color: 'var(--green)' }} />,
          badgeClass: 'badge-green',
          borderLeft: '3px solid var(--green)',
          bg: 'rgba(5, 150, 105, 0.02)'
        };
    }
  };

  const getImpactColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'safety': return 'var(--red)';
      case 'energy': return 'var(--purple)';
      case 'throughput': return 'var(--cyan)';
      default: return 'var(--green)';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'energy': return <Zap size={12} />;
      case 'throughput': return <Gauge size={12} />;
      default: return <Target size={12} />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* 1. SCADA Active Alarms Feed */}
      <div className="lg:col-span-5 panel flex flex-col h-full overflow-hidden" style={{ minHeight: 300 }}>
        <div className="flex justify-between items-center mb-3">
          <span className="panel-title flex items-center gap-1.5" style={{ marginBottom: 0, color: 'var(--text-primary)' }}>
            <Bell size={13} className="text-red-500" /> Active DCS Process Alarms
          </span>
          <span className="mono text-[10px] bg-[var(--border)] px-2.5 py-0.5 rounded font-bold" style={{ color: 'var(--text-secondary)' }}>
            {alerts.length} ALARMS
          </span>
        </div>

        <div className="divider opacity-30 my-2" />

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[300px]">
          <AnimatePresence initial={false}>
            {alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2.5" style={{ background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.1)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--green)' }} />
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>DCS: All systems nominal</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Continuous mass-balance loop verified.</p>
              </motion.div>
            ) : (
              alerts.map((alert, idx) => {
                const style = getSeverityStyle(alert.severity);
                return (
                  <motion.div
                    key={`${alert.stage_id}-${alert.parameter}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 rounded border text-xs flex gap-3 items-start justify-between"
                    style={{
                      background: style.bg,
                      borderColor: 'var(--border)',
                      borderLeft: style.borderLeft
                    }}
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className="mt-0.5">{style.icon}</div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                            {alert.stage_id?.replace('_', ' ')}
                          </span>
                          <span className={`badge ${style.badgeClass}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="font-semibold leading-relaxed mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {alert.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                      <span>{new Date().toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      {alert.value !== undefined && (
                        <span className="border px-1 py-0.5 rounded text-[9.5px] font-bold" style={{ background: 'var(--cyan-dim)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                          {alert.value.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Co-Pilot recommendations */}
      <div className="lg:col-span-7 panel flex flex-col h-full overflow-hidden" style={{ minHeight: 300 }}>
        <div className="flex justify-between items-center mb-3">
          <span className="panel-title flex items-center gap-1.5" style={{ marginBottom: 0, color: 'var(--text-primary)' }}>
            <Cpu size={13} className="text-purple-500" /> SCADA Co-Pilot Tuning Recommendations
          </span>
          <span className="text-[10px] uppercase font-bold text-muted flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            <span className="pulse-dot purple" style={{ width: 6, height: 6 }} /> Model Predictive Control
          </span>
        </div>

        <div className="divider opacity-30 my-2" />

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[300px]">
          {recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2.5" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <Cpu size={16} style={{ color: 'var(--purple)' }} />
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Co-pilot is analyzing physical states...</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Calculating predictive optimizations.</p>
            </div>
          ) : (
            recommendations.map((rec, idx) => {
              const impactColor = getImpactColor(rec.category);
              const icon = getCategoryIcon(rec.category);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="p-3.5 rounded border text-xs flex flex-col justify-between"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    borderLeft: `3px solid ${impactColor}`
                  }}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="p-1 rounded text-[10px] flex items-center justify-center"
                        style={{ background: `${impactColor}22`, color: impactColor }}
                      >
                        {icon}
                      </span>
                      <span className="font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                        {rec.stage_id?.replace('_', ' ')}
                      </span>
                    </div>
                    <span 
                      className="text-[9px] mono font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      Priority: {rec.priority || 'Medium'}
                    </span>
                  </div>

                  <h4 className="font-bold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                    {rec.recommendation}
                  </h4>

                  <p className="font-semibold mb-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {rec.reasoning}
                  </p>

                  <div className="divider opacity-10 my-2" />

                  <div className="flex justify-between items-center text-[9.5px] mt-0.5 font-extrabold uppercase">
                    <span style={{ color: 'var(--text-muted)' }}>Expected Tuning Impact:</span>
                    <span style={{ color: impactColor }} className="flex items-center gap-1">
                      <ArrowRight size={10} /> {rec.expected_impact || 'Loop optimization'}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
