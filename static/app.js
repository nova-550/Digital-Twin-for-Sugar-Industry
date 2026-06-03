// SugarTech SCADA Digital Twin — Embedded Client Coordinator (Vanilla JS)

// Global Store State
const State = {
  connected: false,
  telemetry: null,
  activeStage: null,
  selectedParam: '',
  history: [], // [{ts, value}]
  overrides: {},
  prevValues: {} // Used for detecting updates to trigger HMI flash alarms
};

let ws = null;
let chart = null;
let reconnectTimer = null;

// Primary process parameters per stage
const stageParams = {
  cane_handling: 'cane_feed_rate_tph',
  milling: 'imbibition_water_pct',
  clarification: 'estimated_ph',
  evaporation: 'juice_brix_out_pct',
  crystallization: 'supersaturation_coeff',
  centrifugation: 'final_sugar_purity_pct'
};

// Initial Setup on DOM load
window.addEventListener('DOMContentLoaded', () => {
  initWs();
  initChart();
  setupDcsMenuTriggers();
  
  if (window.initThreeDModel) {
    window.initThreeDModel();
  }
  
  // Initialize newly built workspaces
  if (window.syncArchiveParamDropdown) {
    window.syncArchiveParamDropdown();
  }
  if (window.runWhatIfCalculation) {
    window.runWhatIfCalculation();
  }
  
  // Start clock display
  updateClock();
  setInterval(updateClock, 1000);
});

// --- Clock Update ---
function updateClock() {
  const el = document.getElementById('live-time-display');
  if (el) {
    el.innerText = new Date().toLocaleTimeString();
  }
}

// --- 1. WebSocket Telemetry Stream ---
function initWs() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  // Dynamically resolve relative WS host based on active URL
  const loc = window.location;
  const wsProto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProto}//${loc.host}/ws/live`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    State.connected = true;
    updateConnectionIndicator(true);
    clearTimeout(reconnectTimer);
    console.log('DCS active socket synchronized.');
  };

  ws.onmessage = (evt) => {
    try {
      const packet = JSON.parse(evt.data);
      State.telemetry = packet;
      
      // Update global dashboard variables
      updatePlantKpis(packet.plant_kpis);
      updateShiftProgress(packet.shift);
      updateAlarmsFeed(packet.alerts);
      updateCoPilotRecs(packet.recommendations);
      updatePidLiveReadouts(packet.state);
      updateHmiGearsAndStatus(packet.stage_health);

      // Sync WebGL text indicators on 3D tab
      const conveyorReadout = document.getElementById('webgl-readout-conveyor');
      if (conveyorReadout && packet.state?.cane_handling?.cane_feed_rate_tph) {
        conveyorReadout.innerText = `${packet.state.cane_handling.cane_feed_rate_tph.toFixed(1)} T/H`;
      }
      const rollersReadout = document.getElementById('webgl-readout-rollers');
      if (rollersReadout && packet.state?.milling?.mill_speed_rpm) {
        rollersReadout.innerText = `${packet.state.milling.mill_speed_rpm.toFixed(1)} RPM`;
      }
      const phReadout = document.getElementById('webgl-readout-pH');
      if (phReadout && packet.state?.clarification?.estimated_ph) {
        phReadout.innerText = `${packet.state.clarification.estimated_ph.toFixed(2)} pH`;
      }
      const centrifugeReadout = document.getElementById('webgl-readout-centrifuge');
      if (centrifugeReadout && packet.state?.centrifugation?.centrifuge_speed_rpm) {
        centrifugeReadout.innerText = `${packet.state.centrifugation.centrifuge_speed_rpm.toFixed(0)} RPM`;
      }

      // Sync real-time 3D spatial models
      if (window.updateThreeJsModels && packet.state) {
        window.updateThreeJsModels(packet.state);
      }

      // Append live ticker value if watching parameter history
      if (State.activeStage && State.selectedParam) {
        const val = packet.state?.[State.activeStage]?.[State.selectedParam];
        if (val !== undefined) {
          State.history.push({ ts: packet.ts, value: val });
          if (State.history.length > 120) State.history.shift();
          updateChartData();
        }
      }
    } catch (e) {
      console.warn('DCS telemetry packet exception:', e);
    }
  };

  ws.onclose = () => {
    State.connected = false;
    updateConnectionIndicator(false);
    reconnectTimer = setTimeout(initWs, 2000);
  };
}

function updateConnectionIndicator(active) {
  const dot = document.getElementById('header-status-dot');
  const label = document.getElementById('header-status-label');
  const fDot = document.getElementById('footer-status-dot');
  const fLabel = document.getElementById('footer-status-label');
  
  if (active) {
    if (dot) dot.className = 'pulse-dot green';
    if (label) label.innerText = 'WS: ACTIVE';
    if (fDot) fDot.className = 'pulse-dot green';
    if (fLabel) fLabel.innerText = 'SCADA ONLINE — TELEMETRY TUNED AT 1HZ';
  } else {
    if (dot) dot.className = 'pulse-dot red';
    if (label) label.innerText = 'WS: OFFLINE';
    if (fDot) fDot.className = 'pulse-dot red';
    if (fLabel) fLabel.innerText = 'TELEMETRY OFFLINE — RECONNECTING';
  }
}

