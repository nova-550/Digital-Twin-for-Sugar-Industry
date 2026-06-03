"""
components/svg_diagrams.py  — P&ID-style SVG process diagrams for each stage.
"""

def _svg_wrap(content: str, w: int = 800, h: int = 300) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'style="background:#0a0e1a;border-radius:12px;width:100%;font-family:monospace">'
        f'{content}</svg>'
    )

def _box(x,y,w,h,label,color="#1e3a5f",text_color="#00d4ff",sub=""):
    sub_el = f'<text x="{x+w//2}" y="{y+h//2+16}" text-anchor="middle" font-size="9" fill="#aaa">{sub}</text>' if sub else ""
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{color}" stroke="#00d4ff" stroke-width="1.5"/>'
        f'<text x="{x+w//2}" y="{y+h//2+5}" text-anchor="middle" font-size="11" fill="{text_color}" font-weight="bold">{label}</text>'
        f'{sub_el}'
    )

def _arrow(x1,y1,x2,y2,label="",color="#00d4ff"):
    mid_x=(x1+x2)//2; mid_y=(y1+y2)//2
    lbl = f'<text x="{mid_x}" y="{mid_y-5}" text-anchor="middle" font-size="9" fill="#aaa">{label}</text>' if label else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="2" marker-end="url(#arr)"/>{lbl}'

def _defs():
    return ('<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">'
            '<path d="M0,0 L0,6 L8,3 z" fill="#00d4ff"/></marker></defs>')

def _circle(x,y,r,label,color="#1e3a5f"):
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" stroke="#00d4ff" stroke-width="1.5"/>'
            f'<text x="{x}" y="{y+4}" text-anchor="middle" font-size="10" fill="#00d4ff" font-weight="bold">{label}</text>')

def _valve(x,y):
    return (f'<polygon points="{x},{y-8} {x+12},{y} {x},{y+8} {x-12},{y}" '
            f'fill="#ff9800" stroke="#fff" stroke-width="1"/>')

def _sensor(x,y,label):
    return (f'<circle cx="{x}" cy="{y}" r="8" fill="#9c27b0" stroke="#e040fb" stroke-width="1.5"/>'
            f'<text x="{x}" y="{y+4}" text-anchor="middle" font-size="7" fill="#fff">{label}</text>')


# ── Diagrams ───────────────────────────────────────────────────

def cane_handling_svg() -> str:
    d = _defs()
    d += _box(20,120,100,50,"Cane Yard","#1a3a1a","#4caf50","Stock")
    d += _arrow(120,145,170,145,"Cane")
    d += _box(170,120,100,50,"Weighbridge","#1e3a5f","#00d4ff","t/hr")
    d += _arrow(270,145,320,145)
    d += _box(320,120,100,50,"Trash Sep.","#3a1a1a","#ff9800","3.5%")
    d += _arrow(420,145,470,145,"Net Cane")
    d += _box(470,120,100,50,"Conveyor","#1a1a3a","#9c27b0","45 m/min")
    d += _arrow(570,145,620,145)
    d += _box(620,120,100,50,"Cane Prep.","#1e3a5f","#00d4ff","Shredder")
    d += _sensor(200,100,"FR"); d += _sensor(350,100,"AN"); d += _sensor(500,100,"SP")
    d += '<text x="400" y="30" text-anchor="middle" font-size="14" fill="#4caf50" font-weight="bold">Cane Handling &amp; Unloading</text>'
    d += '<text x="400" y="50" text-anchor="middle" font-size="10" fill="#aaa">210 t/hr nominal capacity</text>'
    return _svg_wrap(d)


def milling_svg() -> str:
    d = _defs()
    d += _box(20,110,90,60,"Raw Cane\nIn","#1a3a1a","#4caf50","210 t/hr")
    d += _arrow(110,140,155,140)
    for i,label in enumerate(["Mill 1","Mill 2","Mill 3","Mill 4","Mill 5"]):
        x = 155 + i*110
        d += _box(x,110,90,60,label,"#1e3a5f","#2196f3",f"M{i+1}")
        if i < 4:
            d += _arrow(x+90,140,x+110,140)
        d += _sensor(x+45,100,"AMP")
    d += _arrow(155+4*110+90,140,720,140,"Bagasse")
    d += _box(720,110,60,60,"Boiler","#3a1a1a","#ff9800","Steam")
    # imbibition water arrows going up
    for i in range(4):
        x = 155 + i*110 + 45
        d += f'<line x1="{x}" y1="200" x2="{x}" y2="170" stroke="#2196f3" stroke-width="1.5" stroke-dasharray="4"/>'
        d += f'<text x="{x}" y="215" text-anchor="middle" font-size="8" fill="#2196f3">H₂O</text>'
    d += _arrow(110,230,155,230,"Mixed Juice →")
    d += '<text x="400" y="30" text-anchor="middle" font-size="14" fill="#2196f3" font-weight="bold">5-Roller Milling Train</text>'
    d += '<text x="400" y="50" text-anchor="middle" font-size="10" fill="#aaa">Extraction: 96.5% | Imbibition: 25%</text>'
    return _svg_wrap(d, 800, 270)


