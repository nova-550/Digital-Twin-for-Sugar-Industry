"""
components/charts.py — Dark neon Plotly charts for the Sugar Mill Digital Twin.
Futuristic cyberpunk aesthetic: deep space bg, neon traces, gradient fills, glowing markers.
"""

import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

# ── Dark Neon Palette ──────────────────────────────────────────
BG        = "#020817"       # deep space
CANVAS_BG = "#0A0F1E"       # panel bg
GRID_COL  = "rgba(0,212,255,0.08)"   # subtle cyan grid
BORDER    = "rgba(0,212,255,0.15)"
TEXT_COL  = "#E2E8F0"
MUTED     = "#475569"

CYAN      = "#00D4FF"   # electric cyan
GREEN     = "#00FF88"   # plasma green
AMBER     = "#FFB800"   # warning amber
RED_COL   = "#FF3366"   # critical red
PURPLE    = "#B44FFF"   # neon violet
ORANGE    = "#FF6B35"   # hot orange
TEAL      = "#00FFD4"   # teal
PINK      = "#FF3399"   # hot pink

STATUS_COLOR = {"GREEN": GREEN, "YELLOW": AMBER, "RED": RED_COL, "NORMAL": CYAN}

PALETTE = [CYAN, GREEN, AMBER, PURPLE, ORANGE, RED_COL, TEAL, PINK]

# Neon RGBA versions for fills
PALETTE_FILL = [
    "rgba(0,212,255,0.12)",
    "rgba(0,255,136,0.12)",
    "rgba(255,184,0,0.10)",
    "rgba(180,79,255,0.10)",
    "rgba(255,107,53,0.10)",
    "rgba(255,51,102,0.10)",
    "rgba(0,255,212,0.10)",
    "rgba(255,51,153,0.10)",
]

BASE_LAYOUT = dict(
    paper_bgcolor=BG,
    plot_bgcolor=CANVAS_BG,
    font=dict(color=TEXT_COL, family="Inter, -apple-system, sans-serif", size=11),
    margin=dict(l=48, r=16, t=40, b=36),
    xaxis=dict(
        gridcolor=GRID_COL, zerolinecolor=GRID_COL, showgrid=True,
        linecolor=BORDER, tickfont=dict(color=MUTED, size=10),
        showspikes=True, spikecolor=CYAN, spikethickness=1,
        spikedash="dot", spikemode="across",
    ),
    yaxis=dict(
        gridcolor=GRID_COL, zerolinecolor=GRID_COL, showgrid=True,
        linecolor=BORDER, tickfont=dict(color=MUTED, size=10),
        showspikes=True, spikecolor=CYAN, spikethickness=1,
    ),
    hoverlabel=dict(
        bgcolor="#0A0F1E", bordercolor=CYAN,
        font=dict(color=TEXT_COL, size=11, family="JetBrains Mono, monospace"),
    ),
)

LEGEND_TOP = dict(
    bgcolor="rgba(10,15,30,0.8)", bordercolor=BORDER,
    borderwidth=1, font=dict(size=10, color=TEXT_COL),
    orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0,
)


def _apply_base(fig: go.Figure, title: str = "", height: int = 280) -> go.Figure:
    layout = dict(
        **BASE_LAYOUT,
        legend=LEGEND_TOP,
        title=dict(
            text=f'<span style="color:{CYAN}; font-weight:700; font-size:12px;">{title}</span>',
            font=dict(size=12, color=CYAN, family="Inter, sans-serif"),
            x=0, xanchor="left", pad=dict(l=0),
        ),
        height=height,
    )
    fig.update_layout(**layout)
    return fig