// --- 2. Live HMI DOM Updates ---
function updatePlantKpis(kpis) {
  if (!kpis) return;
  kpis.forEach(k => {
    // Map KPI name to card elements
    const slug = k.name.toLowerCase().replace(/\s+/g, '-');
    const valEl = document.getElementById(`kpi-val-${slug}`);
    
    if (valEl) {
      const formatted = typeof k.value === 'number' ? k.value.toFixed(1) : k.value;
      const prev = State.prevValues[k.name];
      
      if (prev !== undefined && prev !== k.value) {
        valEl.classList.add('value-updated');
        setTimeout(() => valEl.classList.remove('value-updated'), 600);
      }
      
      valEl.innerText = formatted;
      State.prevValues[k.name] = k.value;
    }
  });
}

function updateShiftProgress(shift) {
  if (!shift) return;
  
  // Progress bar
  const bar = document.getElementById('shift-progress-bar');
  if (bar) bar.style.width = `${shift.shift_progress_pct}%`;
  
  const lbl = document.getElementById('shift-progress-label');
  if (lbl) lbl.innerText = `${shift.shift_progress_pct.toFixed(1)}%`;
  
  const crushed = document.getElementById('shift-val-crushed');
  if (crushed) crushed.innerText = shift.cane_crushed_tons.toLocaleString();
  
  const sugar = document.getElementById('shift-val-sugar');
  if (sugar) sugar.innerText = shift.sugar_produced_tons.toLocaleString();
  
  const revenue = document.getElementById('shift-val-revenue');
  if (revenue) revenue.innerText = `$${shift.projected_revenue_usd.toLocaleString()}`;
}

function updateAlarmsFeed(alerts) {
  const container = document.getElementById('alarms-container');
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted);">
        <span class="pulse-dot green" style="width: 10px; height: 10px; margin-bottom: 8px;"></span>
        <p style="font-weight: 700; font-size: 12px; color: var(--text-primary);">DCS: All systems nominal</p>
        <p style="font-size: 10px;">Continuous mass-balances validated.</p>
      </div>`;
    return;
  }

  container.innerHTML = alerts.map(a => {
    const isCrit = a.severity === 'CRITICAL';
    const border = isCrit ? 'var(--red)' : 'var(--amber)';
    const bg = isCrit ? 'rgba(220, 38, 38, 0.01)' : 'rgba(217, 119, 6, 0.01)';
    const dotColor = isCrit ? 'red' : 'amber';

    return `
      <div class="alarm-item" style="border-left: 3px solid ${border}; background: ${bg}; margin-bottom: 8px;">
        <span class="pulse-dot ${dotColor}" style="margin-top: 4px;"></span>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <strong style="text-transform: uppercase; font-size: 10px; color: var(--text-primary);">${a.stage_id.replace('_', ' ')}</strong>
            <span class="badge ${isCrit ? 'badge-red' : 'badge-amber'}">${a.severity}</span>
          </div>
          <p style="color: var(--text-secondary); margin-top: 2px; font-weight: 600; font-size: 11px;">${a.message}</p>
        </div>
        <span class="mono" style="font-size: 9.5px; background: var(--cyan-dim); padding: 1px 4px; border-radius: 3px; font-weight: 700;">
          ${a.value.toFixed(1)}
        </span>
      </div>`;
  }).join('');
}

function updateCoPilotRecs(recs) {
  const container = document.getElementById('recs-container');
  if (!container) return;

  if (recs.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 20px; color: var(--text-muted);">Co-pilot is matching physical metrics...</p>`;
    return;
  }

  container.innerHTML = recs.map(r => {
    const impactColor = r.category === 'energy' ? 'var(--purple)' : (r.category === 'throughput' ? 'var(--cyan)' : 'var(--red)');
    return `
      <div style="border: 1px solid var(--border); border-left: 3px solid ${impactColor}; padding: 10px 14px; border-radius: var(--radius-sm); background: var(--bg-card); margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="text-transform: uppercase; font-size: 9.5px; color: ${impactColor};">${r.category} MPC</strong>
          <span class="badge badge-cyan" style="font-size: 8px; padding: 0px 4px;">Priority: ${r.priority}</span>
        </div>
        <h4 style="font-size: 11.5px; font-weight: 700; color: var(--text-primary);">${r.recommendation}</h4>
        <p style="font-size: 10.5px; color: var(--text-secondary); margin-top: 3px; font-weight: 600; line-height: 1.4;">${r.reasoning}</p>
        <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 700; border-top: 1px dashed var(--border); margin-top: 8px; padding-top: 6px;">
          <span style="color: var(--text-muted);">Expected MPC Impact:</span>
          <span style="color: ${impactColor};">${r.expected_impact}</span>
        </div>
      </div>`;
  }).join('');
}

function updatePidLiveReadouts(state) {
  if (!state) return;
  // Write live parameters directly adjacent to P&ID instrumentation SVG boxes
  Object.keys(state).forEach(stage => {
    Object.keys(state[stage]).forEach(param => {
      const el = document.getElementById(`pid-val-${stage}-${param}`);
      if (el) {
        const val = state[stage][param];
        el.textContent = typeof val === 'number' ? val.toFixed(1) : val;
      }
    });
  });
}

