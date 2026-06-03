import React, { useState } from 'react';
import { Cpu, Info, BarChart2, TrendingUp, AlertCircle } from 'lucide-react';

const FEATURE_IMPORTANCES = [
  { key: 'cane_feed_rate_tph', label: 'Conveyor Feed Rate', weight: 38, desc: 'Direct raw volume load on crushing mills. Excessive rates lead to slippage losses.' },
  { key: 'imbibition_water_pct', label: 'Imbibition Water Ratio', weight: 28, desc: 'Dilution water sprayed on bagasse to wash out sucrose. High flow increases extraction but dilutes juice.' },
  { key: 'mill_speed_rpm', label: 'Roller RPM Speed', weight: 16, desc: 'Rotational speed of crushing rollers. Controls pressing pressure and throughput rate.' },
  { key: 'cane_pol_pct', label: 'Cane Sucrose (Pol) %', weight: 10, desc: 'Density of pure sugar content in raw sugarcane feedstock.' },
  { key: 'trash_pct', label: 'Cane Trash Impurity', weight: 5, desc: 'Soil and dry leaves in cane feed. Absorbent trash traps extracted juice as waste.' },
  { key: 'bagasse_moisture_pct', label: 'Bagasse Moisture Spec', weight: 3, desc: 'Indicator of roller pressure efficiency. Higher pressing leaves less juice in bagasse.' }
];

// Pre-generated validation dataset points mapping Physics vs ML Milling Extraction (%)
const VALIDATION_POINTS = [
  { x: 92.5, y: 92.8 }, { x: 94.1, y: 93.9 }, { x: 91.0, y: 91.6 }, { x: 96.2, y: 95.8 },
  { x: 95.0, y: 95.4 }, { x: 93.3, y: 92.9 }, { x: 89.8, y: 90.2 }, { x: 97.4, y: 97.1 },
  { x: 94.6, y: 94.9 }, { x: 92.8, y: 93.4 }, { x: 95.5, y: 95.2 }, { x: 93.9, y: 94.5 },
  { x: 91.8, y: 91.2 }, { x: 96.8, y: 96.4 }, { x: 90.5, y: 90.9 }, { x: 94.2, y: 94.0 },
  { x: 93.0, y: 93.7 }, { x: 95.2, y: 95.7 }, { x: 96.0, y: 95.3 }, { x: 92.1, y: 92.5 }
];