def clarification_svg() -> str:
    d = _defs()
    d += _box(20,120,90,50,"Raw Juice","#1e3a5f","#00d4ff","15.2° Bx")
    d += _arrow(110,145,155,145)
    d += _box(155,100,80,40,"Lime\nDosing","#2a1a00","#ff9800","0.85 kg/TC")
    d += _box(155,155,80,40,"Sulfur\nDosing","#1a1a2a","#9c27b0","180 ppm")
    d += _arrow(235,120,280,120); d += _arrow(235,175,280,175)
    d += _box(280,100,100,80,"Flash\nHeater","#1e3a5f","#f44336","102°C")
    d += _arrow(380,140,430,140)
    d += _box(430,80,120,120,"Clarifier\nSettler","#0d2b0d","#4caf50","Purity 84.5%")
    d += _arrow(550,110,610,90,"Clear Juice")
    d += _arrow(550,170,610,190,"Mud")
    d += _box(610,70,110,50,"To\nEvaporation","#1e3a5f","#00d4ff","185 t/hr")
    d += _box(610,160,110,50,"Mud Filter","#2a1a00","#ff9800","Filtrate")
    d += _sensor(310,75,"pH"); d += _sensor(460,70,"TU"); d += _sensor(640,55,"BX")
    d += '<text x="400" y="30" text-anchor="middle" font-size="14" fill="#9c27b0" font-weight="bold">Juice Clarification (Defecation)</text>'
    return _svg_wrap(d, 760, 260)


def evaporation_svg() -> str:
    d = _defs()
    # Steam header at top
    d += '<rect x="0" y="20" width="760" height="20" rx="4" fill="#3a1a00" stroke="#ff9800" stroke-width="1"/>'
    d += '<text x="380" y="34" text-anchor="middle" font-size="10" fill="#ff9800">Live Steam Header — 2.8 bar</text>'
    # 4 effects
    for i in range(4):
        x = 30 + i*175
        temps = ["115°C","98°C","82°C","68°C"]
        d += _box(x, 60, 140, 140, f"Effect {i+1}", "#1e3a5f","#00d4ff", temps[i])
        # vapor to next effect
        if i < 3:
            d += _arrow(x+140,80,x+175,80,"Vapor")
        # condensate drop
        d += f'<line x1="{x+70}" y1="200" x2="{x+70}" y2="240" stroke="#2196f3" stroke-width="2"/>'
        d += f'<text x="{x+70}" y="255" text-anchor="middle" font-size="8" fill="#2196f3">Condensate</text>'
        d += _sensor(x+70,50,"T/P")
    # Juice flow
    d += _arrow(0,150,30,150,"Juice In")
    for i in range(3):
        d += _arrow(30+i*175+140,150,30+(i+1)*175,150)
    d += _arrow(30+3*175+140,150,760,150,"Syrup 62°Bx")
    d += '<text x="380" y="285" text-anchor="middle" font-size="14" fill="#ff9800" font-weight="bold">Quadruple Effect Evaporation</text>'
    return _svg_wrap(d, 760, 300)


def crystallization_svg() -> str:
    d = _defs()
    d += _box(20,100,110,60,"Syrup\nFeed Tank","#1e3a5f","#00d4ff","62° Bx")
    d += _arrow(130,130,180,130,"Syrup")
    d += _box(180,60,150,140,"Vacuum Pan","#0a1428","#00bcd4","68°C / 68 mbar")
    d += _valve(255,60)
    # Vacuum connection at top
    d += f'<line x1="255" y1="60" x2="255" y2="20" stroke="#9c27b0" stroke-width="2"/>'
    d += f'<line x1="200" y1="20" x2="700" y2="20" stroke="#9c27b0" stroke-width="2"/>'
    d += _box(650,10,100,30,"Vacuum\nSystem","#1a0a2a","#9c27b0","68 mbar")
    # Steam in
    d += _arrow(180,200,180,170,"Steam 12 t/hr")
    # Condensate
    d += _arrow(180,60,150,30,"Vapor →")
    d += _box(150,5,80,25,"Condenser","#1e3a5f","#00bcd4")
    # Massecuite out
    d += _arrow(330,130,390,130)
    d += _box(390,100,110,60,"Receiver\nCrystallizer","#0d1a2a","#00bcd4","σ=1.12")
    d += _arrow(500,130,550,130)
    d += _box(550,100,110,60,"Batch\nDischge","#1e3a5f","#00d4ff","92° Bx")
    d += _arrow(660,130,720,130,"MA →")
    # Sensors
    d += _sensor(255,85,"SS"); d += _sensor(330,85,"BX"); d += _sensor(440,85,"T")
    d += '<text x="380" y="285" text-anchor="middle" font-size="14" fill="#00bcd4" font-weight="bold">Vacuum Pan Crystallization</text>'
    return _svg_wrap(d, 760, 300)