function updateHmiGearsAndStatus(stageHealth) {
  if (!stageHealth) return;
  Object.keys(stageHealth).forEach(stage => {
    const health = stageHealth[stage];
    
    // Update HTML Card border colors depending on health
    const borderEl = document.getElementById(`hmi-bound-${stage}`);
    if (borderEl) {
      const color = health.status === 'RED' ? 'var(--red)' : (health.status === 'YELLOW' ? 'var(--amber)' : 'var(--border)');
      borderEl.style.borderColor = color;
      
      // Update custom status classes
      borderEl.classList.remove('red', 'amber');
      if (health.status === 'RED') {
        borderEl.classList.add('red');
      } else if (health.status === 'YELLOW') {
        borderEl.classList.add('amber');
      }
    }

    // Render health scores in top nav buttons (compatibility)
    const navScore = document.getElementById(`nav-score-${stage}`);
    if (navScore) {
      navScore.innerText = `${health.health_score}%`;
      const dot = document.getElementById(`nav-dot-${stage}`);
      if (dot) {
        dot.className = `pulse-dot ${health.status === 'RED' ? 'red' : (health.status === 'YELLOW' ? 'amber' : 'green')}`;
      }
    }
    
    // Bottom selector indicators style synchronization
    const bottomScore = document.getElementById(`bottom-health-${stage}`);
    if (bottomScore) {
      bottomScore.innerText = `${health.health_score}% Health`;
      bottomScore.className = `badge ${health.status === 'RED' ? 'badge-red' : (health.status === 'YELLOW' ? 'badge-amber' : 'badge-green')}`;
    }
  });

  // Dynamic progress fill micro-animations matching physical simulation
  if (State.telemetry?.state) {
    const state = State.telemetry.state;
    
    // Stage 1
    const feed = state.cane_handling?.cane_feed_rate_tph || 210;
    const feedPct = Math.min(100, Math.max(0, ((feed - 100) / 200) * 100));
    const fill1 = document.getElementById('visual-fill-cane_feed_rate_tph');
    if (fill1) fill1.style.width = `${feedPct}%`;

    // Stage 2
    const imb = state.milling?.imbibition_water_pct || 25;
    const imbPct = Math.min(100, Math.max(0, ((imb - 15) / 25) * 100));
    const fill2 = document.getElementById('visual-fill-imbibition_water_pct');
    if (fill2) fill2.style.width = `${imbPct}%`;

    // Stage 3
    const ph = state.clarification?.estimated_ph || 7.2;
    const phPct = Math.min(100, Math.max(0, ((ph - 6.0) / 2.2) * 100));
    const fill3 = document.getElementById('visual-fill-estimated_ph');
    if (fill3) fill3.style.width = `${phPct}%`;

    // Stage 4
    const brix = state.evaporation?.juice_brix_out_pct || 62;
    const brixPct = Math.min(100, Math.max(0, ((brix - 40) / 35) * 100));
    const fill4 = document.getElementById('visual-fill-juice_brix_out_pct');
    if (fill4) fill4.style.width = `${brixPct}%`;

    // Stage 5
    const sat = state.crystallization?.supersaturation_coeff || 1.15;
    const satPct = Math.min(100, Math.max(0, ((sat - 0.9) / 0.5) * 100));
    const fill5 = document.getElementById('visual-fill-supersaturation_coeff');
    if (fill5) fill5.style.width = `${satPct}%`;

    // Stage 6
    const purity = state.centrifugation?.final_sugar_purity_pct || 99.5;
    const purityPct = Math.min(100, Math.max(0, ((purity - 98.0) / 2.0) * 100));
    const fill6 = document.getElementById('visual-fill-final_sugar_purity_pct');
    if (fill6) fill6.style.width = `${purityPct}%`;
  }
}

// --- 3. SCADA Interactive P&ID Clicks ---
function setupDcsMenuTriggers() {
  // Navigation button listeners (compatibility)
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-stage');
      selectStage(id || null);
    });
  });

  // HMI Block card click listener setups
  const hmiBounds = document.querySelectorAll('.hmi-reactor-bound');
  hmiBounds.forEach(b => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-stage');
      selectStage(id);
    });
  });
}