# ── Live trend chart ──────────────────────────────────────────
def live_trend_chart(
    data: Dict[str, List[Dict]],
    title: str = "Live Trend",
    unit: str = "",
    height: int = 300,
    show_target: Optional[float] = None,
    show_projection: bool = True,
) -> go.Figure:
    """Multi-line neon trend chart with gradient fill and live-tip glowing marker."""
    fig = go.Figure()

    for i, (label, records) in enumerate(data.items()):
        if not records:
            continue
        ts_list = [r.get("ts", r.get("timestamp", "")) for r in records]
        vals    = [r.get("value", 0) for r in records]
        color   = PALETTE[i % len(PALETTE)]
        fill_color = PALETTE_FILL[i % len(PALETTE_FILL)]

        # Gradient area fill
        fig.add_trace(go.Scatter(
            x=ts_list, y=vals, mode="lines", name=label,
            line=dict(color=color, width=2.5, shape="spline", smoothing=0.8),
            fill="tozeroy", fillcolor=fill_color,
            hovertemplate=f"<b style='color:{color}'>{label}</b>: %{{y:.2f}}{' ' + unit if unit else ''}<br>%{{x}}<extra></extra>",
        ))

        # Glowing live-tip marker (last point)
        if vals:
            fig.add_trace(go.Scatter(
                x=[ts_list[-1]], y=[vals[-1]], mode="markers",
                name=f"{label} live",
                marker=dict(
                    color=color, size=10,
                    line=dict(color=color, width=2),
                    symbol="circle",
                ),
                showlegend=False,
                hoverinfo="skip",
            ))

        # 30-second projection (linear extrapolation)
        if show_projection and len(vals) >= 10:
            try:
                x_num = np.arange(len(vals))
                slope, intercept = np.polyfit(x_num[-20:], vals[-20:], 1)
                proj_steps = 15
                proj_vals = [vals[-1] + slope * k for k in range(1, proj_steps + 1)]
                proj_ts = [f"proj_{k}" for k in range(1, proj_steps + 1)]
                fig.add_trace(go.Scatter(
                    x=[ts_list[-1]] + proj_ts, y=[vals[-1]] + proj_vals,
                    mode="lines", name=f"{label} (proj)",
                    line=dict(color=color, width=1.5, dash="dot"),
                    opacity=0.4,
                    showlegend=False,
                    hoverinfo="skip",
                ))
            except Exception:
                pass

    if show_target is not None:
        fig.add_hline(
            y=show_target, line_dash="dash", line_color=AMBER, line_width=1.5,
            annotation_text=f"⚡ Target {show_target}",
            annotation_font_color=AMBER, annotation_font_size=10,
            annotation_bgcolor="rgba(255,184,0,0.1)",
        )

    # Scan line watermark overlay
    fig.add_shape(
        type="rect", xref="paper", yref="paper",
        x0=0, x1=1, y0=0, y1=1,
        line=dict(width=0),
        fillcolor="rgba(0,212,255,0.01)",
    )

    return _apply_base(fig, title, height)


# ── KPI Gauge — Neon Style ────────────────────────────────────
def kpi_gauge(
    value: float, title: str, unit: str,
    min_val: float = 0, max_val: float = 100,
    target: float = None, status: str = "GREEN",
    height: int = 220,
) -> go.Figure:
    color = STATUS_COLOR.get(status, CYAN)
    steps = [
        dict(range=[min_val, max_val * 0.5],  color="rgba(0,255,136,0.06)"),
        dict(range=[max_val * 0.5, max_val * 0.8], color="rgba(255,184,0,0.06)"),
        dict(range=[max_val * 0.8, max_val], color="rgba(255,51,102,0.06)"),
    ]
    threshold = dict(line=dict(color=AMBER, width=3), thickness=0.75, value=target) if target else None
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=value,
        delta=dict(
            reference=target or value,
            font=dict(size=12, color=MUTED),
            increasing=dict(color=GREEN),
            decreasing=dict(color=RED_COL),
        ) if target else None,
        number=dict(
            suffix=f" {unit}",
            font=dict(color=color, size=28, family="JetBrains Mono, monospace"),
        ),
        title=dict(text=title, font=dict(size=11, color=MUTED, family="Inter, sans-serif")),
        gauge=dict(
            axis=dict(
                range=[min_val, max_val], tickcolor=MUTED,
                tickfont=dict(size=9, color=MUTED),
                gridcolor=GRID_COL,
            ),
            bar=dict(color=color, thickness=0.65),
            bgcolor=CANVAS_BG,
            borderwidth=1, bordercolor=BORDER,
            steps=steps,
            threshold=threshold,
        ),
    ))
    fig.update_layout(
        paper_bgcolor=BG, height=height,
        margin=dict(l=20, r=20, t=50, b=10),
        font=dict(color=TEXT_COL, family="Inter, sans-serif"),
    )
    return fig


