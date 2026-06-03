import asyncio
import time
import random
import logging
import math
from datetime import datetime, timezone
from typing import Dict, Any, List
import numpy as np

from database import log_telemetry
from physics_engine import (
    cane_handling_model, milling_model, clarification_model,
    evaporation_model, crystallization_model, centrifugation_model
)

logger = logging.getLogger(__name__)

# --- Primary Default Baseline Settings ---
DEFAULT_BASELINES = {
    "cane_handling": {
        "cane_feed_rate_tph": 210.0,
        "trash_pct": 3.5,
        "cane_pol_pct": 18.2,
        "cane_brix_pct": 20.5
    },
    "milling": {
        "imbibition_water_pct": 25.0,
        "mill_speed_rpm": 4.2,
        "bagasse_moisture_pct": 50.5
    },
    "clarification": {
        "lime_dosage_kg_tc": 0.85,
        "clarification_temp_c": 102.0
    },
    "evaporation": {
        "juice_brix_in_pct": 15.2,
        "steam_flow_tph": 42.0,
        "steam_economy": 3.4
    },
    "crystallization": {
        "supersaturation_coeff": 1.15,
        "vacuum_pressure_mbar": 68.0
    },
    "centrifugation": {
        "centrifuge_speed_rpm": 1080.0,
        "wash_water_m3_hr": 0.8
    }
}

