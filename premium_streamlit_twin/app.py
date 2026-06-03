"""
app.py — Premium Sugar Mill SCADA Digital Twin & Control Room Dashboard
Streamlit implementation using high-fidelity dark-neon cyber aesthetics.
Features six completely differentiated HTML/CSS-injected metric cards.
Spawns background simulation loop and handles live SCADA manual overrides in memory.
"""
import streamlit as st
import sys
import os
import time
import asyncio
import threading
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timezone

# Ensure local imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import init_db, AsyncSessionLocal, ProcessTelemetry
from simulator import simulator
from components.charts import (
    live_trend_chart, kpi_gauge, sustainability_radar,
    whatif_comparison_chart, plant_kpi_trend, bottleneck_chart,
    stage_health_heatmap, sparkline
)
from components.live_widgets import (
    inject_live_clock, inject_counter_animation, live_revenue_ticker,
    heartbeat_widget, kpi_ticker_html, process_flow_svg, anomaly_ring_css
)
from components.svg_diagrams import get_stage_svg

# --- 1. System Set Page Layout Config ---
st.set_page_config(
    page_title="SugarTech Premium DCS HMI Panel",
    page_icon="⚙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- 2. Background Async Loop Thread Spawner ---
def run_simulator_async():
    """Runs database initialization and the simulator loop inside a dedicated background thread."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(init_db())
    loop.run_until_complete(simulator.start_loop())

@st.cache_resource
def start_digital_twin_engine():
    """Starts the 1Hz physics simulation background thread once."""
    thread = threading.Thread(target=run_simulator_async, daemon=True)
    thread.start()
    return thread

# Start background twin simulation daemon
start_digital_twin_engine()

# --- 3. Premium Cyber HMI CSS Styles Injections ---
st.markdown("""
<style>
    /* Premium dark cyber control room theme overrides */
    html, body, [data-testid="stAppViewContainer"] {
        background-color: #020817 !important;
        color: #E2E8F0 !important;
        font-family: 'Inter', -apple-system, sans-serif;
    }
    [data-testid="stSidebar"] {
        background-color: #0A0F1E !important;
        border-right: 1px solid rgba(0,212,255,0.12) !important;
    }
    
    /* Clean blueprint coordinate line background */
    [data-testid="stAppViewContainer"]::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image:
            linear-gradient(rgba(0, 212, 255, 0.008) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.008) 1px, transparent 1px);
        background-size: 30px 30px;
        pointer-events: none;
        z-index: 0;
    }
    
    /* Sleek frosted glass panel look */
    .scada-panel {
        background: rgba(10, 15, 30, 0.70) !important;
        border: 1px solid rgba(0, 212, 255, 0.15) !important;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 30px rgba(2, 8, 23, 0.4);
    }
    
    .panel-title {
        font-size: 11.5px;
        font-weight: 800;
        color: #00D4FF;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    /* Auto-refresh indicator pulse */
    .pulse-dot {
        display: inline-block;
        width: 8px; height: 8px;
        border-radius: 50%;
    }
    .pulse-dot.green {
        background: #00FF88;
        box-shadow: 0 0 8px #00FF88;
    }
    .pulse-dot.amber {
        background: #FFB800;
        box-shadow: 0 0 8px #FFB800;
    }
    .pulse-dot.red {
        background: #FF3366;
        box-shadow: 0 0 8px #FF3366;
    }
    
    /* Custom Scrollbars */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.15); border-radius: 99px; }
    
    /* Alarm rows styling */
    .alarm-row {
        background: rgba(255, 51, 102, 0.04);
        border: 1px solid rgba(255, 51, 102, 0.18);
        border-left: 4px solid #FF3366;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 12px;
        margin-bottom: 8px;
        color: #E2E8F0;
    }
    .alarm-row.alarm-warn {
        background: rgba(255, 184, 0, 0.04);
        border: 1px solid rgba(255, 184, 0, 0.18);
        border-left: 4px solid #FFB800;
    }
    
    /* Recommendation rows styling */
    .rec-row {
        background: rgba(0, 255, 136, 0.02);
        border: 1px solid rgba(0, 255, 136, 0.12);
        border-left: 4px solid #00FF88;
        padding: 12px 14px;
        border-radius: 6px;
        font-size: 12px;
        margin-bottom: 8px;
        color: #E2E8F0;
    }