# ── Sustainability radar chart ─────────────────────────────────
def sustainability_radar(scores: Dict[str, float]) -> go.Figure:
    cats = list(scores.keys())
    vals = list(scores.values())
    vals += [vals[0]]
    cats_closed = cats + [cats[0]]

    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=vals, theta=cats_closed, fill="toself",
        fillcolor="rgba(0,212,255,0.08)",
        line=dict(color=CYAN, width=2.5),
        name="Current",
        hovertemplate="<b>%{theta}</b>: %{r:.1f}<extra></extra>",
    ))
    fig.add_trace(go.Scatterpolar(
        r=[80] * len(cats_closed), theta=cats_closed, fill="toself",
        fillcolor="rgba(0,255,136,0.04)",
        line=dict(color=GREEN, width=1.5, dash="dot"),
        name="Target (80)",
    ))
    fig.update_layout(
        polar=dict(
            bgcolor=CANVAS_BG,
            radialaxis=dict(
                visible=True, range=[0, 100], gridcolor=GRID_COL,
                tickfont=dict(color=MUTED, size=9), linecolor=BORDER,
            ),
            angularaxis=dict(gridcolor=GRID_COL, tickfont=dict(color=TEXT_COL, size=10), linecolor=BORDER),
        ),
        paper_bgcolor=BG, showlegend=True, height=320,
        margin=dict(l=60, r=60, t=40, b=40),
        font=dict(color=TEXT_COL, family="Inter, sans-serif"),
        legend=dict(bgcolor="rgba(10,15,30,0.8)", bordercolor=BORDER, borderwidth=1, font=dict(size=10)),
        title=dict(text=f'<span style="color:{CYAN}">♻ Sustainability Radar</span>',
                   font=dict(size=12, color=CYAN), x=0),
    )
    return fig


# ── What-if comparison bar chart ───────────────────────────────
def whatif_comparison_chart(delta_rows: List[Dict]) -> go.Figure:
    labels = [r["KPI"] for r in delta_rows]
    deltas = [r["Delta %"] for r in delta_rows]
    colors = [
        GREEN if "Better" in r["Direction"] else (RED_COL if "Worse" in r["Direction"] else MUTED)
        for r in delta_rows
    ]
    fill_colors = [
        "rgba(0,255,136,0.15)" if "Better" in r["Direction"] else
        ("rgba(255,51,102,0.15)" if "Worse" in r["Direction"] else "rgba(71,85,105,0.1)")
        for r in delta_rows
    ]
    fig = go.Figure(go.Bar(
        x=deltas, y=labels, orientation="h",
        marker=dict(color=colors, line=dict(width=0)),
        text=[f"{d:+.1f}%" for d in deltas],
        textposition="outside",
        textfont=dict(size=10, color=TEXT_COL, family="JetBrains Mono, monospace"),
        hovertemplate="<b>%{y}</b><br>Change: %{x:+.2f}%<extra></extra>",
    ))
    fig.add_vline(x=0, line_color=BORDER, line_width=1.5)
    return _apply_base(fig, "🔬 What-If Impact — KPI Change (%)", height=320)


