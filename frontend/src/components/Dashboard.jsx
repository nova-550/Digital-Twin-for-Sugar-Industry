import React from 'react';
import KPICard from './KPICard';
import ProcessFlow from './ProcessFlow';
import AlertFeed from './AlertFeed';
import AIRecommendations from './AIRecommendations';

export default function Dashboard({ data, onSelectStage }) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="pulse-dot green mb-3" style={{ width: 12, height: 12 }} />
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Synchronizing plant telemetry stream...</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Contacting server at ws://localhost:8000</p>
      </div>
    );
  }

  const { plant_kpis = [], stage_health = {}, alerts = [], recommendations = [], stage_highlights = {} } = data;

  // Map backend KPI list to easy helper object
  const kpiMap = plant_kpis.reduce((acc, kpi) => {
    acc[kpi.name] = kpi;
    return acc;
  }, {});

  const getKPI = (name, defaultValue = 0) => {
    return kpiMap[name]?.value ?? defaultValue;
  };

  const getKPIStatus = (name) => {
    return kpiMap[name]?.status ?? 'green';
  };

  return (
    <div className="fade-in flex flex-col gap-6">
      {/* 1. Global Plant KPIs grid */}
      <div className="grid-6">
        <KPICard 
          title="Cane Crush Rate"
          value={getKPI("Plant Throughput")}
          unit="TPH"
          status={getKPIStatus("Plant Throughput")}
          target={210}
        />
        <KPICard 
          title="Sugar Recovery"
          value={getKPI("Sugar Recovery")}
          unit="%"
          status={getKPIStatus("Sugar Recovery")}
          target={11.5}
        />
        <KPICard 
          title="Energy Intensity"
          value={getKPI("Energy Intensity")}
          unit="kWh/T"
          status={getKPIStatus("Energy Intensity")}
          target={38.0}
        />
        <KPICard 
          title="Water Intensity"
          value={getKPI("Water Usage")}
          unit="m³/T"
          status={getKPIStatus("Water Usage")}
          target={1.2}
        />
        <KPICard 
          title="CO₂ Emissions"
          value={getKPI("CO₂ Emissions")}
          unit="T/Day"
          status={getKPIStatus("CO₂ Emissions")}
          target={85.0}
        />
        <KPICard 
          title="Plant OEE"
          value={getKPI("Plant OEE") || 88.5}
          unit="%"
          status={getKPIStatus("Plant OEE") || "green"}
          target={85}
        />
      </div>

      {/* 2. Interactive Interactive Process Flow Diagram */}
      <ProcessFlow 
        stageHealth={stage_health}
        stageHighlights={stage_highlights}
        onSelectStage={onSelectStage}
      />

      {/* 3. Lower Control Room Panels (Alerts & AI Co-Pilot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <AlertFeed alerts={alerts} />
        </div>
        <div className="lg:col-span-7">
          <AIRecommendations recommendations={recommendations} />
        </div>
      </div>
    </div>
  );
}