async function selectStage(stageId) {
  State.activeStage = stageId;
  
  // Highlight targeted navigation button
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    const id = btn.getAttribute('data-stage');
    if ((id === null && stageId === null) || (id === stageId)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Draw active border inside selected HMI bounds
  const hmiBounds = document.querySelectorAll('.hmi-reactor-bound');
  hmiBounds.forEach(b => {
    const id = b.getAttribute('data-stage');
    if (id === stageId) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  // Build override sliders
  renderOverrideDeskSliders(stageId);

  // If a stage is selected, auto-plot its primary sensor
  if (stageId && stageParams[stageId]) {
    await selectParam(stageParams[stageId]);
  } else {
    // Hide details chart if Overview clicked
    hideChartBox();
  }
}

async function selectParam(param) {
  if (!State.activeStage || !param) return;
  State.selectedParam = param;
  
  // Mark active targeted slider item
  const items = document.querySelectorAll('.override-item');
  items.forEach(it => {
    if (it.getAttribute('data-param') === param) {
      it.style.borderColor = 'var(--cyan)';
      it.style.background = 'var(--cyan-dim)';
    } else {
      it.style.borderColor = 'var(--border)';
      it.style.background = 'white';
    }
  });

  // Preload historical data from REST API
  try {
    const res = await fetch(`/api/history/${State.activeStage}/${param}?n=120`);
    const json = await res.json();
    State.history = json.data || [];
    showChartBox();
    updateChartData();
  } catch (e) {
    console.warn('Preload history failed:', e);
  }
}

// --- 4. Dynamic SCADA Override Panel Slider Builder ---
function renderOverrideDeskSliders(stageId) {
  const container = document.getElementById('override-controls-wrapper');
  const dcsNotice = document.getElementById('override-desk-notice');
  const dcsTitle = document.getElementById('override-desk-title');
  const resetBtn = document.getElementById('override-reset-btn');

  if (!stageId) {
    dcsTitle.innerHTML = `<span class="panel-title" style="margin-bottom: 0px;">OVERRIDE CONTROLLER DESK</span>`;
    if (resetBtn) resetBtn.style.display = 'none';
    if (dcsNotice) dcsNotice.style.display = 'none';
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 24px; color: var(--cyan-dim); margin-bottom: 8px;">📊</div>
          <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-primary); margin-bottom: 4px;">Override Controller Desk</h4>
          <p style="font-size: 10px; max-width: 200px; margin: 0 auto; line-height: 1.4;">Select any refining machinery sector inside the workflow grid above to mount manual override loops.</p>
        </div>`;
    }
    return;
  }

  // Active stage configurations
  const stageNames = {
    cane_handling: '01. CANE CONVEYOR',
    milling: '02. EXTRACTION MILL',
    clarification: '03. LIME CLARIFIER',
    evaporation: '04. EVAPORATORS',
    crystallization: '05. VACUUM PANS',
    centrifugation: '06. DECANTER CENTRIFUGALS'
  };

  dcsTitle.innerHTML = `<span class="panel-title" style="margin-bottom: 0px; color: var(--text-primary);"><span class="pulse-dot purple" style="margin-right: 6px;"></span> MANUAL OVERRIDE: ${stageNames[stageId]}</span>`;
  if (resetBtn) resetBtn.style.display = 'flex';
  if (dcsNotice) dcsNotice.style.display = 'flex';

  const configs = {
    cane_handling: [
      { param: 'cane_feed_rate_tph', label: 'Conveyor Feed Rate', min: 100, max: 300, step: 5, unit: 'T/H', desc: 'Adjusts clean sugarcane volume feeding refinery mills.' },
      { param: 'trash_pct', label: 'Cane Trash Impurity', min: 0.5, max: 10.0, step: 0.1, unit: '%', desc: 'Simulates raw bagasse debris ratios.' }
    ],
    milling: [
      { param: 'imbibition_water_pct', label: 'Imbibition Water Ratio', min: 15.0, max: 40.0, step: 0.5, unit: '%', desc: 'Maceration water nozzle flow dilution. High water extracts bound sugar.' },
      { param: 'mill_speed_rpm', label: 'Roller RPM Speed', min: 2.0, max: 8.0, step: 0.1, unit: 'RPM', desc: 'Calibrates rotor mill speed.' }
    ],
    clarification: [
      { param: 'lime_dosage_kg_tc', label: 'Lime Milk Dosing', min: 0.4, max: 1.6, step: 0.02, unit: 'kg/TC', desc: 'Tuning chemical buffer loop. 7.2 pH extracts maximum purity.' },
      { param: 'clarification_temp_c', label: 'Heater Exchanger Temp', min: 85.0, max: 115.0, step: 0.5, unit: '°C', desc: 'Regulates heater exchange temperature.' }
    ],
    evaporation: [
      { param: 'steam_flow_tph', label: 'Heating Steam Flow', min: 20.0, max: 60.0, step: 0.5, unit: 'T/H', desc: 'Primary boiler steam delivery flow.' }
    ],
    crystallization: [
      { param: 'supersaturation_coeff', label: 'Target Supersaturation', min: 0.90, max: 1.40, step: 0.01, unit: 'coeff', desc: 'Viscosity control loop. High values (>1.28) crystalize spontaneous False Grain.' },
      { param: 'vacuum_pressure_mbar', label: 'Pan Condenser Vacuum', min: 40.0, max: 100.0, step: 1, unit: 'mbar', desc: 'Regulates vacuum boiling pressure.' }
    ],
    centrifugation: [
      { param: 'centrifuge_speed_rpm', label: 'Rotor Basket Speed', min: 800.0, max: 1400.0, step: 10, unit: 'RPM', desc: 'Speed curves driving crystal decanter separation force.' },
      { param: 'wash_water_m3_hr', label: 'Crystals Purge Wash Water', min: 0.2, max: 2.0, step: 0.1, unit: 'm³/H', desc: 'Clean wash water volume sprayed inside rotating decanters.' }
    ]
  };

  const sliders = configs[stageId] || [];

  if (container) {
    container.innerHTML = sliders.map(s => {
      const isManual = State.overrides[stageId]?.[s.param] !== undefined;
      const currentVal = isManual ? State.overrides[stageId][s.param] : (State.telemetry?.state?.[stageId]?.[s.param] ?? s.min);

      return `
        <div class="override-item" data-param="${s.param}" onclick="selectParam('${s.param}')" style="cursor: pointer; margin-top: 10px; transition: all 0.2s;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong style="font-size: 10px; color: var(--text-primary);">${s.label}</strong>
              ${isManual ? '<span class="badge badge-amber" style="font-size: 7px; padding: 0 3px;">Manual</span>' : ''}
            </div>
            <span class="mono" style="font-size: 11px; font-weight: 700; color: var(--cyan);" id="slider-val-${s.param}">
              ${currentVal.toFixed(s.step % 1 === 0 ? 0 : 2)} <span style="font-size: 8px; color: var(--text-muted);">${s.unit}</span>
            </span>
          </div>
          
          <div class="slider-container" style="margin-top: 4px;">
            <input 
              type="range" 
              min="${s.min}" 
              max="${s.max}" 
              step="${s.step}" 
              value="${currentVal}"
              class="override-slider"
              oninput="handleDcsSliderMove('${stageId}', '${s.param}', this.value)"
            />
          </div>
          <p style="font-size: 9px; color: var(--text-secondary); line-height: 1.3; margin-top: 3px;">${s.desc}</p>
        </div>`;
    }).join('');
  }

  // Sync styling of active param slider
  if (State.selectedParam) {
    selectParam(State.selectedParam);
  }
}

window.handleDcsSliderMove = (stageId, param, val) => {
  const value = parseFloat(val);
  const displayVal = document.getElementById(`slider-val-${param}`);
  if (displayVal) {
    displayVal.innerHTML = `${value.toFixed(param.includes('speed') || param.includes('pressure') ? 0 : 1)} <span style="font-size: 8px; color: var(--text-muted);"></span>`;
  }
  
  // Immediate async DCS override setpoint transmission
  sendOverride(stageId, param, value);
};

async function sendOverride(stageId, parameter, value) {
  try {
    const res = await fetch('/api/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId, parameter, value: parseFloat(value) })
    });
    
    if (res.ok) {
      if (!State.overrides[stageId]) State.overrides[stageId] = {};
      State.overrides[stageId][parameter] = value;
      
      // Update manual badge immediately without waiting for websocket
      const badge = document.querySelector(`.override-item[data-param="${parameter}"] .badge-amber`);
      if (!badge) {
        renderOverrideDeskSliders(stageId);
      }
    }
  } catch (e) {
    console.error('SCADA dispatch failed:', e);
  }
}

window.clearDcsOverrides = async () => {
  try {
    const res = await fetch('/api/clear_overrides', { method: 'POST' });
    if (res.ok) {
      State.overrides = {};
      renderOverrideDeskSliders(State.activeStage);
    }
  } catch (e) {
    console.error('Reset loops failed:', e);
  }
};

// --- 5. High-Performance HTML5 Canvas Scrolling Plots (Chart.js) ---
function initChart() {
  const ctx = document.getElementById('scada-diagnostics-canvas');
  if (!ctx) return;

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Live Telemetry',
        data: [],
        borderColor: '#06b6d4', // Cyberpunk Neon Cyan
        borderWidth: 2.4,
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        fill: true,
        pointRadius: 1.5,
        pointBackgroundColor: '#06b6d4',
        tension: 0.15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: 'rgba(6, 182, 212, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 9, family: 'var(--font-mono)' } }
        },
        y: {
          grid: { color: 'rgba(6, 182, 212, 0.10)' },
          ticks: { color: '#94a3b8', font: { size: 9, family: 'var(--font-mono)' } }
        }
      }
    }
  });
}

function updateChartData() {
  if (!chart || State.history.length === 0) return;

  const labels = State.history.map(h => {
    if (!h.ts) return '';
    const d = new Date(h.ts);
    return d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const dataPoints = State.history.map(h => h.value);

  chart.data.labels = labels;
  chart.data.datasets[0].data = dataPoints;
  
  // Set custom plot label
  const labelEl = document.getElementById('chart-heading-label');
  if (labelEl) {
    labelEl.innerText = `Real-Time Sensor Plot: ${State.activeStage.replace('_', ' ').toUpperCase()} -> ${State.selectedParam.replace(/_/g, ' ').toUpperCase()}`;
  }

  // Smooth, non-blocking render tick
  chart.update('none');
}

function showChartBox() {
  const ph = document.getElementById('chart-placeholder-card');
  const active = document.getElementById('chart-active-card');
  if (ph) ph.style.display = 'none';
  if (active) active.style.display = 'block';
}

function hideChartBox() {
  const ph = document.getElementById('chart-placeholder-card');
  const active = document.getElementById('chart-active-card');
  if (ph) ph.style.display = 'flex';
  if (active) active.style.display = 'none';
}

// --- 6. WORKSPACE TAB WORKFLOWS ---
window.switchWorkspaceTab = (tabId) => {
  // Toggle sidebar tab active classes
  document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle page visibility
  document.querySelectorAll('.tab-page').forEach(page => {
    if (page.id === `tab-${tabId}`) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }
  });

  // Force WebGL Canvas size refit when spatial twin opens
  if (tabId === 'three-twin') {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }
};

// --- 7. WHAT-IF AI PREDICTION MODEL ---
window.runWhatIfCalculation = () => {
  const intakeSlider = document.getElementById('wi-slider-intake');
  const boilerSlider = document.getElementById('wi-slider-boiler');
  const waterSlider = document.getElementById('wi-slider-water');
  
  if (!intakeSlider || !boilerSlider || !waterSlider) return;

  const intake = parseFloat(intakeSlider.value);
  const boiler = parseFloat(boilerSlider.value);
  const water = parseFloat(waterSlider.value);

  // Sync numerical slider labels
  document.getElementById('wi-val-intake').innerText = intake.toLocaleString();
  document.getElementById('wi-val-boiler').innerText = boiler;
  document.getElementById('wi-val-water').innerText = water;

  // Real-time ESG & Tonnage Forecast calculations
  const sugarYield = (intake * 0.116 * (boiler / 85.0)).toFixed(1);
  const waterIntensity = (1.25 * (1.0 - (water - 60) / 100.0)).toFixed(2);
  const carbonOffset = (84.8 * (boiler / 85.0) * (water / 60.0)).toFixed(1);

  // Update glowing forecast labels
  document.getElementById('forecast-sugar-yield').innerHTML = `${parseFloat(sugarYield).toLocaleString()} <span style="font-size: 12px; color: var(--text-muted);">T/Day</span>`;
  document.getElementById('forecast-water-intensity').innerHTML = `${waterIntensity} <span style="font-size: 12px; color: var(--text-muted);">m³/T</span>`;
  document.getElementById('forecast-carbon-offset').innerHTML = `${parseFloat(carbonOffset).toLocaleString()} <span style="font-size: 12px; color: var(--text-muted);">T CO₂/Day</span>`;
};

// --- 8. SQL DATABASE TIME-SERIES ARCHIVE LOADER ---
const stageParametersList = {
  cane_handling: [
    { value: 'cane_feed_rate_tph', text: 'Cane Feed Rate (FI-101)' },
    { value: 'trash_pct', text: 'Cane Trash Impurity (QI-102)' }
  ],
  milling: [
    { value: 'imbibition_water_pct', text: 'Imbibition Water Ratio (FIC-102)' },
    { value: 'mill_speed_rpm', text: 'Roller RPM Speed (SIC-103)' }
  ],
  clarification: [
    { value: 'lime_dosage_kg_tc', text: 'Lime Milk Dosing (AIC-201)' },
    { value: 'clarification_temp_c', text: 'Exchanger Ex-Temp (TIC-202)' },
    { value: 'estimated_ph', text: 'Estimated Clarified pH (QI-203)' }
  ],
  evaporation: [
    { value: 'steam_flow_tph', text: 'Heating Steam Flow (FIC-301)' },
    { value: 'juice_brix_out_pct', text: 'Syrup Brix Outlet (BIC-301)' }
  ],
  crystallization: [
    { value: 'supersaturation_coeff', text: 'Target Supersaturation (MIC-401)' },
    { value: 'vacuum_pressure_mbar', text: 'Pan Condenser Vacuum (PIC-402)' }
  ],
  centrifugation: [
    { value: 'centrifuge_speed_rpm', text: 'Rotor Basket Speed (SIC-501)' },
    { value: 'wash_water_m3_hr', text: 'Wash Purge Water (FIC-502)' },
    { value: 'final_sugar_purity_pct', text: 'Sugar Crystals Purity (QI-502)' }
  ]
};

window.syncArchiveParamDropdown = () => {
  const stage = document.getElementById('archive-stage-select').value;
  const paramSelect = document.getElementById('archive-param-select');
  if (!paramSelect) return;

  const params = stageParametersList[stage] || [];
  paramSelect.innerHTML = params.map(p => `<option value="${p.value}">${p.text}</option>`).join('');
};

window.executeDatabaseArchiveQuery = async () => {
  const stage = document.getElementById('archive-stage-select').value;
  const param = document.getElementById('archive-param-select').value;
  const limit = document.getElementById('archive-limit-select').value;
  const tableBody = document.getElementById('archive-table-body');
  const countBadge = document.getElementById('archive-count-badge');

  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-secondary);">Querying SQLite central database plant_data.db...</td></tr>`;

  try {
    const res = await fetch(`/api/archive?stage_id=${stage}&parameter=${param}&limit=${limit}`);
    const json = await res.json();

    if (json.status === 'success' && json.data.length > 0) {
      countBadge.innerText = `${json.data.length} Rows Found`;
      countBadge.className = 'badge badge-cyan';

      tableBody.innerHTML = json.data.map(row => {
        const d = new Date(row.timestamp);
        const timeStr = d.toLocaleString();
        
        // Dynamic status check depending on parameter values
        let alertStatus = '<span class="badge badge-green">OPTIMAL</span>';
        if (param === 'estimated_ph') {
          if (row.value < 6.4) alertStatus = '<span class="badge badge-red">INVERSION CRIT</span>';
          else if (row.value < 6.8) alertStatus = '<span class="badge badge-amber">LOW pH WARN</span>';
          else if (row.value > 8.0) alertStatus = '<span class="badge badge-red">SCALE CRIT</span>';
        } else if (param === 'supersaturation_coeff' && row.value > 1.28) {
          alertStatus = '<span class="badge badge-red">FALSE GRAIN</span>';
        } else if (param === 'final_sugar_purity_pct' && row.value < 99.0) {
          alertStatus = '<span class="badge badge-red">PURITY CRIT</span>';
        }

        return `
          <tr>
            <td class="mono">${timeStr}</td>
            <td style="text-transform: capitalize;">${stage.replace('_', ' ')}</td>
            <td class="mono">${param}</td>
            <td class="mono" style="font-weight: 700;">${row.value}</td>
            <td>${alertStatus}</td>
          </tr>
        `;
      }).join('');
    } else {
      countBadge.innerText = '0 Rows Found';
      countBadge.className = 'badge badge-amber';
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">No records found in database archive for the selected variables.</td></tr>`;
    }
  } catch (e) {
    console.error('Fetch SQLite archive failed:', e);
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--red);">Database connection error. Failed to retrieve data records.</td></tr>`;
  }
};

// --- 9. ST-1 CO-PILOT GUIDED FACTORY WALKTHROUGH ---
let currentTourIndex = 0;
const tourSteps = [
  {
    stage: 'cane_handling',
    title: '🌾 Step 1/6: Cane Prep & Intake',
    desc: 'Uncleaned sugarcane is received and loaded onto conveyor grids. The SCADA telemetry tracks intake flow (Target: 210 T/H) and trash rates to prevent equipment wear.'
  },
  {
    stage: 'milling',
    title: '⚙️ Step 2/6: Sucrose Extraction',
    desc: 'Sugarcane is shredded and squeezed by high-pressure rollers. We spray hot imbibition water (Target: 25%) to rinse out bound sucrose fibers from raw bagasse.'
  },
  {
    stage: 'clarification',
    title: '🧪 Step 3/6: Juice Clarification',
    desc: 'Mixed raw juice is neutralized with lime milk and heated. The pH loop is extremely sensitive: maintaining exactly 7.2 pH prevents acid sucrose inversion losses.'
  },
  {
    stage: 'evaporation',
    title: '💨 Step 4/6: Brix Concentration',
    desc: 'Clarified juice flows through multi-effect calandrias to boil off water. The SCADA monitors steam economy coefficient, concentrating juice into a 62.0% Brix syrup.'
  },
  {
    stage: 'crystallization',
    title: '💎 Step 5/6: Vacuum Pan Boiling',
    desc: 'The thick syrup is boiled under deep vacuum to induce sucrose crystallization. Supersaturation coefficient must hover at 1.15 to avoid false grain nucleations.'
  },
  {
    stage: 'centrifugation',
    title: '🔄 Step 6/6: Crystal Decanting',
    desc: 'High-speed decanter centrifuges spin basket assemblies at 1080 RPM. Sugar crystals are separated from molasses and washed with water to yield 99.5% pure industrial grade.'
  }
];

window.startRefineryTour = () => {
  // Go to overview tab to show workflow cards
  switchWorkspaceTab('overview');
  currentTourIndex = 0;
  
  const overlay = document.getElementById('tour-overlay-box');
  if (overlay) {
    overlay.style.display = 'block';
    renderTourStep();
  }
};

window.terminateRefineryTour = () => {
  const overlay = document.getElementById('tour-overlay-box');
  if (overlay) overlay.style.display = 'none';
};

window.nextRefineryTourStep = () => {
  currentTourIndex++;
  if (currentTourIndex >= tourSteps.length) {
    terminateRefineryTour();
    return;
  }
  renderTourStep();
};

function renderTourStep() {
  const step = tourSteps[currentTourIndex];
  
  document.getElementById('tour-step-badge').innerText = `Step ${currentTourIndex + 1}/${tourSteps.length}`;
  document.getElementById('tour-step-title').innerText = step.title;
  document.getElementById('tour-step-desc').innerText = step.desc;
  
  // Highlight the targeted HMI block
  selectStage(step.stage);
  
  // Make the button say finish if it's the last step
  const nextBtn = document.getElementById('tour-next-btn');
  if (currentTourIndex === tourSteps.length - 1) {
    nextBtn.innerText = 'Complete Tour 🎉';
  } else {
    nextBtn.innerText = 'Next Step ➡️';
  }
}

// --- 10. TECHNICAL CONVERSATIONAL CHATBOT CO-PILOT ---
const chatbotReplies = {
  'inversion': 'Sucrose inversion is the chemical hydrolysis of sucrose into glucose and fructose, which cannot be crystallized and is lost in waste molasses. This occurs rapidly when juice pH falls below 6.4 (acidic environment) or at excessive temperatures. Maintaining exactly 7.2 pH using Milk of Lime dosing is absolutely critical to avoid this sucrose loss.',
  'brix': 'Juice Brix represents the percentage of dissolved solids in the juice. As the juice passes through our multi-effect evaporators, the Brix rises from 15.2% to 62.0%. A low Syrup Brix (<57%) increases the thermal duty and evaporation load on crystallizer vacuum pans, decreasing overall plant efficiency.',
  'false grain': 'False grain occurs when the supersaturation coefficient inside vacuum pans surges above 1.28, triggering spontaneous nucleation of micro-crystals. These micro-crystals clog centrifugal baskets and ruin the grain uniformity. To prevent false grain, vacuum pans use MIC-401 control loops to maintain supersaturation at exactly 1.15.',
  'centrifuge': 'Decanter centrifugals must spin at high speeds (up to 1400 RPM, standard baseline 1080 RPM) to generate a G-factor of over 900g. This massive centrifugal force separates the dense sugar crystals from the surrounding liquid molasses. A clean water spray wash removes molasses film, yielding 99.5% pure sugar crystals.',
  'boiler': 'The bagasse boiler is fueled by crushed sugarcane fiber (bagasse) bioproduct. It burns at high temperatures to generate process steam (Target 42.0 T/H). Optimizing the combustion control improves thermal efficiency, cuts carbon footprints (projected offset ~84.8 Tons/Day), and maintains stable evaporator heating.',
  'lime': 'Lime milk dosing (calcium hydroxide) is titrated into the raw juice to raise the pH from its raw acidic state (~5.2 pH) to exactly 7.2 pH. This acts as a chemical buffer to neutralize organic acids and causes the dissolved impurities to coagulate and settle as mud inside the clarifier.'
};

window.sendQuickChatQuery = (text) => {
  const field = document.getElementById('chat-input-field');
  if (field) {
    field.value = text;
    window.submitChatbotQuery();
  }
};

window.handleChatFieldKeydown = (event) => {
  if (event.key === 'Enter') {
    window.submitChatbotQuery();
  }
};

window.submitChatbotQuery = () => {
  const field = document.getElementById('chat-input-field');
  const messagesBox = document.getElementById('chatbot-messages-box');
  
  if (!field || !messagesBox || !field.value.trim()) return;
  
  const userText = field.value.trim();
  field.value = '';
  
  // Append user bubble
  appendChatBubble(userText, 'user');
  
  messagesBox.scrollTop = messagesBox.scrollHeight;
  
  // Process reply with subtle delay
  setTimeout(() => {
    const lowercaseText = userText.toLowerCase();
    let matchedReply = '';
    
    // Scan keywords
    if (lowercaseText.includes('inversion') || lowercaseText.includes('ph') || lowercaseText.includes('acid')) {
      matchedReply = chatbotReplies['inversion'];
    } else if (lowercaseText.includes('brix') || lowercaseText.includes('evaporat')) {
      matchedReply = chatbotReplies['brix'];
    } else if (lowercaseText.includes('grain') || lowercaseText.includes('nucleation') || lowercaseText.includes('supersat')) {
      matchedReply = chatbotReplies['false grain'];
    } else if (lowercaseText.includes('centrifug') || lowercaseText.includes('rotor') || lowercaseText.includes('g-factor')) {
      matchedReply = chatbotReplies['centrifuge'];
    } else if (lowercaseText.includes('boiler') || lowercaseText.includes('steam') || lowercaseText.includes('bagasse')) {
      matchedReply = chatbotReplies['boiler'];
    } else if (lowercaseText.includes('lime') || lowercaseText.includes('dose') || lowercaseText.includes('calcium')) {
      matchedReply = chatbotReplies['lime'];
    } else {
      matchedReply = `That is an excellent technical query! Regarding sugar refining automation: our SCADA console operates advanced Model Predictive Control (MPC) and closed-loop PID control blocks. In modern sugar mills, maintaining stable mass and thermal balances across the 6 refining sectors (Cane Prep, Milling, Clarification, Evaporation, Crystallization, and Centrifugation) is crucial. Feel free to adjust the sliders in the "What-If" AI Desk to see how production changes affect yield, water intensity, and carbon emissions. Let me know if you would like me to explain any specific sensor, e.g., FI-101 flow rate or QI-202 sugar recovery percentage.`;
    }
    
    appendChatBubble(matchedReply, 'bot');
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }, 400);
};

function appendChatBubble(text, sender) {
  const box = document.getElementById('chatbot-messages-box');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerText = text;
  box.appendChild(bubble);
}

// Safety baselines reference matching backend variables
const DEFAULT_BASELINES = {
  cane_handling: { cane_feed_rate_tph: 210.0, trash_pct: 3.5 },
  milling: { imbibition_water_pct: 25.0, mill_speed_rpm: 4.2 },
  clarification: { lime_dosage_kg_tc: 0.85, clarification_temp_c: 102.0 },
  evaporation: { steam_flow_tph: 42.0 },
  crystallization: { supersaturation_coeff: 1.15, vacuum_pressure_mbar: 68.0 },
  centrifugation: { centrifuge_speed_rpm: 1080.0, wash_water_m3_hr: 0.8 }
};
