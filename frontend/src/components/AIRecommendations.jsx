import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, ArrowRight, Zap, Target, Gauge } from 'lucide-react';

export default function AIRecommendations({ recommendations = [] }) {
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
    <div className="panel flex flex-col h-full overflow-hidden" style={{ minHeight: 280 }}>
      <div className="flex justify-between items-center mb-3">
        <span className="panel-title flex items-center gap-1.5" style={{ marginBottom: 0 }}>
          <Cpu size={12} /> Real-Time Co-Pilot Recommendations
        </span>
        <span className="text-[10px] uppercase font-bold text-muted flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          <span className="pulse-dot purple" style={{ width: 6, height: 6 }} /> Active Optimization
        </span>
      </div>

      <div className="divider opacity-30 my-2" />

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[300px]">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(180,79,255,0.05)', border: '1px solid rgba(180,79,255,0.1)' }}>
              <Cpu size={16} style={{ color: 'var(--purple)' }} />
            </div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Co-pilot analyzing mill data</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Calculating physics-model optimizations</p>
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
                transition={{ delay: idx * 0.05 }}
                className="p-3.5 rounded-lg border text-xs flex flex-col justify-between"
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

                <div className="flex justify-between items-center text-[10px] mt-0.5 font-bold">
                  <span style={{ color: 'var(--text-muted)' }}>
                    Expected Impact:
                  </span>
                  <span style={{ color: impactColor }} className="flex items-center gap-1">
                    <ArrowRight size={10} /> {rec.expected_impact || 'Optimized operation'}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
