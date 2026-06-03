import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, AlertTriangle, CheckCircle, Bell } from 'lucide-react';

export default function AlertFeed({ alerts = [] }) {
  const getSeverityStyle = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL':
        return {
          icon: <AlertOctagon size={14} className="status-red" />,
          badgeClass: 'badge-red',
          borderLeft: '3px solid var(--red)',
          bg: 'rgba(255, 51, 102, 0.02)'
        };
      case 'WARNING':
        return {
          icon: <AlertTriangle size={14} className="status-amber" />,
          badgeClass: 'badge-amber',
          borderLeft: '3px solid var(--amber)',
          bg: 'rgba(255, 184, 0, 0.02)'
        };
      default:
        return {
          icon: <CheckCircle size={14} className="status-green" />,
          badgeClass: 'badge-green',
          borderLeft: '3px solid var(--green)',
          bg: 'rgba(0, 255, 136, 0.02)'
        };
    }
  };

  return (
    <div className="panel flex flex-col h-full overflow-hidden" style={{ minHeight: 280 }}>
      <div className="flex justify-between items-center mb-3">
        <span className="panel-title flex items-center gap-1.5" style={{ marginBottom: 0 }}>
          <Bell size={12} /> Active Process Alarms
        </span>
        <span className="mono text-[10px] bg-[var(--border)] px-2 py-0.5 rounded font-bold" style={{ color: 'var(--text-secondary)' }}>
          {alerts.length} Active
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
              className="flex flex-col items-center justify-center text-center py-10"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                <CheckCircle size={16} style={{ color: 'var(--green)' }} />
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>All systems nominal</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>No process deviations detected</p>
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
                  className="p-3 rounded-lg border text-xs flex gap-3 items-start justify-between"
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
                        <span className="font-bold animate-pulse" style={{ color: 'var(--text-primary)' }}>
                          {alert.stage_id?.replace('_', ' ').toUpperCase()}
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
                      <span className="border px-1 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--cyan-dim)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                        {alert.value.toFixed(2)}
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
  );
}
