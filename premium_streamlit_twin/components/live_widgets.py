"""
components/live_widgets.py — Living, animated widgets for the Sugar Mill Digital Twin.
JS-injected clock, revenue counter, heartbeat EKG, process ticker.
"""
import streamlit as st
import time
from datetime import datetime


def inject_live_clock():
    """Injects a JS clock that ticks every second without page rerun."""
    st.html("""
    <script>
    function updateClock() {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
        const dateStr = now.toLocaleDateString('en-IN', {weekday:'short', year:'numeric', month:'short', day:'numeric'});
        const el = window.parent.document.getElementById('live-clock');
        const de = window.parent.document.getElementById('live-date');
        if (el) el.innerText = timeStr;
        if (de) de.innerText = dateStr;
    }
    updateClock();
    setInterval(updateClock, 1000);
    </script>
    """)


def inject_counter_animation():
    """Injects CSS+JS to animate number transitions on KPI updates."""
    st.html("""
    <script>
    function animateValue(el, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            el.textContent = current.toFixed(1);
        }, 16);
    }
    </script>
    """)


def live_revenue_ticker(revenue_lakhs: float, sugar_tph: float):
    """Animated live revenue accumulator — ticks up in real time."""
    per_second_inr = sugar_tph * 3800 / 3600  # INR per second
    st.html(f"""
    <div style="
        background: linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,255,136,0.05));
        border: 1px solid rgba(0,212,255,0.3);
        border-radius: 12px;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        font-family: 'JetBrains Mono', monospace;
    ">
        <div style="color:#00D4FF; font-size:22px;">₹</div>
        <div>
            <div style="color:#94A3B8; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">Live Revenue — This Shift</div>
            <div id="rev-counter" style="
                color:#00FF88;
                font-size:26px;
                font-weight:800;
                letter-spacing:-1px;
                text-shadow: 0 0 20px rgba(0,255,136,0.5);
            ">₹{revenue_lakhs:.2f}L</div>
            <div style="color:#475569; font-size:10px;">+₹{per_second_inr:.0f}/sec accumulating</div>
        </div>
        <div style="margin-left:auto; text-align:right;">
            <div id="rev-tick" style="
                width:8px; height:8px; border-radius:50%;
                background:#00FF88;
                display:inline-block;
                box-shadow: 0 0 10px #00FF88;
                animation: revpulse 1s ease-in-out infinite;
            "></div>
        </div>
    </div>
    <style>
    @keyframes revpulse {{
        0%, 100% {{ opacity: 1; transform: scale(1); }}
        50% {{ opacity: 0.3; transform: scale(0.7); }}
    }}
    </style>
    <script>
    const base = {revenue_lakhs};
    const perSec = {per_second_inr} / 100000;
    let t0 = Date.now();
    function tick() {{
        const elapsed = (Date.now() - t0) / 1000;
        const val = base + elapsed * perSec;
        const el = document.getElementById('rev-counter');
        if (el) el.innerText = '\u20b9' + val.toFixed(3) + 'L';
        requestAnimationFrame(tick);
    }}
    tick();
    </script>
    """)


def heartbeat_widget(crit_count: int, warn_count: int, total_sensors: int = 64):
    """Animated EKG-style heartbeat header widget."""
    status_color = "#FF3366" if crit_count > 0 else ("#FFB800" if warn_count > 0 else "#00FF88")
    status_text = f"\u26a0 {crit_count} CRITICAL" if crit_count > 0 else (f"\u26a1 {warn_count} WARN" if warn_count > 0 else "ALL SYSTEMS NOMINAL")
    st.html(f"""
    <div style="display:flex; align-items:center; gap:16px;">
        <canvas id="ekg" width="160" height="36" style="display:block;"></canvas>
        <div>
            <div id="ekg-status" style="
                color:{status_color};
                font-size:11px; font-weight:800;
                letter-spacing:1px;
                text-transform:uppercase;
                font-family:'JetBrains Mono',monospace;
                text-shadow: 0 0 10px {status_color};
            ">{status_text}</div>
            <div style="color:#475569; font-size:10px;">{total_sensors} sensors live · 1Hz</div>
        </div>
    </div>
    <script>
    const canvas = document.getElementById('ekg');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const color = '{status_color}';
    const pts = [];
    let x = 0;
    function ekgPoint(t) {{
        const base = H/2;
        const phase = t % 100;
        if (phase < 10) return base;
        if (phase < 15) return base - 6;
        if (phase < 18) return base + 12;
        if (phase < 22) return base - H*0.7;
        if (phase < 26) return base + 8;
        if (phase < 32) return base - 4;
        if (phase < 36) return base + 3;
        return base + Math.sin(phase * 0.3) * 2;
    }}
    let t = 0;
    function draw() {{
        ctx.clearRect(0, 0, W, H);
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < W; i++) {{
            const y = ekgPoint(t - (W - i) * 0.8);
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }}
        ctx.stroke();
        // Glow dot at tip
        ctx.beginPath();
        ctx.arc(W - 1, ekgPoint(t), 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        t += 0.8;
        requestAnimationFrame(draw);
    }}
    draw();
    </script>
    """, height=50)