</style>
""", unsafe_allow_html=True)

# Inject visual anomalies pulsing rings
st.html(anomaly_ring_css())
inject_counter_animation()

# --- 4. Live Telemetry Snapshot Retrieval ---
loop = asyncio.new_event_loop()
snapshot = loop.run_until_complete(simulator.get_latest_snapshot())
loop.close()

state = snapshot["state"]
plant_kpis = snapshot["plant_kpis"]
shift = snapshot["shift"]

# Stage alarms parser
def detect_alarms(state_dict) -> list:
    alarms = []
    
    # Milling alarms
    mill = state_dict.get("milling", {})
    imb = mill.get("imbibition_water_pct", 25.0)
    if imb < 22.0:
        alarms.append({"stage_id": "milling", "severity": "WARNING", "message": "Low imbibition water flow. Sucrose loss in bagasse suspected.", "value": imb})
    elif imb > 28.0:
        alarms.append({"stage_id": "milling", "severity": "WARNING", "message": "High imbibition dilution. Excessive load on evaporators.", "value": imb})

    # Clarifier pH alarms
    clarif = state_dict.get("clarification", {})
    ph = clarif.get("estimated_ph", 7.2)
    if ph < 6.4:
        alarms.append({"stage_id": "clarification", "severity": "CRITICAL", "message": "Severe acid hydrolysis! Sucrose inversion occurring rapidly.", "value": ph})
    elif ph < 6.8:
        alarms.append({"stage_id": "clarification", "severity": "WARNING", "message": "Sub-optimal pH. Clarification settling rate reduced.", "value": ph})
    elif ph > 8.0:
        alarms.append({"stage_id": "clarification", "severity": "CRITICAL", "message": "Alkaline scale hazard. High lime salts in evaporator heaters.", "value": ph})

    # Evaporator alarms
    evap = state_dict.get("evaporation", {})
    brix_out = evap.get("juice_brix_out_pct", 62.0)
    if brix_out < 57.0:
        alarms.append({"stage_id": "evaporation", "severity": "WARNING", "message": "Syrup Brix index low. High thermal duty on vacuum pans.", "value": brix_out})

    # Crystallizer false grain risk
    cryst = state_dict.get("crystallization", {})
    sat = cryst.get("supersaturation_coeff", 1.15)
    if sat > 1.28:
        alarms.append({"stage_id": "crystallization", "severity": "CRITICAL", "message": "HIGH SUPERSATURATION! Spontaneous nucleation risk.", "value": sat})
    elif sat < 1.02:
        alarms.append({"stage_id": "crystallization", "severity": "WARNING", "message": "Undersaturation detected. Crystal dissolution underway.", "value": sat})

    # Centrifuge purity failures
    centr = state_dict.get("centrifugation", {})
    purity = centr.get("final_sugar_purity_pct", 99.5)
    if purity < 99.0:
        alarms.append({"stage_id": "centrifugation", "severity": "CRITICAL", "message": "Sugar crystal purity below grade limits. Product dispatch blocked.", "value": purity})

    return alarms

alarms = detect_alarms(state)

# --- 5. Boxed Control-Desk Header Deck ---
st.markdown("""
<div style='background:rgba(10, 15, 30, 0.85); border:1px solid rgba(0, 212, 255, 0.2); border-radius:12px; padding:12px 24px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;'>
    <div style='display:flex; align-items:center; gap:16px;'>
        <div style='width:32px; height:32px; border-radius:6px; background:linear-gradient(135deg, #00D4FF, #B44FFF); display:flex; align-items:center; justify-content:center; font-weight:800; color:#020817; font-size:16px; font-family:monospace;'>ST</div>
        <div>
            <h1 style='color:#E2E8F0; font-size:16px; font-weight:900; margin:0; letter-spacing:1px; line-height:1.2; text-transform:uppercase;'>SugarTech DCS Console</h1>
            <span style='color:#00D4FF; font-size:9.5px; font-weight:800; font-family:monospace; tracking-widest:1.5px;'>SYSTEM SYNCHRONIZED — headLESS TWIN V3.0</span>
        </div>
    </div>
    <div id='hmi-header-widgets' style='display:flex; align-items:center; gap:24px;'>
        <div style='display:flex; align-items:center; gap:6px;'>
            <span class='pulse-dot green' id='hmi-sync-dot' style='width:6px; height:6px;'></span>
            <span style='font-size:10px; font-weight:800; color:#94A3B8; font-family:monospace;'>TELEMETRY TUNED 1HZ</span>
        </div>
        <div style='width:1px; height:18px; background:rgba(0, 212, 255, 0.15);'></div>
        <span id='live-clock' style='font-size:12.5px; font-weight:800; color:#00D4FF; font-family:monospace; letter-spacing:0.5px;'>--:--:--</span>
    </div>
