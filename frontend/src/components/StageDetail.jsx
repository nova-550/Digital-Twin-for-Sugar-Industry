import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Cpu, Activity, ListFilter } from 'lucide-react';
import { useStageDetail, useParamHistory } from '../hooks/useStageDetail';
import KPICard from './KPICard';
import SensorChart from './SensorChart';
import GaugeChart from './GaugeChart';
import AIRecommendations from './AIRecommendations';
import AlertFeed from './AlertFeed';

export default function StageDetail({ stageId, onBack, wsHighlights = {} }) {
  const { data: restData, loading, error } = useStageDetail(stageId);
  const [selectedParam, setSelectedParam] = useState('');

  // Primary parameters specific to each of the 6 core stages
  const primaryParams = {
    cane_handling: 'cane_feed_rate_tph',
    milling: 'imbibition_water_pct',
    clarification: 'estimated_ph',
    evaporation: 'juice_brix_out_pct',
    crystallization: 'supersaturation_coeff',
    centrifugation: 'final_sugar_purity_pct'
  };

  // Set default param once data loads
  useEffect(() => {
    if (restData?.highlight_params?.length > 0) {
      // Prefer standard primary param, fallback to first in list
      const def = primaryParams[stageId] || restData.highlight_params[0];
      setSelectedParam(def);
    }
  }, [restData, stageId]);

  // Fetch live scrolling history for the selected parameter
  const history = useParamHistory(stageId, selectedParam, 120);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="pulse-dot amber mb-3" style={{ width: 12, height: 12 }} />
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Synchronizing stage telemetry...</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Fetching REST state for '{stageId}'</p>
      </div>
    );
  }

  if (error || !restData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <span className="pulse-dot red mb-3" style={{ width: 12, height: 12 }} />
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Telemetry synchronization failed</p>
        <p className="text-xs text-red mt-0.5">{error || 'Unable to retrieve stage configuration'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-[var(--border)] text-xs font-bold rounded-lg border border-[var(--border)]" style={{ color: 'var(--text-primary)' }}>
          Return to Overview
        </button>
      </div>
    );
  }

  // Combine WS latest values into the KPI displays if available, keeping it ultra real-time!
  const latestHighlightValues = {
    ...restData.highlight_values,
    ...(wsHighlights[stageId] || {})
  };

  const getKPIColor = (kpi) => {
    switch (kpi?.status?.toLowerCase()) {
      case 'red': return 'red';
      case 'amber': return 'amber';
      case 'yellow': return 'amber';
      default: return 'green';
    }
  };

  const stageLabel = stageId.replace('_', ' ').toUpperCase();

  // Pick optimal gauge specifications for primary process metrics
  const getGaugeSpec = (sid) => {
    switch (sid) {
      case 'milling':
        return {
          title: "Imbibition Water Control",
          val: latestHighlightValues['imbibition_water_pct'] || 25,
          min: 15,
          max: 35,
          unit: "%",
          status: getKPIColor(restData.kpis?.find(k => k.name.includes("Imbibition")))
        };
      case 'clarification':
        return {
          title: "Liming Defecation pH",
          val: latestHighlightValues['estimated_ph'] || 7.2,
          min: 6.0,
          max: 8.8,
          unit: "pH",
          status: getKPIColor(restData.kpis?.find(k => k.name.includes("pH")))
        };
      case 'evaporation':
        return {
          title: "Syrup Outlet Brix",
          val: latestHighlightValues['juice_brix_out_pct'] || 62,
          min: 50,
          max: 75,
          unit: "Brix",
          status: getKPIColor(restData.kpis?.find(k => k.name.includes("Brix")))
        };
      case 'crystallization':
        return {
          title: "Vacuum Supersaturation",
          val: latestHighlightValues['supersaturation_coeff'] || 1.12,
          min: 0.9,
          max: 1.3,
          unit: "Coeff",
          status: getKPIColor(restData.kpis?.find(k => k.name.includes("Supersaturation")))
        };
      case 'centrifugation':
        return {
          title: "Sucrose Separation purity",
          val: latestHighlightValues['final_sugar_purity_pct'] || 99.5,
          min: 98.0,
          max: 100.0,
          unit: "%",
          status: getKPIColor(restData.kpis?.find(k => k.name.includes("Purity")))
        };
      default:
        // Cane Handling
        return {
          title: "Cane Feeding Tonnage",
          val: latestHighlightValues['cane_feed_rate_tph'] || 210,
          min: 100,
          max: 300,
          unit: "TPH",
          status: "cyan"
        };
    }
  };

  const gaugeSpec = getGaugeSpec(stageId);

  return (
    <div className="fade-in flex flex-col gap-6">
      {/* 1. Stage Detail Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
                STAGE DEEP DIVE: {stageLabel}
              </h2>
              <span 
                className="badge font-bold"
                style={{
                  background: `${gaugeSpec.status === 'red' ? 'var(--red-dim)' : 'var(--green-dim)'}`,
                  color: gaugeSpec.status === 'red' ? 'var(--red)' : 'var(--green)'
                }}
              >
                Health Score: {restData.health?.score || 100}%
              </span>
            </div>
            <p className="text-xs text-muted" style={{ color: 'var(--text-secondary)' }}>
              Primary engineering metrics, physics-based simulations, and alarm diagnostics.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="pulse-dot green" style={{ width: 6, height: 6 }} />
          <span className="mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            Polling rate: 2.0s
          </span>
        </div>
      </div>

      <div className="divider opacity-30 my-0" />

      {/* 2. Key Stage KPI Cards */}
      <div className="grid-5">
        {restData.highlight_params?.map((param) => {
          const val = latestHighlightValues[param];
          const isSelected = selectedParam === param;
          return (
            <div 
              key={param} 
              onClick={() => setSelectedParam(param)}
              className="cursor-pointer"
            >
              <KPICard 
                title={param.replace(/_pct|_tph|_c/g, '').replace(/_/g, ' ')}
                value={val}
                unit={param.includes('pct') ? '%' : (param.includes('tph') ? 'TPH' : (param.includes('ph') ? 'pH' : ''))}
                status={isSelected ? 'cyan' : 'green'}
                subtitle={isSelected ? 'Selected Chart' : 'Click to Plot'}
              />
            </div>
          );
        })}
      </div>

      {/* 3. Main Central Diagnostics (Gauge & Live Scrolling Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <GaugeChart 
            title={gaugeSpec.title}
            value={gaugeSpec.val}
            min={gaugeSpec.min}
            max={gaugeSpec.max}
            unit={gaugeSpec.unit}
            status={gaugeSpec.status}
          />
        </div>
        <div className="lg:col-span-8">
          <SensorChart 
            title={`Real-Time Chronology: ${selectedParam.replace(/_/g, ' ').toUpperCase()}`}
            data={history}
            dataKey="value"
            status={gaugeSpec.status}
            unit={gaugeSpec.unit}
            height={260}
          />
        </div>
      </div>

      {/* 4. Lower Stage Panels (Stage-Specific Alerts & AI Optimizations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <AlertFeed alerts={restData.alerts || []} />
        </div>
        <div className="lg:col-span-7">
          <AIRecommendations recommendations={restData.recommendations || []} />
        </div>
      </div>
    </div>
  );
}