def kpi_ticker_html(kpi_items: list) -> str:
    """
    Returns HTML for an animated scrolling KPI ticker.
    kpi_items: list of {label, value, unit, status}
    """
    status_colors = {"GREEN": "#00FF88", "YELLOW": "#FFB800", "RED": "#FF3366", "NORMAL": "#00D4FF"}
    items_html = ""
    for item in kpi_items:
        col = status_colors.get(item.get("status", "NORMAL"), "#00D4FF")
        items_html += f"""
        <span style="margin: 0 28px; white-space:nowrap;">
            <span style="color:#475569; font-size:11px;">{item['label']}</span>
            <span style="color:{col}; font-size:12px; font-weight:700; margin-left:6px;
                         text-shadow: 0 0 8px {col}80;">
                {item['value']}<span style="font-size:9px; color:#475569; margin-left:2px;">{item.get('unit','')}</span>
            </span>
        </span>
        <span style="color:#1E293B; margin:0 4px;">│</span>
        """
    # Duplicate for seamless loop
    return f"""
    <div style="
        background: rgba(10,15,30,0.8);
        border-top: 1px solid rgba(0,212,255,0.1);
        border-bottom: 1px solid rgba(0,212,255,0.1);
        padding: 7px 0;
        overflow: hidden;
        position: relative;
        font-family: 'JetBrains Mono', monospace;
    ">
        <div style="
            display: inline-flex;
            animation: ticker 40s linear infinite;
            white-space: nowrap;
        ">
            {items_html}{items_html}
        </div>
    </div>
    <style>
    @keyframes ticker {{
        0%   {{ transform: translateX(0); }}
        100% {{ transform: translateX(-50%); }}
    }}
    </style>
    """