# ── Plant trend multi-KPI chart ───────────────────────────────
def plant_kpi_trend(df: pd.DataFrame, kpi_cols: List[str]) -> go.Figure:
    if df.empty or "timestamp" not in df.columns:
        return go.Figure().update_layout(**BASE_LAYOUT)
    fig = make_subplots(
        rows=len(kpi_cols), cols=1, shared_xaxes=True,
        vertical_spacing=0.04,
        subplot_titles=kpi_cols,
    )
    for i, col in enumerate(kpi_cols):
        if col in df.columns:
            color = PALETTE[i % len(PALETTE)]
            fig.add_trace(
                go.Scatter(
                    x=df["timestamp"], y=df[col], mode="lines", name=col,
                    line=dict(color=color, width=2, shape="spline"),
                    fill="tozeroy", fillcolor=PALETTE_FILL[i % len(PALETTE_FILL)],
                    showlegend=False,
                ),
                row=i + 1, col=1,
            )
    fig.update_layout(
        **{k: v for k, v in BASE_LAYOUT.items() if k not in ("xaxis", "yaxis")},
        height=60 + 120 * len(kpi_cols),
        title=dict(
            text=f'<span style="color:{CYAN}">📈 Plant KPI Trends</span>',
            font=dict(size=12, color=CYAN), x=0,
        ),
    )
    for i in range(1, len(kpi_cols) + 1):
        fig.update_xaxes(gridcolor=GRID_COL, linecolor=BORDER, row=i, col=1)
        fig.update_yaxes(
            gridcolor=GRID_COL, linecolor=BORDER, row=i, col=1,
            title_font=dict(size=9, color=MUTED), tickfont=dict(size=9, color=MUTED),
        )
    return fig


# ── Bottleneck bar ────────────────────────────────────────────
def bottleneck_chart(bottleneck_data: List[Dict]) -> go.Figure:
    stages = [b["stage"] for b in bottleneck_data]
    scores = [b["bottleneck_score"] for b in bottleneck_data]
    utils  = [b["utilization_pct"] for b in bottleneck_data]
    bar_colors = [
        RED_COL if b["status"] == "BOTTLENECK" else (AMBER if b["status"] == "WATCH" else GREEN)
        for b in bottleneck_data
    ]
    bar_fills = [
        "rgba(255,51,102,0.15)" if b["status"] == "BOTTLENECK" else
        ("rgba(255,184,0,0.12)" if b["status"] == "WATCH" else "rgba(0,255,136,0.1)")
        for b in bottleneck_data
    ]
    fig = go.Figure()
    fig.add_trace(go.Bar(
        name="Bottleneck Score", x=stages, y=scores,
        marker=dict(
            color=bar_fills,
            line=dict(color=bar_colors, width=2),
        ),
        hovertemplate="<b>%{x}</b><br>Score: %{y:.1f}<extra></extra>",
        text=[f"{s:.1f}" for s in scores],
        textposition="outside",
        textfont=dict(size=10, color=TEXT_COL),
    ))
    fig.add_trace(go.Scatter(
        name="Utilization %", x=stages, y=utils,
        mode="lines+markers", yaxis="y2",
        line=dict(color=CYAN, width=2.5),
        marker=dict(size=8, color=CYAN, line=dict(color=BG, width=2)),
        hovertemplate="<b>%{x}</b><br>Utilization: %{y:.1f}%<extra></extra>",
    ))
    fig.update_layout(
        **BASE_LAYOUT,
        legend=dict(
            orientation="h", y=1.02, x=0,
            font=dict(size=10, color=TEXT_COL),
            bgcolor="rgba(10,15,30,0.8)", bordercolor=BORDER, borderwidth=1,
        ),
        yaxis2=dict(
            overlaying="y", side="right", gridcolor=GRID_COL,
            range=[80, 110], title="Utilization %",
            title_font=dict(color=CYAN, size=10),
            tickfont=dict(color=MUTED, size=9),
            linecolor=BORDER,
        ),
        title=dict(
            text=f'<span style="color:{CYAN}">⚡ Stage Bottleneck Analysis</span>',
            font=dict(size=12, color=CYAN), x=0,
        ),
        height=280, barmode="group",
    )
    return fig


