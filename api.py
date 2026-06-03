import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from database import init_db
from simulator import simulator
from physics_engine import (
    cane_handling_model, milling_model, clarification_model,
    evaporation_model, crystallization_model, centrifugation_model
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="SugarTech SCADA Digital Twin API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # High-performance flex development settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def serve_index():
    return FileResponse("static/index.html")

class OverrideRequest(BaseModel):
    stage_id: str
    parameter: str
    value: float

class SimulateRequest(BaseModel):
    # Cane Handling Inputs
    cane_feed_rate_tph: float
    trash_pct: float
    cane_pol_pct: float
    cane_brix_pct: float
    # Milling Inputs
    imbibition_water_pct: float
    mill_speed_rpm: float
    bagasse_moisture_pct: float
    # Clarification Inputs
    lime_dosage_kg_tc: float
    clarification_temp_c: float
    # Evaporation Inputs
    steam_flow_tph: float
    steam_economy: float
    # Crystallization Inputs
    supersaturation_coeff: float
    vacuum_pressure_mbar: float
    # Centrifugation Inputs
    centrifuge_speed_rpm: float
    wash_water_m3_hr: float

@app.post("/api/simulate")
async def run_simulate(req: SimulateRequest):
    try:
        # Step 1: Cane Handling
        ch_inputs = {
            "cane_feed_rate_tph": req.cane_feed_rate_tph,
            "trash_pct": req.trash_pct,
            "cane_pol_pct": req.cane_pol_pct,
            "cane_brix_pct": req.cane_brix_pct
        }
        ch_outputs = cane_handling_model(ch_inputs)
        
        # --- TRACK A: Machine Learning (Standard) ---
        # Step 2: Milling
        m_inputs = {
            "imbibition_water_pct": req.imbibition_water_pct,
            "mill_speed_rpm": req.mill_speed_rpm,
            "bagasse_moisture_pct": req.bagasse_moisture_pct
        }
        m_outputs = milling_model(m_inputs, ch_outputs, force_physics=False)
        
        # Step 3: Clarification
        cl_inputs = {
            "lime_dosage_kg_tc": req.lime_dosage_kg_tc,
            "clarification_temp_c": req.clarification_temp_c
        }
        cl_outputs = clarification_model(cl_inputs, m_outputs)
        
        # Step 4: Evaporation
        ev_inputs = {
            "juice_brix_in_pct": m_outputs.get("juice_brix_pct", 15.2),
            "steam_flow_tph": req.steam_flow_tph,
            "steam_economy": req.steam_economy
        }
        ev_outputs = evaporation_model(ev_inputs, cl_outputs)
        
        # Step 5: Crystallization
        cr_inputs = {
            "supersaturation_coeff": req.supersaturation_coeff,
            "vacuum_pressure_mbar": req.vacuum_pressure_mbar
        }
        cr_outputs = crystallization_model(cr_inputs, ev_outputs)
        
        # Step 6: Centrifugation
        ce_inputs = {
            "centrifuge_speed_rpm": req.centrifuge_speed_rpm,
            "wash_water_m3_hr": req.wash_water_m3_hr
        }
        ce_outputs = centrifugation_model(ce_inputs, cr_outputs)
        
        # --- TRACK B: Pure Physics Fallback ---
        m_outputs_phys = milling_model(m_inputs, ch_outputs, force_physics=True)
        cl_outputs_phys = clarification_model(cl_inputs, m_outputs_phys)
        
        ev_inputs_phys = {
            "juice_brix_in_pct": m_outputs_phys.get("juice_brix_pct", 15.2),
            "steam_flow_tph": req.steam_flow_tph,
            "steam_economy": req.steam_economy
        }
        ev_outputs_phys = evaporation_model(ev_inputs_phys, cl_outputs_phys)
        cr_outputs_phys = crystallization_model(cr_inputs, ev_outputs_phys)
        ce_outputs_phys = centrifugation_model(ce_inputs, cr_outputs_phys)

        return {
            "status": "success",
            "stages": {
                "cane_handling": {**ch_inputs, **ch_outputs},
                "milling": {**m_inputs, **m_outputs},
                "clarification": {**cl_inputs, **cl_outputs},
                "evaporation": {**ev_inputs, **ev_outputs},
                "crystallization": {**cr_inputs, **cr_outputs},
                "centrifugation": {**ce_inputs, **ce_outputs}
            },
            "stages_physics": {
                "cane_handling": {**ch_inputs, **ch_outputs},
                "milling": {**m_inputs, **m_outputs_phys},
                "clarification": {**cl_inputs, **cl_outputs_phys},
                "evaporation": {**ev_inputs_phys, **ev_outputs_phys},
                "crystallization": {**cr_inputs, **cr_outputs_phys},
                "centrifugation": {**ce_inputs, **ce_outputs_phys}
            }
        }
    except Exception as e:
        logger.error(f"Sandbox simulation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

# --- Real-Time Industrial Alarm Detector ---
def detect_alarms(state: Dict[str, Dict[str, float]]) -> List[Dict[str, Any]]:
    alarms = []
    
    # 1. Milling alarms
    mill = state.get("milling", {})
    imb = mill.get("imbibition_water_pct", 25.0)
    if imb < 22.0:
        alarms.append({"stage_id": "milling", "parameter": "imbibition_water_pct", "severity": "WARNING", "message": "Water spray is too low! We are leaving valuable sugar behind in the waste fiber. (Fix: Increase Imbibition Water)", "value": imb})
    elif imb > 28.0:
        alarms.append({"stage_id": "milling", "parameter": "imbibition_water_pct", "severity": "WARNING", "message": "Water spray is too high! The juice is too watery, putting a heavy load on evaporators. (Fix: Decrease Imbibition Water)", "value": imb})

    # 2. Clarifier pH alarms (ISA standard thresholds)
    clarif = state.get("clarification", {})
    ph = clarif.get("estimated_ph", 7.2)
    if ph < 6.4:
        alarms.append({"stage_id": "clarification", "parameter": "estimated_ph", "severity": "CRITICAL", "message": "Juice is too acidic! The acid is actively destroying the sugar molecules. (Fix: Increase Lime Dosing)", "value": ph})
    elif ph < 6.8:
        alarms.append({"stage_id": "clarification", "parameter": "estimated_ph", "severity": "WARNING", "message": "Juice is slightly acidic. Dirt and impurities won't settle properly. (Fix: Increase Lime Dosing slightly)", "value": ph})
    elif ph > 8.0:
        alarms.append({"stage_id": "clarification", "parameter": "estimated_ph", "severity": "CRITICAL", "message": "Juice is too alkaline! This will cause heavy mineral scale buildup in the heaters. (Fix: Decrease Lime Dosing)", "value": ph})

    # 3. Evaporator alarms
    evap = state.get("evaporation", {})
    brix_out = evap.get("juice_brix_out_pct", 62.0)
    if brix_out < 57.0:
        alarms.append({"stage_id": "evaporation", "parameter": "juice_brix_out_pct", "severity": "WARNING", "message": "Syrup is too watery! Crystallization pans will have to work much harder to boil it. (Fix: Increase Steam Flow)", "value": brix_out})

    # 4. Crystallizer false grain risk
    cryst = state.get("crystallization", {})
    sat = cryst.get("supersaturation_coeff", 1.15)
    if sat > 1.28:
        alarms.append({"stage_id": "crystallization", "parameter": "supersaturation_coeff", "severity": "CRITICAL", "message": "Syrup is too thick! Tiny unwanted 'false crystals' will form and ruin the batch. (Fix: Decrease Supersaturation or adjust vacuum)", "value": sat})
    elif sat < 1.02:
        alarms.append({"stage_id": "crystallization", "parameter": "supersaturation_coeff", "severity": "WARNING", "message": "Syrup is too thin! The liquid is actually melting the sugar crystals we already grew. (Fix: Increase Supersaturation)", "value": sat})

    # 5. Centrifuge purity failures
    centr = state.get("centrifugation", {})
    purity = centr.get("final_sugar_purity_pct", 99.5)
    if purity < 99.0:
        alarms.append({"stage_id": "centrifugation", "parameter": "final_sugar_purity_pct", "severity": "CRITICAL", "message": "Sugar purity is too low! The crystals still have brown molasses stuck to them. (Fix: Increase Centrifuge Speed or Wash Water)", "value": purity})

    return alarms

# --- Real-Time Industrial Optimization Co-Pilot ---
def generate_co_pilot_recs(state: Dict[str, Dict[str, float]], alarms: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    recs = []
    
    # 1. Actionable pH optimization
    clarif = state.get("clarification", {})
    ph = clarif.get("estimated_ph", 7.2)
    if abs(7.2 - ph) > 0.1:
        lime_target = 0.82 if ph > 7.2 else 0.88
        recs.append({
            "stage_id": "clarification",
            "category": "safety",
            "priority": "High" if abs(7.2 - ph) > 0.5 else "Medium",
            "recommendation": f"Adjust lime dosing to {lime_target} kg/TC to stabilize pH.",
            "reasoning": f"The current juice pH is {ph}. Keeping it at 7.2 pH ensures impurities settle out perfectly.",
            "expected_impact": "Purity increase of +0.8%"
        })

    # 2. Imbibition optimization
    mill = state.get("milling", {})
    imb = mill.get("imbibition_water_pct", 25.0)
    extraction = mill.get("mill_extraction_pct", 95.0)
    if extraction < 96.0 and imb < 28.0:
        recs.append({
            "stage_id": "milling",
            "category": "throughput",
            "priority": "Medium",
            "recommendation": "Increase water spray (imbibition) to 27.5%.",
            "reasoning": f"Only {extraction}% of the sugar is being extracted from the cane. Extra water helps wash out remaining sugar.",
            "expected_impact": "Extraction boost to 96.8%"
        })

    # 3. Evaporator scale optimizations
    evap = state.get("evaporation", {})
    steam = evap.get("actual_steam_needed_tph", 42.0)
    if steam > 45.0:
        recs.append({
            "stage_id": "evaporation",
            "category": "energy",
            "priority": "High",
            "recommendation": "Clean the evaporator tubes to remove mineral scale.",
            "reasoning": "High steam usage detected because mineral scaling is blocking heat from boiling the juice efficiently.",
            "expected_impact": "Steam savings of -4.2 T/H"
        })

    # Add general check if no warnings
    if not recs:
        recs.append({
            "stage_id": "plant",
            "category": "throughput",
            "priority": "Low",
            "recommendation": "Keep current settings - everything is running smoothly.",
            "reasoning": "All factory stages are operating at peak efficiency with no issues.",
            "expected_impact": "Optimal plant operations"
        })

    return recs

# --- REST Endpoints ---
@app.get("/api/dashboard")
async def get_dashboard():
    """Returns the full latest twin status snapshot."""
    snapshot = await simulator.get_latest_snapshot()
    alarms = detect_alarms(snapshot["state"])
    recs = generate_co_pilot_recs(snapshot["state"], alarms)
    
    return {
        **snapshot,
        "alerts": alarms,
        "recommendations": recs
    }

@app.post("/api/override")
async def set_override(req: OverrideRequest):
    """Register a manual SCADA override."""
    await simulator.update_override(req.stage_id, req.parameter, req.value)
    return {"status": "success", "stage_id": req.stage_id, "parameter": req.parameter, "value": req.value}

@app.post("/api/clear_overrides")
async def clear_all_overrides():
    """Resets to full plant automation."""
    await simulator.clear_overrides()
    return {"status": "success"}

@app.get("/api/history/{stage_id}/{param}")
async def get_param_history(stage_id: str, param: str, n: int = 120):
    """Retrieves time-series data for chart updates."""
    data = await simulator.get_history(stage_id, param, n=n)
    return {"stage_id": stage_id, "param": param, "data": data}

@app.get("/api/archive")
async def get_archive_logs(stage_id: str, parameter: str, limit: int = 100):
    """Retrieves historical logs from the SQLite database asynchronously."""
    from database import AsyncSessionLocal, ProcessTelemetry
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ProcessTelemetry)
            .where(ProcessTelemetry.stage_id == stage_id)
            .where(ProcessTelemetry.parameter == parameter)
            .order_by(ProcessTelemetry.timestamp.desc())
            .limit(limit)
        )
        logs = result.scalars().all()
        
        return {
            "status": "success",
            "stage_id": stage_id,
            "parameter": parameter,
            "count": len(logs),
            "data": [
                {
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                    "value": round(log.value, 3) if log.value is not None else None
                } for log in logs
            ]
        }

@app.get("/api/health")
async def health():
    return {"status": "synchronized", "time": datetime.now(timezone.utc).isoformat()}

# --- WebSocket Broadcast Hub ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New SCADA client session active. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"SCADA client session terminated. Remaining: {len(self.active_connections)}")

    async def broadcast_snapshot(self):
        if not self.active_connections:
            return
        
        snapshot = await simulator.get_latest_snapshot()
        alarms = detect_alarms(snapshot["state"])
        recs = generate_co_pilot_recs(snapshot["state"], alarms)
        
        packet = {
            **snapshot,
            "alerts": alarms,
            "recommendations": recs
        }
        
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(packet)
            except Exception:
                dead_connections.append(connection)
                
        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keeps connection alive and registers ping packets
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket session crash: {e}")
        manager.disconnect(websocket)

# --- Startup Lifespan ---
@app.on_event("startup")
async def startup():
    # 1. Initialize SQLite database schema
    await init_db()
    # 2. Run simulation engine thread
    asyncio.create_task(simulator.start_loop())
    # 3. Run WebSocket live broadcaster thread (1Hz ticks)
    asyncio.create_task(broadcast_loop())
    logger.info("SCADA Distributed Control System (DCS) online.")

async def broadcast_loop():
    while True:
        await asyncio.sleep(1.0)
        try:
            await manager.broadcast_snapshot()
        except Exception as e:
            logger.error(f"WebSocket broadcast failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False, log_level="info")