</div>
""", unsafe_allow_html=True)
inject_live_clock()

# Scrolling Live KPI Ticker Header
ticker_items = []
for kpi in plant_kpis:
    ticker_items.append({
        "label": kpi["name"],
        "value": kpi["value"],
        "status": "GREEN" if kpi["status"] == "green" else ("YELLOW" if kpi["status"] == "amber" else "NORMAL")
    })
st.html(kpi_ticker_html(ticker_items))

# --- 6. Differentiated KPI Cards Matrix (HTML/CSS Injected) ---
def render_premium_kpi_cards(kpis):
    """
    Renders 6 highly differentiated and customized industrial-themed HTML/CSS metric cards.
    """
    throughput = next((k["value"] for k in kpis if k["name"] == "Plant Throughput"), 202.0)
    recovery = next((k["value"] for k in kpis if k["name"] == "Sugar Recovery"), 11.6)
    energy = next((k["value"] for k in kpis if k["name"] == "Energy Intensity"), 38.2)
    water = next((k["value"] for k in kpis if k["name"] == "Water Usage"), 1.25)
    co2 = next((k["value"] for k in kpis if k["name"] == "CO₂ Emissions"), 84.8)
    oee = next((k["value"] for k in kpis if k["name"] == "Plant OEE"), 88.5)

    # Card 1. Cane Throughput — Electric Blue Cybermatic Conveyor Belt
    card_throughput = f"""
    <div class="kpi-custom-card cyber-blue">
        <div class="kpi-title">🌾 Throughput</div>
        <div class="kpi-value">{throughput:.1f} <span class="kpi-unit">T/H</span></div>
        <div class="kpi-indicator-bar"><div class="bar-fill blue" style="width: {min(100.0, (throughput/210.0)*100.0)}%"></div></div>
        <div class="kpi-subtext">Conveyor FI-101 (210 nominal)</div>
    </div>
    """

    # Card 2. Sugar Recovery — Plasma Emerald Extraction Efficiency Dial
    card_recovery = f"""
    <div class="kpi-custom-card plasma-emerald">
        <div class="kpi-title">⚙️ Sugar Recovery</div>
        <div class="kpi-value" style="color: #00FF88;">{recovery:.2f} <span class="kpi-unit">%</span></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <div class="kpi-subtext" style="margin:0;">Sucrose QI-202</div>
            <div class="extraction-ring-mini"><div class="ring-fill" style="transform: rotate({min(360.0, (recovery/15.0)*360.0)}deg)"></div></div>
        </div>
    </div>
    """

    # Card 3. Energy Intensity — Molten Amber Boiling furnace calandria line
    card_energy = f"""
    <div class="kpi-custom-card molten-orange">
        <div class="kpi-title">🔥 Energy Intensity</div>
        <div class="kpi-value" style="color: #FF8800;">{energy:.1f} <span class="kpi-unit">kWh/T</span></div>
        <div class="pulse-flame-wave">
            <svg viewBox="0 0 100 10" width="100%" height="8px" style="display:block;">
                <path d="M0,5 Q12,0 24,5 T48,5 T72,5 T96,5 L100,5 L100,10 L0,10 Z" fill="rgba(255, 136, 0, 0.12)" stroke="#FF8800" stroke-width="1.5"></path>
            </svg>
        </div>
        <div class="kpi-subtext" style="margin-top:2px;">Boiler EI-301 limit 38.0</div>
    </div>
    """

    # Card 4. Water Intensity — Flowing Teal Maceration Spray Wave Loop
    card_water = f"""
    <div class="kpi-custom-card flowing-teal">
        <div class="kpi-title">💧 Water Usage</div>
        <div class="kpi-value" style="color: #00FFD4;">{water:.3f} <span class="kpi-unit">m³/T</span></div>
        <div class="water-wave-anim"><div class="wave"></div></div>
        <div class="kpi-subtext" style="position:relative; z-index:1;">Recycle WI-102 (1.2 limit)</div>
    </div>
    """

    # Card 5. CO₂ Emissions — Mint Green Carbon Footprint Offset
    card_co2 = f"""
    <div class="kpi-custom-card carbon-mint">
        <div class="kpi-title">🌳 CO₂ Emissions</div>
        <div class="kpi-value" style="color: #34D399;">{co2:.1f} <span class="kpi-unit">T/Day</span></div>
        <div class="carbon-mitigation-indicator">
            <span class="pulse-dot green" style="width:5px; height:5px;"></span> Offset active
        </div>
        <div class="kpi-subtext">Carbon cap 85.0 Max</div>
    </div>
    """

    # Card 6. Plant OEE — Crown Gold Enterprise Royal highlighting
    card_oee = f"""
    <div class="kpi-custom-card crown-gold">
        <div class="oee-crown-glare"></div>
        <div class="kpi-title" style="color: #FFB800;">👑 PLANT OEE</div>
        <div class="kpi-value" style="color: #FFB800; font-size: 22px; text-shadow: 0 0 10px rgba(255, 184, 0, 0.35);">{oee:.1f} <span class="kpi-unit">%</span></div>
        <div class="kpi-subtext" style="color: rgba(255, 184, 0, 0.65); font-weight:700;">Refinery Target 85.0%</div>
    </div>
    """

    # Embed custom CSS tokens for cards in Streamlit layout
    css_cards_style = """
    <style>
        .kpi-custom-card {
            background: rgba(10, 15, 30, 0.85);
            border: 1px solid rgba(0, 212, 255, 0.14);
            border-radius: 12px;
            padding: 16px;
            min-height: 110px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px rgba(2, 8, 23, 0.5);
            font-family: 'Inter', sans-serif;
        }
        .kpi-custom-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 25px rgba(0, 212, 255, 0.1);
            border-color: rgba(0, 212, 255, 0.28);
        }
        .kpi-title {
            font-size: 9.5px;
            font-weight: 800;
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .kpi-value {
            font-size: 21px;
            font-weight: 800;
            color: #E2E8F0;
            font-family: 'JetBrains Mono', monospace;
            margin: 4px 0;
            letter-spacing: -0.5px;
        }
        .kpi-unit {
            font-size: 10px;
            color: #475569;
            font-weight: 600;
            margin-left: 2px;
        }
        .kpi-subtext {
            font-size: 8.5px;
            color: #475569;
            font-weight: 600;
        }
        
        /* 1. Cyber Blue Conveyor indicator */
        .cyber-blue { border-left: 4px solid #00D4FF; }
        .kpi-indicator-bar {
            height: 4px;
            background: rgba(255,255,255,0.05);
            border-radius: 2px;
            overflow: hidden;
            margin: 4px 0;
        }
        .bar-fill.blue {
            height: 100%;
            background: #00D4FF;
            box-shadow: 0 0 8px #00D4FF;
        }
        
        /* 2. Plasma Emerald Extraction indicator */
        .plasma-emerald { border-left: 4px solid #00FF88; }
        .extraction-ring-mini {
            width: 14px; height: 14px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.05);
            position: relative;
        }
        .ring-fill {
            width: 100%; height: 100%;
            border-radius: 50%;
            border: 2px solid transparent;
            border-top-color: #00FF88;
            position: absolute;
            top: -2px; left: -2px;
        }
        
        /* 3. Molten Orange Boiler Flame */
        .molten-orange { border-left: 4px solid #FF8800; }
        .pulse-flame-wave { margin: 4px 0; opacity: 0.85; }
        
        /* 4. Flowing Teal Water wave */
        .flowing-teal { border-left: 4px solid #00FFD4; }
        .water-wave-anim {
            height: 6px;
            background: rgba(0, 255, 212, 0.05);
            border-radius: 3px;
            position: relative;
            overflow: hidden;
            margin: 4px 0;
        }
        .water-wave-anim .wave {
            position: absolute; left: 0;
            width: 200%; height: 100%;
            background: #00FFD4; opacity: 0.35;
            animation: wave-slide 4s linear infinite;
        }
        @keyframes wave-slide {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        
        /* 5. Carbon Mint indicator */
        .carbon-mint { border-left: 4px solid #34D399; }
        .carbon-mitigation-indicator {
            font-size: 8.5px;
            color: #34D399;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
            margin: 2px 0;
        }
        
        /* 6. Crown Gold luxury OEE indicator */
        .crown-gold {
            border: 1px solid rgba(255, 184, 0, 0.28);
            background: linear-gradient(135deg, rgba(10, 15, 30, 0.9) 0%, rgba(255, 184, 0, 0.05) 100%);
            box-shadow: 0 4px 20px rgba(255, 184, 0, 0.04);
        }
        .oee-crown-glare {
            position: absolute; top: -80px; left: -80px;
            width: 160px; height: 160px;
            background: radial-gradient(circle, rgba(255,184,0,0.06) 0%, transparent 60%);
            pointer-events: none;
        }
    </style>
    """
    st.markdown(css_cards_style, unsafe_allow_html=True)
    cols = st.columns(6)
    with cols[0]: st.html(card_throughput)
    with cols[1]: st.html(card_recovery)
    with cols[2]: st.html(card_energy)
    with cols[3]: st.html(card_water)
    with cols[4]: st.html(card_co2)
    with cols[5]: st.html(card_oee)

# Render premium custom cards row
render_premium_kpi_cards(plant_kpis)

# --- 7. Sidebar Shift Operations Controls ---
with st.sidebar:
    st.markdown("### 🪐 SCADA Shift Desk")
    
    # real-time ticking revenue widget
    sugar_tph = state.get("centrifugation", {}).get("sugar_tph", 22.0)
    live_revenue_ticker(shift["projected_revenue_usd"] / 1000.0, sugar_tph)
    
    st.markdown("---")
    st.markdown(f"**Operator Session:** `{shift['operator']}`")
    st.markdown(f"**Crushed Target:** `{shift['crush_target_tons']}` Tons")
    st.markdown(f"**Intake Integrator:** `{shift['cane_crushed_tons']}` T")
    st.markdown(f"**Produced Integrator:** `{shift['sugar_produced_tons']}` T")
    
    st.markdown("---")
    # Live Auto-Rerun refresh switch
    st.markdown("**Telemetry Sync Switch**")
    live_sync = st.toggle("🛰️ Active Live Telemetry Sync", value=True)
    
    if live_sync:
        st.markdown(
            f"""
            <script>
                setTimeout(function() {{
                    window.parent.document.querySelector('[data-testid="stSidebar"]').querySelector('button').click();
                }}, 1000);
            </script>
            """,
            unsafe_allow_html=True
        )

# Tab workspace layout
tab_overview, tab_whatif, tab_archive = st.tabs([
    "🌐 Plant Overview & SCADA Console",
    "🔬 What-If Simulation Sandbox",
    "📂 Historical Database Archive"
])

# ================= TAB 1: OVERVIEW & SCADA CONSOLE =================
with tab_overview:
    # Animated Stage Status Map
    st.markdown("<h4 style='color: #00D4FF; font-size:12px; font-weight:800; margin-bottom:12px;'>🌾 DYNAMIC STAGE FLOWLINE TELEMETRY</h4>", unsafe_allow_html=True)
    
    stage_statuses = {}
    for stage_id in ["cane_handling", "milling", "clarification", "evaporation", "crystallization", "centrifugation", "drying", "molasses"]:
        stage_status = "GREEN"
        stage_health_score = 100
        
        # Check active alarms for this stage
        for a in alarms:
            if a["stage_id"] == stage_id:
                if a["severity"] == "CRITICAL":
                    stage_status = "RED"
                    stage_health_score = 45
                elif stage_status != "RED":
                    stage_status = "YELLOW"
                    stage_health_score = 80
                    
        stage_statuses[stage_id] = {
            "status": stage_status,
            "health": stage_health_score,
            "label": stage_id.replace("_", " ").title()
        }
    
    st.html(process_flow_svg(stage_statuses))
    
    st.markdown("---")
    
    # Columns: Stage inspection details, Alarms and Recommendations
    col_console_left, col_console_right = st.columns([7, 3])
    
    with col_console_left:
        # Interactive stage drop down
        st.markdown("<h3 style='color: #E2E8F0; font-size: 14px; font-weight: 800; margin: 0;'>⚙️ Refinery Production Phase Controller</h3>", unsafe_allow_html=True)
        selected_stage = st.selectbox(
            "Select Process Stage to Inspect / Override:",
            options=["cane_handling", "milling", "clarification", "evaporation", "crystallization", "centrifugation"],
            format_func=lambda x: {
                "cane_handling": "01. Cane Handling & Unloading",
                "milling": "02. 5-Roller Milling Train",
                "clarification": "03. Clarification Defecation Dosing",
                "evaporation": "04. Quadruple Effect Evaporation",
                "crystallization": "05. Vacuum Pan Boiling Crystallizer",
                "centrifugation": "06. Decanter centrifugal Basket"
            }[x]
        )
        
        # Draw physical stage blueprint schematic diagram
        st.markdown("##### Process P&ID Flowline Schematic Blueprint")
        st.html(get_stage_svg(selected_stage))
        
        # Render Stage Telemetry Metrics
        st.markdown("##### Real-Time Process State Variables")
        stage_data = state.get(selected_stage, {})
        
        # Grid layout for parameters
        params = list(stage_data.keys())
        cols = st.columns(min(len(params), 4))
        for idx, param in enumerate(params):
            val = stage_data[param]
            col_target = cols[idx % 4]
            with col_target:
                st.metric(
                    label=param.replace("_", " ").title(),
                    value=f"{val:.2f}" if isinstance(val, (int, float)) else str(val)
                )
        
        st.markdown("---")
        
        # Plots & Override Console Columns
        col_plots, col_overrides = st.columns([5, 4])
        
        with col_plots:
            st.markdown("##### Telemetry Scrolling Trends")
            # Select parameter for visual graphing
            graph_param = st.selectbox("Select Parameter to Graph:", options=params)
            
            # Fetch rolling history buffers
            history_key = f"{selected_stage}.{graph_param}"
            history_data = simulator.history_buffers.get(history_key, [])[-60:]
            
            if history_data:
                chart_records = {graph_param.replace("_", " ").title(): history_data}
                fig = live_trend_chart(
                    data=chart_records,
                    title=f"60s Scrolling History - {graph_param.replace('_', ' ').title()}",
                    height=240,
                    show_projection=True
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Gathering historical data buffers...")
                
        with col_overrides:
            st.markdown("##### SCADA Operator Overrides")
            
            # Override inputs depending on stage
            stage_baselines = simulator.baselines[selected_stage]
            
            override_applied = False
            for param, base_val in stage_baselines.items():
                override_val = simulator.overrides[selected_stage].get(param, base_val)
                
                # Dynamic labels & ranges
                min_v, max_v = base_val * 0.5, base_val * 1.5
                if "pct" in param:
                    min_v, max_v = 0.0, 100.0
                elif "ph" in param:
                    min_v, max_v = 4.0, 10.0
                elif "temp" in param:
                    min_v, max_v = 20.0, 150.0
                elif "speed" in param:
                    min_v, max_v = 0.0, base_val * 2.0
                
                new_val = st.slider(
                    label=f"Trim: {param.replace('_', ' ').title()}",
                    min_value=float(min_v),
                    max_value=float(max_v),
                    value=float(override_val),
                    step=0.1
                )
                
                # If modified, push override directly to singleton simulator
                if new_val != override_val:
                    asyncio.run(simulator.update_override(selected_stage, param, new_val))
                    override_applied = True
            
            if override_applied or simulator.overrides[selected_stage]:
                if st.button("🚨 Reset to Automated loop defaults", key="reset_overrides_btn"):
                    asyncio.run(simulator.clear_overrides())
                    st.toast("DCS Overrides Reset to Automatic Control Loop")
                    st.rerun()
                    
    with col_console_right:
        # Alarms Log with precise concise formatting
        st.markdown("<div class='scada-panel'>", unsafe_allow_html=True)
        st.markdown("<span class='panel-title' style='color:#FF3366;'>⚠️ DYNAMIC SYSTEM ALARMS</span>", unsafe_allow_html=True)
        if alarms:
            for a in alarms:
                class_type = "alarm-row alarm-warn" if a["severity"] == "WARNING" else "alarm-row"
                st.markdown(f"""
                <div class='{class_type}'>
                    <strong>{a['stage_id'].replace('_',' ').upper()}:</strong> {a['message']}
                    <div style='font-size:9.5px; opacity:0.8; font-family:monospace; margin-top:3px;'>Value: {a['value']:.2f}</div>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style='background:rgba(0, 255, 136, 0.03); border:1px solid rgba(0, 255, 136, 0.15); padding:12px; border-radius:6px; font-size:12px;'>
                ✅ ALL SYSTEM FEEDBACK METRICS NOMINAL
            </div>
            """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Recommendations log with precise badges
        st.markdown("<div class='scada-panel'>", unsafe_allow_html=True)
        st.markdown("<span class='panel-title' style='color:#B44FFF;'>🧠 PREDICTIVE AI RECOMMENDATIONS</span>", unsafe_allow_html=True)
        
        recs = []
        clarif_ph = state.get("clarification", {}).get("estimated_ph", 7.2)
        if abs(7.2 - clarif_ph) > 0.1:
            lime_target = 0.82 if clarif_ph > 7.2 else 0.88
            recs.append({
                "rec": f"Trim lime dosing controller to {lime_target} kg/TC.",
                "reason": f"Current pH is {clarif_ph:.2f}. Restores optimum settling settling at 7.2 pH.",
                "impact": "+0.8% Purity"
            })
            
        milling_ext = state.get("milling", {}).get("mill_extraction_pct", 95.0)
        milling_water = state.get("milling", {}).get("imbibition_water_pct", 25.0)
        if milling_ext < 96.0 and milling_water < 28.0:
            recs.append({
                "rec": "Step up imbibition spray flow ratio to 27.5%.",
                "reason": f"Extraction is sub-optimal at {milling_ext:.1f}%. Recovers bound sugars.",
                "impact": "+1.8% Recovery"
            })
            
        evap_steam = state.get("evaporation", {}).get("actual_steam_needed_tph", 42.0)
        if evap_steam > 45.0:
            recs.append({
                "rec": "Initiate automated chemical scale clean on Effect #1.",
                "reason": "High thermal duty. Scaling deposits on tube surfaces.",
                "impact": "-4.2 TPH Steam"
            })
            
        if recs:
            for r in recs:
                st.markdown(f"""
                <div class='rec-row'>
                    <strong>Action:</strong> {r['rec']}<br/>
                    <span style='font-size:10px; color:#94A3B8;'>Reason: {r['reason']}</span>
                    <div style='margin-top:6px; display:inline-block; font-size:9.5px; font-weight:bold; background:rgba(0,255,136,0.15); color:#00FF88; padding:2px 6px; border-radius:4px;'>
                        ⭐ Expected Impact: {r['impact']}
                    </div>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style='background:rgba(0,212,255,0.03); border:1px solid rgba(0,212,255,0.15); padding:12px; border-radius:6px; font-size:12px;'>
                ⚙️ Maintain present balance metrics. Operations optimal.
            </div>
            """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Stage bottleneck / utilization graph
        bottleneck_data = [
            {"stage": "Cane Yard", "bottleneck_score": 10.0 + (state.get("cane_handling", {}).get("cane_feed_rate_tph", 210) - 210) * 0.1, "utilization_pct": 98.0, "status": "OK"},
            {"stage": "Milling", "bottleneck_score": 25.0 if state.get("milling", {}).get("imbibition_water_pct", 25) < 22 else 12.0, "utilization_pct": 88.0, "status": "OK"},
            {"stage": "Clarifier", "bottleneck_score": 85.0 if abs(7.2 - clarif_ph) > 0.8 else 15.0, "utilization_pct": 72.0, "status": "BOTTLENECK" if abs(7.2 - clarif_ph) > 0.8 else "OK"},
            {"stage": "Evaporators", "bottleneck_score": 52.0 if state.get("evaporation", {}).get("juice_brix_out_pct", 62) < 57 else 18.0, "utilization_pct": 92.0, "status": "WATCH" if state.get("evaporation", {}).get("juice_brix_out_pct", 62) < 57 else "OK"},
            {"stage": "Centrifugals", "bottleneck_score": 90.0 if state.get("centrifugation", {}).get("final_sugar_purity_pct", 99.5) < 99 else 20.0, "utilization_pct": 82.0, "status": "BOTTLENECK" if state.get("centrifugation", {}).get("final_sugar_purity_pct", 99.5) < 99 else "OK"}
        ]
        
        st.plotly_chart(bottleneck_chart(bottleneck_data), use_container_width=True)

# ================= TAB 2: WHAT-IF PREDICTOR SANDBOX =================
with tab_whatif:
    st.markdown("### 🔬 WHAT-IF OPERATIONAL AI SIMULATOR")
    st.markdown("Model large-scale refinery variables to forecast daily sugar yields and environmental footprint metrics.")
    
    col_wi_left, col_wi_right = st.columns([1, 1])
    
    with col_wi_left:
        st.markdown("#### Operational Adjustments")
        wi_feed = st.slider("🌾 Sugarcane Daily Intake Rate", min_value=2000, max_value=8000, value=5000, step=100)
        wi_boiler = st.slider("🔥 Bagasse Boiler Combustion Efficiency", min_value=70, max_value=98, value=85, step=1)
        wi_water = st.slider("💧 Closed-Loop Water Recycling Rate", min_value=40, max_value=95, value=60, step=1)
        
        # Heuristic calculations for sandbox delta predictions
        base_recovery_pct = 11.6
        rec_impact = base_recovery_pct * (wi_boiler / 85.0)
        wi_sugar_yield = (wi_feed * rec_impact) / 100.0
        
        wi_water_intensity = 1.6 - (wi_water / 100.0) * 0.6
        wi_co2_offset = (wi_boiler - 85.0) * 1.2 + (wi_water - 60.0) * 0.4
        
        # Build comparison structure for Plotly comparison chart
        delta_rows = [
            {"KPI": "Sugar Production (T/Day)", "Delta %": ((wi_sugar_yield - 580) / 580) * 100, "Direction": "Better" if wi_sugar_yield > 580 else "Worse"},
            {"KPI": "Recycled Water Intensity (m3/T)", "Delta %": -((wi_water_intensity - 1.24) / 1.24) * 100, "Direction": "Better" if wi_water_intensity < 1.24 else "Worse"},
            {"KPI": "Carbon Dioxide Mitigated (T/Day)", "Delta %": wi_co2_offset * 10, "Direction": "Better" if wi_co2_offset >= 0 else "Worse"}
        ]
        
    with col_wi_right:
        st.markdown("#### Sandbox Projections")
        
        # KPI boxes
        st.markdown(f"""
        <div style='display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom:20px;'>
            <div style='background:rgba(15, 98, 254, 0.05); border: 1px solid rgba(15, 98, 254, 0.2); padding:10px; border-radius:6px; text-align:center;'>
                <div style='font-size:9px; color:#94A3B8;'>SUGAR FORECAST</div>
                <strong style='font-size:18px; color:#0f62fe;'>{wi_sugar_yield:.1f} T/D</strong>
            </div>
            <div style='background:rgba(0, 255, 136, 0.05); border: 1px solid rgba(0, 255, 136, 0.2); padding:10px; border-radius:6px; text-align:center;'>
                <div style='font-size:9px; color:#94A3B8;'>WATER INTENSITY</div>
                <strong style='font-size:18px; color:#00FF88;'>{wi_water_intensity:.2f} m³/T</strong>
            </div>
            <div style='background:rgba(180, 79, 255, 0.05); border: 1px solid rgba(180, 79, 255, 0.2); padding:10px; border-radius:6px; text-align:center;'>
                <div style='font-size:9px; color:#94A3B8;'>CO₂ OFFSET</div>
                <strong style='font-size:18px; color:#B44FFF;'>{max(0.0, wi_co2_offset):+.1f} T/D</strong>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.plotly_chart(whatif_comparison_chart(delta_rows), use_container_width=True)
        
    # Bottom: Sustainability radar benchmarking
    st.markdown("---")
    st.markdown("#### ♻️ Sustainability Scorecard Benchmarking")
    
    radar_scores = {
        "Thermal Economy": min(100.0, 72.0 * (wi_boiler / 85.0)),
        "Water Recirculation": float(wi_water),
        "Sucrose Recovery": min(100.0, 76.0 * (rec_impact / base_recovery_pct)),
        "Emissions Capture": min(100.0, max(0.0, 80.0 + wi_co2_offset)),
        "Crush Throughput": min(100.0, 70.0 * (wi_feed / 5000.0))
    }
    
    st.plotly_chart(sustainability_radar(radar_scores), use_container_width=True)

# ================= TAB 3: HISTORICAL ARCHIVE SEARCH =================
with tab_archive:
    st.markdown("### 📂 SQL CENTRAL TELEMETRY ARCHIVE")
    st.markdown("Query the historical data registry from the central `plant_data.db` database.")
    
    db_path = "./data/plant_data.db"
    
    if os.path.exists(db_path):
        col_db_query, col_db_table = st.columns([4, 6])
        
        with col_db_query:
            st.markdown("#### Select Metric & Interval")
            
            hist_stage = st.selectbox(
                "Select Stage:",
                options=["cane_handling", "milling", "clarification", "evaporation", "crystallization", "centrifugation"],
                key="db_stage_select"
            )
            hist_param = st.selectbox(
                "Select Telemetry Parameter:",
                options={
                    "cane_handling": ["cane_feed_rate_tph", "trash_pct"],
                    "milling": ["imbibition_water_pct", "juice_brix_pct"],
                    "clarification": ["estimated_ph", "clarified_purity_pct"],
                    "evaporation": ["juice_brix_out_pct", "steam_economy"],
                    "crystallization": ["supersaturation_coeff", "pan_temp_c"],
                    "centrifugation": ["final_sugar_purity_pct", "g_factor"]
                }[hist_stage],
                key="db_param_select"
            )
            
            hist_limit = st.slider("Record Query Limit:", min_value=10, max_value=200, value=100)
            
            if st.button("🔍 Execute Archive Retrieve", key="exec_db_query_btn"):
                try:
                    conn = sqlite3.connect(db_path)
                    query = f"""
                    SELECT timestamp, stage_id, parameter, value 
                    FROM process_telemetry 
                    WHERE stage_id = '{hist_stage}' AND parameter = '{hist_param}'
                    ORDER BY timestamp DESC 
                    LIMIT {hist_limit}
                    """
                    df_res = pd.read_sql_query(query, conn)
                    conn.close()
                    
                    st.success(f"Retrieved {len(df_res)} telemetry telemetry records.")
                    st.session_state["db_query_res"] = df_res
                except Exception as e:
                    st.error(f"SQL Execution Error: {e}")
                    
        with col_db_table:
            st.markdown("#### Query Results")
            if "db_query_res" in st.session_state and not st.session_state["db_query_res"].empty:
                df = st.session_state["db_query_res"]
                
                df["timestamp"] = pd.to_datetime(df["timestamp"])
                df = df.sort_values("timestamp")
                
                import plotly.express as px
                fig_hist = px.line(
                    df, x="timestamp", y="value", 
                    title=f"Historical Trend — {hist_param.replace('_',' ').title()}",
                    template="plotly_dark"
                )
                fig_hist.update_layout(
                    paper_bgcolor="#0A0F1E",
                    plot_bgcolor="#020817",
                    font=dict(color="#E2E8F0"),
                    xaxis=dict(gridcolor="rgba(0,212,255,0.05)", linecolor="rgba(0,212,255,0.15)"),
                    yaxis=dict(gridcolor="rgba(0,212,255,0.05)", linecolor="rgba(0,212,255,0.15)")
                )
                st.plotly_chart(fig_hist, use_container_width=True)
                
                st.dataframe(st.session_state["db_query_res"], height=200)
            else:
                st.info("Trigger a query on the left to pull historical SQLite databases logs.")
    else:
        st.warning("SQLite telemetry database not initialized yet. Please start backend server loop.")