def process_flow_svg(stage_statuses: dict) -> str:
    """
    Animated SVG process flow showing material flowing through all 8 stages.
    stage_statuses: dict mapping stage_id -> {'color': '#hex', 'health': 85, 'label': '...'}
    """
    status_glow = {
        "GREEN": ("#00FF88", "rgba(0,255,136,0.3)"),
        "YELLOW": ("#FFB800", "rgba(255,184,0,0.3)"),
        "RED": ("#FF3366", "rgba(255,51,102,0.3)"),
    }

    stages_order = [
        ("cane_handling",   "🌾", "Cane"),
        ("milling",         "⚙️", "Milling"),
        ("clarification",   "🧪", "Clarif."),
        ("evaporation",     "💨", "Evap."),
        ("crystallization", "💎", "Crystal"),
        ("centrifugation",  "🔄", "Centrif."),
        ("drying",          "🌡️", "Drying"),
        ("molasses",        "🛢️", "Molasses"),
    ]

    n = len(stages_order)
    W, H = 900, 120
    box_w, box_h = 80, 60
    gap = (W - n * box_w) / (n + 1)
    boxes_svg = ""
    pipes_svg = ""
    particles_js = ""
    defs_svg = ""

    xs = [gap + i * (box_w + gap) for i in range(n)]

    for i, (sid, icon, label) in enumerate(stages_order):
        status_info = stage_statuses.get(sid, {})
        status = status_info.get("status", "GREEN")
        health = status_info.get("health", 100)
        neon, glow = status_glow.get(status, status_glow["GREEN"])
        cx = xs[i] + box_w / 2
        cy = H / 2

        # Gradient def
        defs_svg += f"""
        <radialGradient id="grd{i}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="{neon}" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="{neon}" stop-opacity="0.02"/>
        </radialGradient>
        <filter id="glow{i}">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        """

        # Pipe to next stage
        if i < n - 1:
            x1 = xs[i] + box_w
            x2 = xs[i + 1]
            mid_x = (x1 + x2) / 2
            pipes_svg += f"""
            <line x1="{x1}" y1="{cy}" x2="{x2}" y2="{cy}"
                  stroke="rgba(0,212,255,0.2)" stroke-width="2" stroke-dasharray="4,3">
            </line>
            <circle class="particle p{i}" cx="{x1}" cy="{cy}" r="3"
                    fill="{neon}" opacity="0.9" filter="url(#glow{i})">
                <animate attributeName="cx" from="{x1}" to="{x2}"
                         dur="{1.5 + i * 0.2:.1f}s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1"
                         dur="{1.5 + i * 0.2:.1f}s" repeatCount="indefinite"/>
            </circle>
            <circle class="particle p{i}b" cx="{x1}" cy="{cy}" r="2"
                    fill="{neon}" opacity="0.6" filter="url(#glow{i})">
                <animate attributeName="cx" from="{x1}" to="{x2}"
                         dur="{1.5 + i * 0.2:.1f}s" begin="{(1.5 + i*0.2)/2:.1f}s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.1;0.9;1"
                         dur="{1.5 + i * 0.2:.1f}s" begin="{(1.5 + i*0.2)/2:.1f}s" repeatCount="indefinite"/>
            </circle>
            """

        # Box
        bar_w = box_w * 0.7 * health / 100
        boxes_svg += f"""
        <rect x="{xs[i]}" y="{cy - box_h/2}" width="{box_w}" height="{box_h}" rx="8"
              fill="url(#grd{i})" stroke="{neon}" stroke-width="1.5" opacity="0.9"
              filter="url(#glow{i})"/>
        <text x="{cx}" y="{cy - 12}" text-anchor="middle"
              font-size="14" fill="{neon}">{icon}</text>
        <text x="{cx}" y="{cy + 5}" text-anchor="middle"
              font-size="9" font-weight="700" fill="{neon}" font-family="Inter,sans-serif">{label}</text>
        <text x="{cx}" y="{cy + 17}" text-anchor="middle"
              font-size="8" fill="#475569" font-family="JetBrains Mono,monospace">{health:.0f}%</text>
        <!-- Health bar -->
        <rect x="{xs[i] + (box_w - box_w*0.7)/2}" y="{cy + 22}" width="{box_w*0.7}" height="3" rx="1.5" fill="rgba(255,255,255,0.08)"/>
        <rect x="{xs[i] + (box_w - box_w*0.7)/2}" y="{cy + 22}" width="{bar_w:.1f}" height="3" rx="1.5" fill="{neon}" opacity="0.8"/>
        """

    svg = f"""
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 {W} {H}" style="display:block;">
        <defs>
            {defs_svg}
        </defs>
        <!-- Background grid lines -->
        <line x1="0" y1="{H/2}" x2="{W}" y2="{H/2}" stroke="rgba(0,212,255,0.05)" stroke-width="1"/>
        {pipes_svg}
        {boxes_svg}
    </svg>
    """
    return svg


def anomaly_ring_css() -> str:
    """Returns CSS for pulsing ring animation on critical alerts."""
    return """
    <style>
    @keyframes ring-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(255,51,102,0.6); }
        70%  { box-shadow: 0 0 0 12px rgba(255,51,102,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,51,102,0); }
    }
    @keyframes warn-ring {
        0%   { box-shadow: 0 0 0 0 rgba(255,184,0,0.5); }
        70%  { box-shadow: 0 0 0 10px rgba(255,184,0,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,184,0,0); }
    }
    @keyframes scan-line {
        0%   { transform: translateY(-100%); opacity: 0.6; }
        100% { transform: translateY(100vh); opacity: 0; }
    }
    @keyframes data-flow {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
    }
    .crit-ring { animation: ring-pulse 1.5s ease-out infinite; }
    .warn-ring  { animation: warn-ring  2s   ease-out infinite; }
    </style>
    """
