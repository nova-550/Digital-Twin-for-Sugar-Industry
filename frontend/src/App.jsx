import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import StageNavBar from './components/StageNavBar';
import PidSchematic from './components/PidSchematic';
import OverridePanel from './components/OverridePanel';
import DiagnosticsChart from './components/DiagnosticsChart';
import ControlCenter from './components/ControlCenter';
import FactorySimulator from './components/FactorySimulator';

export default function App() {
  const connectWs = useStore((state) => state.connectWs);
  const disconnectWs = useStore((state) => state.disconnectWs);
  const telemetry = useStore((state) => state.telemetry);
  const connected = useStore((state) => state.connected);
  const activeStage = useStore((state) => state.activeStage);
  const selectStage = useStore((state) => state.selectStage);

  // Synchronize WebSocket connection on mount
  useEffect(() => {
    connectWs();
    return () => disconnectWs();
  }, [connectWs, disconnectWs]);

  const shiftData = telemetry?.shift || {};
  const stageHealth = telemetry?.stage_health || {};
  const lastTs = telemetry?.ts;

  return (
    <div className="app min-h-screen flex flex-col font-sans select-none" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* 1. Global DCS Header Navigation */}
      <StageNavBar 
        activeStage={activeStage}
        onSelectStage={selectStage}
        stageHealth={stageHealth}
      />

      <div className="main-content flex-1 max-w-7xl w-full mx-auto flex flex-col gap-6 px-6">
        {activeStage === 'simulator' ? (
          <FactorySimulator />
        ) : (
          <>
            {/* 3. P&ID Interactive SCADA Blueprint */}
            <PidSchematic />

            {/* 4. Split-Screen Control Room Console */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
              {/* Override Desk Slider Console */}
              <div className="lg:col-span-5 flex flex-col">
                <OverridePanel />
              </div>

              {/* Timeseries scrolling history charts */}
              <div className="lg:col-span-7 flex flex-col">
                <DiagnosticsChart />
              </div>
            </div>

            {/* 5. Alarms & Co-Pilot Optimizer desk */}
            <ControlCenter />
          </>
        )}
      </div>

      {/* 6. DCS Synced Status Footer */}
      <footer 
        className="w-full py-3 px-6 mt-8 border-t flex justify-between items-center text-[10px] font-semibold text-slate-500"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}
      >
        <div className="flex items-center gap-2">
          <span className={`pulse-dot ${connected ? 'green' : 'red'}`} style={{ width: 6, height: 6 }} />
          <span>{connected ? 'SCADA ONLINE — TELEMETRY TUNED AT 1HZ' : 'TELEMETRY OFFLINE — RECONNECTING'}</span>
        </div>
        <div className="mono uppercase" style={{ color: 'var(--text-secondary)' }}>
          Synced: {lastTs ? new Date(lastTs).toLocaleTimeString() : 'N/A'}
        </div>
      </footer>
    </div>
  );
}
