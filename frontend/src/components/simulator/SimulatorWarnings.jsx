import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';

export default function SimulatorWarnings({ alarms }) {
  return (
    <div className="panel flex flex-col overflow-hidden" style={{ minHeight: 180 }}>
      <span className="panel-title flex items-center gap-1.5" style={{ color: 'var(--text-primary)', marginBottom: 0 }}>
        <AlertTriangle size={13} className="text-red-500" /> Simulator Process Warnings Desk
      </span>
      <div className="divider opacity-30 my-2" />

      <div className="flex-1 flex flex-col gap-2 max-h-[220px] overflow-y-auto">
        {alarms.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2 bg-emerald-50 border border-emerald-100">
              <CheckCircle size={16} className="text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-700">All stages running nominally</p>
            <p className="text-[9px] text-slate-400">Calculated chemical, thermal, and mechanical values are balanced.</p>
          </div>
        ) : (
          alarms.map((alarm, index) => (
            <div
              key={index}
              className="p-2.5 rounded border text-xs flex gap-2.5 items-start justify-between bg-amber-50/30"
              style={{
                borderColor: 'var(--border)',
                borderLeft: alarm.severity === 'CRITICAL' ? '3px solid var(--red)' : '3px solid var(--amber)'
              }}
            >
              <div className="flex gap-2 items-start">
                {alarm.severity === 'CRITICAL' ? (
                  <AlertOctagon size={13} className="text-red-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={13} className="text-amber-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <span className="font-extrabold uppercase text-[9px] tracking-wider block text-slate-500">{alarm.stage} stage</span>
                  <p className="text-[11px] text-slate-700 leading-snug font-medium">{alarm.message}</p>
                </div>
              </div>
              <span className={`text-[8px] uppercase px-1 py-0.5 rounded font-extrabold tracking-wide ${alarm.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {alarm.severity}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