export default function SimulatorDiagnostics({ inputs, activeResults, activeResultsPhysics }) {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Extract milling extraction rates
  const mlExtraction = activeResults?.milling?.mill_extraction_pct ?? 94.5;
  const physicsExtraction = activeResultsPhysics?.milling?.mill_extraction_pct ?? 94.2;

  // Scatter plot SVG sizing
  const width = 300;
  const height = 220;
  const paddingX = 35;
  const paddingY = 25;

  // Map values (88% - 99%) to coordinates
  const minVal = 88;
  const maxVal = 99;
  
  const mapX = (val) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return paddingX + ((clamped - minVal) / (maxVal - minVal)) * (width - paddingX - 10);
  };

  const mapY = (val) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    // SVG Y grows downward, so we subtract from height
    return height - paddingY - ((clamped - minVal) / (maxVal - minVal)) * (height - paddingY - 10);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2 animate-fade-in">
      
      {/* Column 1: Feature Importances */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase mb-1">
            <BarChart2 size={14} className="text-sky-500" /> Random Forest Feature Importance
          </span>
          <p className="text-[10px] text-slate-500 leading-snug">
            Relative weight contribution of parameters to the Machine Learning extraction predictions.
          </p>
        </div>

        <div className="flex flex-col gap-3.5 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          {FEATURE_IMPORTANCES.map((feat) => {
            const isHovered = hoveredFeature === feat.key;
            return (
              <div 
                key={feat.key}
                onMouseEnter={() => setHoveredFeature(feat.key)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className={`${isHovered ? 'text-sky-600' : 'text-slate-600'} transition-colors`}>
                    {feat.label}
                  </span>
                  <span className="mono text-sky-600 font-extrabold">{feat.weight}%</span>
                </div>
                
                {/* Visual Bar */}
                <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden border border-slate-200/20 relative">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-sky-400 to-indigo-500"
                    style={{ 
                      width: `${feat.weight}%`,
                      filter: isHovered ? 'brightness(1.1) drop-shadow(0 0 2px rgba(14,165,233,0.3))' : 'none'
                    }}
                  />
                </div>

                {/* Inline Description on Hover */}
                {isHovered && (
                  <div className="text-[9px] text-slate-500 bg-white border border-slate-100 p-1.5 rounded shadow-sm leading-normal animate-slide-in">
                    {feat.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Column 2: Actual vs predicted scatter plot */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase mb-1">
            <TrendingUp size={14} className="text-sky-500" /> Model Accuracy Scatter Plot
          </span>
          <p className="text-[10px] text-slate-500 leading-snug">
            Milling Extraction Efficiency: ML Predictions vs. Analytical Physics equations.
          </p>
        </div>

        <div className="flex flex-col items-center bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          <svg 
            width="100%" 
            height={height} 
            viewBox={`0 0 ${width} ${height}`} 
            className="select-none font-mono text-[8px] font-bold"
          >
            {/* Grid background */}
            <rect x={paddingX} y="10" width={width - paddingX - 10} height={height - paddingY - 10} fill="rgba(255,255,255,0.7)" stroke="#e2e8f0" strokeWidth="0.8" />
            
            {/* Grid dashed lines */}
            {[90, 93, 96, 99].map(tick => (
              <React.Fragment key={tick}>
                {/* Horizontal */}
                <line 
                  x1={paddingX} 
                  y1={mapY(tick)} 
                  x2={width - 10} 
                  y2={mapY(tick)} 
                  stroke="#e2e8f0" 
                  strokeDasharray="2 2" 
                />
                <text x={paddingX - 5} y={mapY(tick) + 2} textAnchor="end" fill="#94a3b8">{tick}%</text>
                
                {/* Vertical */}
                <line 
                  x1={mapX(tick)} 
                  y1="10" 
                  x2={mapX(tick)} 
                  y2={height - paddingY} 
                  stroke="#e2e8f0" 
                  strokeDasharray="2 2" 
                />
                <text x={mapX(tick)} y={height - paddingY + 10} textAnchor="middle" fill="#94a3b8">{tick}%</text>
              </React.Fragment>
            ))}

            {/* Regression reference 45 degree line (Actual = Predicted) */}
            <line 
              x1={mapX(88)} 
              y1={mapY(88)} 
              x2={mapX(99)} 
              y2={mapY(99)} 
              stroke="var(--text-faint)" 
              strokeWidth="1.2" 
              strokeDasharray="3 3"
            />
            
            {/* Validation data dots */}
            {VALIDATION_POINTS.map((pt, idx) => (
              <circle 
                key={idx} 
                cx={mapX(pt.x)} 
                cy={mapY(pt.y)} 
                r="2.2" 
                fill="var(--text-muted)" 
                opacity="0.35" 
              />
            ))}

            {/* Pulsing current state dot */}
            <g>
              <circle 
                cx={mapX(physicsExtraction)} 
                cy={mapY(mlExtraction)} 
                r="7" 
                fill="var(--cyan-dim)" 
                className="animate-ping" 
                style={{ transformOrigin: `${mapX(physicsExtraction)}px ${mapY(mlExtraction)}px`, animationDuration: '1.5s' }}
              />
              <circle 
                cx={mapX(physicsExtraction)} 
                cy={mapY(mlExtraction)} 
                r="4" 
                fill={Math.abs(mlExtraction - physicsExtraction) > 1.2 ? 'var(--amber)' : 'var(--green)'} 
                stroke="white" 
                strokeWidth="1"
              />
            </g>

            {/* Labels */}
            <text x={width / 2 + 10} y={height - 2} textAnchor="middle" fill="var(--text-muted)" className="font-sans font-bold text-[7px] uppercase tracking-wider">Physics Calculation (Theoretical)</text>
            
            <text 
              x="8" 
              y={height / 2 - 10} 
              textAnchor="middle" 
              fill="var(--text-muted)" 
              className="font-sans font-bold text-[7px] uppercase tracking-wider"
              transform={`rotate(-90, 8, ${height / 2 - 10})`}
            >
              ML Prediction (Empirical)
            </text>

            {/* Active Legend Tag */}
            <g transform={`translate(${mapX(physicsExtraction) + 8}, ${mapY(mlExtraction) - 8})`}>
              <rect x="0" y="0" width="76" height="12" rx="3" fill="var(--text-primary)" opacity="0.9" />
              <text x="38" y="9" textAnchor="middle" fill="white" className="text-[7px] font-extrabold uppercase">Active Config</text>
            </g>
          </svg>

          <div className="flex justify-between w-full mt-1.5 text-[9px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#94a3b8] opacity-50" /> Validation Log</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Active Run: {mlExtraction.toFixed(2)}%</span>
            <span className="flex items-center gap-1 text-[8px] text-amber-600">
              <AlertCircle size={10} /> Discrepancy: {Math.abs(mlExtraction - physicsExtraction).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Explainability Card */}
      <div className="md:col-span-2 bg-sky-950/95 text-white p-3 rounded-lg border border-sky-900 flex gap-3 items-start backdrop-blur-md">
        <Cpu className="text-sky-400 shrink-0 mt-0.5" size={16} />
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">Explainable AI (XAI) diagnostics</span>
          <p className="text-[9.5px] leading-relaxed text-sky-200">
            Physical equations represent the <strong>ideal theoretical refinery</strong>. The ML model adapts dynamically to 
            <strong> real-world sensor degradation and roller wear-and-tear</strong>. 
            When sliding values, the green/red indicator moves in real time. Larger differences (discrepancies) 
            indicate higher physical stresses or operating conditions where empirical models diverge from ideal theory.
          </p>
        </div>
      </div>

    </div>
  );
}