class SugarmillSimulator:
    def __init__(self):
        self.baselines = {stage: dict(vals) for stage, vals in DEFAULT_BASELINES.items()}
        # Stores active manual overrides from the control room
        self.overrides: Dict[str, Dict[str, float]] = {stage: {} for stage in DEFAULT_BASELINES}
        self.latest_state: Dict[str, Dict[str, float]] = {}
        self.history_buffers: Dict[str, List[Dict[str, Any]]] = {}
        self.is_running = False
        self._lock = asyncio.Lock()
        self._init_history_buffers()

    def _init_history_buffers(self):
        for stage, params in DEFAULT_BASELINES.items():
            for param in params:
                self.history_buffers[f"{stage}.{param}"] = []

    async def update_override(self, stage_id: str, parameter: str, value: float):
        """Allows real-time manual control overrides from SCADA desk."""
        async with self._lock:
            if stage_id in self.overrides:
                self.overrides[stage_id][parameter] = float(value)
                logger.info(f"SCADA override registered: {stage_id}.{parameter} = {value}")

    async def clear_overrides(self):
        """Resets all loops to automated factory defaults."""
        async with self._lock:
            self.overrides = {stage: {} for stage in DEFAULT_BASELINES}
            logger.info("SCADA overrides reset to automatic control loops.")

    def _apply_fluctuations(self, stage: str, param: str, base_val: float) -> float:
        """Injects micro-noise and sinus drifts to replicate true sensor noise."""
        # Check if there is an active operator override
        if param in self.overrides[stage]:
            return self.overrides[stage][param]
            
        noise_std = base_val * 0.005 # 0.5% standard deviation noise
        drift = base_val * 0.01 * math.sin(time.time() / 120.0) # sinusoidal slow thermal drift
        fluctuated = base_val + np.random.normal(0, noise_std) + drift
        
        # Guard limits to keep values physically realistic
        if "pct" in param or "efficiency" in param:
            return max(0.0, min(100.0, fluctuated))
        if "ph" in param:
            return max(1.0, min(14.0, fluctuated))
        return max(0.0, fluctuated)

    async def get_latest_snapshot(self) -> Dict[str, Any]:
        """Returns the full twin dashboard snapshot."""
        async with self._lock:
            # Derived KPI math (OEE and Tonnage integrals)
            feed = self.latest_state.get("cane_handling", {}).get("net_cane_tph", 202.0)
            recovery = self.latest_state.get("milling", {}).get("mill_extraction_pct", 94.0) * 0.12
            sugar_out = self.latest_state.get("centrifugation", {}).get("sugar_tph", 22.0)
            
            # Plant-wide KPI models
            water_int = (self.latest_state.get("milling", {}).get("imbibition_tph", 52.0)) / max(feed, 1.0)
            energy_int = 38.0 + (abs(feed - 210.0) * 0.02)
            co2 = feed * 0.01 + 42.0 # CO2 emissions based on throughput
            oee = 85.0 + (98.0 - recovery) * 0.2
            oee = min(99.0, max(65.0, oee))

            return {
                "ts": datetime.now(timezone.utc).isoformat(),
                "state": self.latest_state,
                "plant_kpis": [
                    {"name": "Plant Throughput", "value": round(feed, 1), "status": "green" if feed > 190 else "amber"},
                    {"name": "Sugar Recovery", "value": round(recovery, 2), "status": "green" if recovery > 11.2 else "amber"},
                    {"name": "Energy Intensity", "value": round(energy_int, 2), "status": "green"},
                    {"name": "Water Usage", "value": round(water_int, 3), "status": "green" if water_int < 1.4 else "amber"},
                    {"name": "CO₂ Emissions", "value": round(co2, 1), "status": "green"},
                    {"name": "Plant OEE", "value": round(oee, 1), "status": "green"}
                ],
                "shift": {
                    "shift_name": "A-Shift (Morning)",
                    "operator": "Dr. Patil",
                    "crush_target_tons": 5000,
                    "shift_progress_pct": 68.2,
                    "cane_crushed_tons": int(feed * 7.5),
                    "sugar_produced_tons": round(sugar_out * 7.5, 1),
                    "projected_revenue_usd": int(sugar_out * 7.5 * 380.0)
                }
            }

    async def get_history(self, stage_id: str, param: str, n: int = 120) -> List[Dict]:
        """Returns historical time-series entries for sparklines and Plotly."""
        async with self._lock:
            key = f"{stage_id}.{param}"
            return self.history_buffers.get(key, [])[-n:]

    async def start_loop(self):
        """Asynchronous telemetry loop running at 1Hz."""
        self.is_running = True
        logger.info("Digital Twin Simulator loop initiated.")
        
        while self.is_running:
            try:
                async with self._lock:
                    # 1. Sample inputs with dynamic noise
                    sampled = {}
                    for stage, params in self.baselines.items():
                        sampled[stage] = {p: self._apply_fluctuations(stage, p, val) for p, val in params.items()}

                    # 2. Propagate inputs through mass & energy balance physics
                    outputs = {}
                    
                    outputs["cane_handling"] = cane_handling_model(sampled["cane_handling"])
                    
                    # Mill receives shredded cane flow
                    outputs["milling"] = milling_model(
                        sampled["milling"], 
                        outputs["cane_handling"]
                    )
                    
                    # Clarifier receives extracted raw juice
                    outputs["clarification"] = clarification_model(
                        sampled["clarification"], 
                        outputs["milling"]
                    )
                    
                    # Evaporator concentrations
                    outputs["evaporation"] = evaporation_model(
                        sampled["evaporation"], 
                        outputs["clarification"]
                    )
                    
                    # Vacuum pans boiling crystallizations
                    outputs["crystallization"] = crystallization_model(
                        sampled["crystallization"], 
                        outputs["evaporation"]
                    )
                    
                    # Centrifugal purifications
                    outputs["centrifugation"] = centrifugation_model(
                        sampled["centrifugation"], 
                        outputs["crystallization"]
                    )

                    # 3. Fuse samples & outputs into atomic stage state packages
                    self.latest_state = {}
                    for stage in DEFAULT_BASELINES:
                        self.latest_state[stage] = {**sampled[stage], **outputs[stage]}

                    # 4. Save and append to history buffers
                    ts = datetime.now(timezone.utc).isoformat()
                    for stage, data in self.latest_state.items():
                        for param, val in data.items():
                            key = f"{stage}.{param}"
                            if key not in self.history_buffers:
                                self.history_buffers[key] = []
                            self.history_buffers[key].append({"ts": ts, "value": val})
                            if len(self.history_buffers[key]) > 300:
                                self.history_buffers[key].pop(0)

                # 5. Log variables asynchronously to SQLite (primary metrics only)
                for stage, data in self.latest_state.items():
                    for key_param in ["imbibition_water_pct", "juice_brix_pct", "estimated_ph", "juice_brix_out_pct", "supersaturation_coeff", "final_sugar_purity_pct"]:
                        if key_param in data:
                            await log_telemetry(stage, key_param, data[key_param])

            except Exception as e:
                logger.error(f"Simulator core loop crash: {e}", exc_info=True)

            await asyncio.sleep(1.0)

# Global singleton coordinator
simulator = SugarmillSimulator()
