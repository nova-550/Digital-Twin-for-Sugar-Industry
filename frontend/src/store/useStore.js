import { create } from 'zustand';

export const useStore = create((set, get) => {
  let ws = null;
  let reconnectTimer = null;

  return {
    connected: false,
    telemetry: null,
    activeStage: null,
    selectedParam: '',
    history: [],
    overrides: {},

    // Connects to high-frequency WebSocket telemetry broadcast
    connectWs: () => {
      if (ws && ws.readyState === WebSocket.OPEN) return;
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProto}//${window.location.host}/ws/live`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        set({ connected: true });
        clearTimeout(reconnectTimer);
        console.log('SCADA WebSocket synchronized.');
      };

      ws.onmessage = (evt) => {
        try {
          const packet = JSON.parse(evt.data);
          set({ telemetry: packet });

          // If the operator is watching a specific parameter, append the live tick to history!
          const { activeStage, selectedParam, history } = get();
          if (activeStage && selectedParam && packet.state?.[activeStage]?.[selectedParam] !== undefined) {
            const newVal = packet.state[activeStage][selectedParam];
            const ts = packet.ts;
            const updatedHistory = [...history, { ts, value: newVal }];
            
            // Limit to 120 scrolling entries
            if (updatedHistory.length > 120) updatedHistory.shift();
            set({ history: updatedHistory });
          }
        } catch (e) {
          console.warn('SCADA WS parse error:', e);
        }
      };

      ws.onclose = () => {
        set({ connected: false });
        // Attempt automatic reconnection every 2 seconds
        reconnectTimer = setTimeout(() => get().connectWs(), 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    },

    disconnectWs: () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    },

    // Changes the isolated refinery stage (Cane reception, milling, clarifier...)
    selectStage: (stageId) => {
      set({ activeStage: stageId });
      
      // Select the primary process parameter of the stage automatically when clicked
      const defaults = {
        cane_handling: 'cane_feed_rate_tph',
        milling: 'imbibition_water_pct',
        clarification: 'estimated_ph',
        evaporation: 'juice_brix_out_pct',
        crystallization: 'supersaturation_coeff',
        centrifugation: 'final_sugar_purity_pct'
      };
      
      if (stageId && defaults[stageId]) {
        get().selectParam(defaults[stageId]);
      }
    },

    // Triggers history preload from REST and targets parameter
    selectParam: async (param) => {
      const { activeStage } = get();
      if (!activeStage || !param) return;

      set({ selectedParam: param });

      try {
        const res = await fetch(`/api/history/${activeStage}/${param}?n=120`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        set({ history: json.data || [] });
      } catch (e) {
        console.warn(`History preloading failed for ${activeStage}.${param}:`, e);
      }
    },

    // Submits manual SCADA operator setpoint overrides
    sendOverride: async (stageId, parameter, value) => {
      try {
        const res = await fetch('/api/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage_id: stageId, parameter, value: parseFloat(value) })
        });
        
        if (res.ok) {
          set((state) => {
            const stageOverrides = state.overrides[stageId] || {};
            return {
              overrides: {
                ...state.overrides,
                [stageId]: { ...stageOverrides, [parameter]: parseFloat(value) }
              }
            };
          });
        }
      } catch (e) {
        console.error('SCADA Override command dispatch failed:', e);
      }
    },

    // Resets overrides to automated refinery loops
    clearOverrides: async () => {
      try {
        const res = await fetch('/api/clear_overrides', { method: 'POST' });
        if (res.ok) {
          set({ overrides: {} });
        }
      } catch (e) {
        console.error('DCS clear overrides failed:', e);
      }
    }
  };
});