# ── Stage Health Heatmap ──────────────────────────────────────
def stage_health_heatmap(stage_kpis: Dict[str, List[Dict]]) -> go.Figure:
    """
    Heatmap: stages × KPI parameters, colored by status score.
    GREEN=100, YELLOW=55, RED=15
    """
    score_map = {"GREEN": 100, "YELLOW": 55, "RED": 15}
    stage_labels = []
    param_labels = []
    z_values = []
    hover_text = []

    all_params = set()
    for kpis in stage_kpis.values():
        for k in kpis:
            all_params.add(k["name"])
    param_labels = sorted(list(all_params))

    for stage, kpis in stage_kpis.items():
        stage_labels.append(stage.replace("_", " ").title())
        param_map = {k["name"]: k for k in kpis}
        row, hover_row = [], []
        for p in param_labels:
            k = param_map.get(p)
            if k:
                score = score_map.get(k["status"], 100)
                row.append(score)
                hover_row.append(f"{p}: {k['value']:.2f} {k.get('unit','')} [{k['status']}]")
            else:
                row.append(None)
                hover_row.append("")
        z_values.append(row)
        hover_text.append(hover_row)

    fig = go.Figure(go.Heatmap(
        z=z_values,
        x=param_labels,
        y=stage_labels,
        colorscale=[
            [0.0, "rgba(255,51,102,0.8)"],
            [0.4, "rgba(255,184,0,0.7)"],
            [1.0, "rgba(0,255,136,0.7)"],
        ],
        zmin=0, zmax=100,
        text=hover_text,
        hovertemplate="%{text}<extra></extra>",
        showscale=True,
        colorbar=dict(
            title="Health", tickfont=dict(color=MUTED, size=9),
            title_font=dict(color=MUTED, size=10),
            bgcolor=BG, bordercolor=BORDER, borderwidth=1,
            tickvals=[15, 55, 100], ticktext=["RED", "WARN", "OK"],
        ),
        xgap=2, ygap=2,
    ))
    fig.update_layout(
        **{k: v for k, v in BASE_LAYOUT.items() if k not in ("xaxis", "yaxis", "margin")},
        xaxis=dict(
            tickfont=dict(color=MUTED, size=8), tickangle=-45,
            gridcolor=GRID_COL, linecolor=BORDER,
        ),
        yaxis=dict(tickfont=dict(color=TEXT_COL, size=10), linecolor=BORDER),
        height=300,
        title=dict(
            text=f'<span style="color:{CYAN}">🌡 Stage Health Matrix</span>',
            font=dict(size=12, color=CYAN), x=0,
        ),
        margin=dict(l=100, r=60, t=50, b=100),
    )
    return fig


# ── Mini Sparkline ────────────────────────────────────────────
def sparkline(values: List[float], color: str = CYAN, height: int = 48) -> go.Figure:
    rgb = tuple(int(color.lstrip("#")[i:i+2], 16) for i in (0, 2, 4))
    fig = go.Figure(go.Scatter(
        y=values, mode="lines",
        line=dict(color=color, width=2, shape="spline"),
        fill="tozeroy",
        fillcolor=f"rgba({rgb[0]},{rgb[1]},{rgb[2]},0.12)",
    ))
    # Tip marker
    if values:
        fig.add_trace(go.Scatter(
            x=[len(values) - 1], y=[values[-1]], mode="markers",
            marker=dict(color=color, size=5, line=dict(color=BG, width=1)),
            showlegend=False,
        ))
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0, r=0, t=0, b=0), height=height,
        xaxis=dict(visible=False), yaxis=dict(visible=False),
        showlegend=False,
    )
    return fig