def centrifugation_svg() -> str:
    d = _defs()
    d += _box(20,110,100,60,"Massecuite\nReceiver","#0d1a2a","#00bcd4","92° Bx")
    d += _arrow(120,140,170,140)
    # 3 centrifuges
    for i in range(3):
        y = 60 + i*75
        d += _circle(220, y+30, 35, f"C{i+1}", "#1e3a5f")
        d += _arrow(170,y+30,185,y+30)
        d += _arrow(255,y+30,310,y+30)
    d += _arrow(170,140,185,140)
    # Sugar output
    d += _box(310,100,110,50,"Wet Sugar","#1a2a1a","#4caf50","1.8% moist")
    d += _arrow(420,125,480,125)
    d += _box(480,100,100,50,"Sugar\nConveyor","#1a2a1a","#4caf50","→ Dryer")
    # Molasses
    d += _box(310,180,110,50,"Molasses","#2a1a00","#ff9800","88° Bx")
    d += _arrow(420,205,480,205,"→ Storage")
    # Wash water
    d += f'<line x1="220" y1="10" x2="220" y2="60" stroke="#2196f3" stroke-width="2" stroke-dasharray="4"/>'
    d += f'<text x="220" y="8" text-anchor="middle" font-size="9" fill="#2196f3">Wash H₂O 0.8 m³/hr</text>'
    d += _sensor(350,90,"PU"); d += _sensor(515,90,"MO")
    d += '<text x="380" y="260" text-anchor="middle" font-size="14" fill="#f44336" font-weight="bold">Centrifugation &amp; Massecuite Separation</text>'
    return _svg_wrap(d, 620, 280)


def drying_svg() -> str:
    d = _defs()
    d += _box(20,110,90,50,"Wet Sugar\nIn","#1a2a1a","#4caf50","1.8% moist")
    d += _arrow(110,135,160,135)
    d += _box(160,90,180,90,"Rotary Drum\nDryer","#1e3a5f","#ffeb3b","105°C inlet")
    d += _arrow(340,135,390,135)
    d += _box(390,90,160,90,"Rotary Drum\nCooler","#0d1a2a","#00bcd4","38°C outlet")
    d += _arrow(550,135,600,135)
    d += _box(600,110,100,50,"Dry Sugar\nOut","#1a2a1a","#4caf50","0.05% moist")
    # Hot air in
    d += _arrow(160,200,250,180,"Hot Air 105°C")
    d += _arrow(250,90,200,70,"Humid Air Out")
    d += _box(150,50,100,30,"Bag Filter","#2a1a00","#ff9800","Dust<50 mg/m³")
    # Cold air for cooler
    d += _arrow(390,200,470,180,"Ambient Air")
    d += _arrow(470,90,420,70,"Warm Air Out")
    d += _sensor(250,80,"T"); d += _sensor(470,80,"T"); d += _sensor(640,95,"MO")
    d += '<text x="380" y="270" text-anchor="middle" font-size="14" fill="#ffeb3b" font-weight="bold">Sugar Drying &amp; Cooling</text>'
    return _svg_wrap(d, 740, 290)


def molasses_svg() -> str:
    d = _defs()
    d += _box(20,110,100,60,"Centrifuge\nMolasses","#2a1a00","#ff9800","88° Bx")
    d += _arrow(120,140,170,140)
    d += _box(170,80,80,50,"Cooling\nCoil","#1e3a5f","#00d4ff","42°C")
    d += _arrow(250,105,300,105)
    # Tanks
    for i in range(2):
        x = 300 + i*160
        d += _box(x,70,140,120,f"Tank T{i+1}","#2a1500","#ff9800",f"{'65%' if i==0 else '40%'} level")
        d += _sensor(x+70,65,"LVL")
        if i == 0:
            d += _arrow(x+140,130,x+160,130)
    d += _arrow(620+140,130,780,130)
    d += _box(780,110,80,50,"Dispatch\nPump","#1e3a5f","#00d4ff","4.5 m³/hr")
    d += _arrow(780,130,760,130)
    d += _arrow(860,140,900,140,"→ Distillery")
    # Temp sensor on tank
    d += _sensor(370,195,"T"); d += _sensor(530,195,"VI")
    d += '<text x="450" y="35" text-anchor="middle" font-size="14" fill="#795548" font-weight="bold">Molasses Handling &amp; Storage</text>'
    return _svg_wrap(d, 960, 260)


STAGE_SVG_MAP = {
    "cane_handling":  cane_handling_svg,
    "milling":        milling_svg,
    "clarification":  clarification_svg,
    "evaporation":    evaporation_svg,
    "crystallization": crystallization_svg,
    "centrifugation": centrifugation_svg,
    "drying":         drying_svg,
    "molasses":       molasses_svg,
}

def get_stage_svg(stage_id: str) -> str:
    fn = STAGE_SVG_MAP.get(stage_id)
    return fn() if fn else "<svg/>"
