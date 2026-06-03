import math
import os
from typing import Dict, Any
import pandas as pd
import joblib

_model = None

def get_ml_model():
    global _model
    if _model is None:
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "new_milling_model.joblib")
        if not os.path.exists(model_path):
            model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "thirdmodel.joblib")
            
        if os.path.exists(model_path):
            try:
                _model = joblib.load(model_path)
                print(f"Loaded ML model from {model_path}")
            except Exception as e:
                print(f"Error loading ML model from {model_path}: {e}")
        else:
            print(f"ML model file not found at {model_path}")
    return _model

# --- Sugar Refinery Physical Constants ---
LATENT_HEAT_STEAM_KJ_KG = 2257.0       # Latent heat of vaporization (kJ/kg)
SPECIFIC_HEAT_JUICE_KJ_KG_K = 3.97     # Specific heat capacity of sugarcane juice (kJ/kg·K)
SUCROSE_DENSITY_KG_M3 = 1587.0         # Pure sucrose crystal density

def cane_handling_model(params: Dict[str, float]) -> Dict[str, float]:
    """
    Models sugarcane reception and shredding prep.
    Calculates net fiber and sucrose ratios entering the milling train.
    """
    feed_rate = params.get("cane_feed_rate_tph", 210.0)
    trash_pct = params.get("trash_pct", 3.5)
    cane_pol = params.get("cane_pol_pct", 18.2)      # Pol % cane (Sucrose ratio)
    cane_brix = params.get("cane_brix_pct", 20.5)    # Brix % cane (Soluble solids ratio)

    # Net clean cane crushed after conveyor screening
    net_cane_tph = feed_rate * (1.0 - trash_pct / 100.0)
    
    # Standard sugarcane fiber index is ~12.5%
    fibre_tph = net_cane_tph * 0.125
    
    # Net sugar content in clean feed
    sucrose_tph = net_cane_tph * (cane_pol / 100.0)
    purity = (cane_pol / cane_brix) * 100.0 if cane_brix > 0 else 0.0

    return {
        "net_cane_tph": round(net_cane_tph, 2),
        "fibre_tph": round(fibre_tph, 2),
        "sucrose_tph": round(sucrose_tph, 2),
        "cane_purity_pct": round(purity, 2)
    }

def milling_model(params: Dict[str, float], cane_outputs: Dict[str, float], force_physics: bool = False) -> Dict[str, float]:
    """
    Models the multi-roller milling extraction train.
    Computes juice dilution, extraction ratios, and wet bagasse moisture.
    Uses a machine learning model to predict extraction percentage if available.
    """
    cane_feed = cane_outputs.get("net_cane_tph", 202.65)
    imbibition_ratio = params.get("imbibition_water_pct", 25.0)  # Spray ratio on final bagasse
    mill_speed = params.get("mill_speed_rpm", 4.2)
    bagasse_moisture = params.get("bagasse_moisture_pct", 50.5)

    # Imbibition water tonnage
    imbibition_tph = cane_feed * (imbibition_ratio / 100.0)

    # Calculate extraction efficiency (sucrose extraction percent)
    ml_model = get_ml_model() if not force_physics else None
    if ml_model is not None:
        try:
            # Map parameters to features expected by ML model
            crushing_rate = cane_feed
            fiber_pct = 12.5
            
            # pol_pct_cane is calculated from sucrose_tph / net_cane_tph * 100.0
            sucrose_tph = cane_outputs.get("sucrose_tph", 36.9)
            pol_pct = (sucrose_tph / crushing_rate * 100.0) if crushing_rate > 0 else 18.2
            
            # imbibition_water_pct_fiber is ratio on fiber weight
            imbibition_water_pct_fiber = (imbibition_ratio / fiber_pct) * 100.0
            
            # mill_speed_rpm: scale current rpm range (3-5) to ML range (70-110)
            mill_speed_rpm = mill_speed * 21.42 if mill_speed < 10.0 else mill_speed
            
            feed_temp = 30.0
            mj_purity = cane_outputs.get("cane_purity_pct", 88.0)
            bagasse_moisture_val = bagasse_moisture
            season_day = 100
            
            # Get current shift
            import datetime
            hour = datetime.datetime.now().hour
            shift = "morning" if 8 <= hour < 20 else "night"
            cane_source = "estate"
            
            # Build prediction dataframe
            df = pd.DataFrame([{
                "crushing_rate_tph": crushing_rate,
                "fiber_pct_cane": fiber_pct,
                "pol_pct_cane": pol_pct,
                "imbibition_water_pct_fiber": imbibition_water_pct_fiber,
                "mill_speed_rpm": mill_speed_rpm,
                "feed_temp_c": feed_temp,
                "mj_purity": mj_purity,
                "bagasse_moisture_pct": bagasse_moisture_val,
                "season_day": season_day,
                "shift": shift,
                "cane_source": cane_source
            }])
            
            extraction_eff = ml_model.predict(df)[0]
            extraction_eff = min(max(extraction_eff, 88.0), 98.2)
        except Exception as e:
            # Fallback to physics equations if ML prediction fails
            speed_factor = 1.0 - abs(mill_speed - 4.2) * 0.08
            extraction_eff = 93.0 + (imbibition_ratio - 20.0) * 0.25 * speed_factor
            extraction_eff = min(max(extraction_eff, 88.0), 98.2)
    else:
        # Fallback to physics equations
        speed_factor = 1.0 - abs(mill_speed - 4.2) * 0.08
        extraction_eff = 93.0 + (imbibition_ratio - 20.0) * 0.25 * speed_factor
        extraction_eff = min(max(extraction_eff, 88.0), 98.2)

    # Juice flow extraction (TPH)
    juice_tph = cane_feed * (extraction_eff / 100.0) + imbibition_tph
    
    # Mixed juice brix (diluted by water)
    juice_brix = 16.5 - (imbibition_ratio - 20.0) * 0.14
    juice_pol = juice_brix * 0.88  # ~88% purity coefficient

    # Wet bagasse byproduct flow rate
    dry_bagasse = cane_feed * 0.125
    bagasse_wet_tph = dry_bagasse / (1.0 - bagasse_moisture / 100.0)

    return {
        "juice_tph": round(juice_tph, 2),
        "imbibition_tph": round(imbibition_tph, 2),
        "mill_extraction_pct": round(extraction_eff, 2),
        "juice_brix_pct": round(juice_brix, 2),
        "juice_pol_pct": round(juice_pol, 2),
        "bagasse_wet_tph": round(bagasse_wet_tph, 2)
    }


def clarification_model(params: Dict[str, float], mill_outputs: Dict[str, float]) -> Dict[str, float]:
    """
    Models clarification (defecation).
    Utilizes lime milk buffer equations. Shows maximum purity uplift at pH 7.2.
    """
    juice_in = mill_outputs.get("juice_tph", 195.0)
    juice_brix = mill_outputs.get("juice_brix_pct", 15.2)
    juice_pol = mill_outputs.get("juice_pol_pct", 13.3)
    lime_dosage = params.get("lime_dosage_kg_tc", 0.85)  # Dosing in kg/ton of cane
    temp = params.get("clarification_temp_c", 102.0)

    # Defecation pH curve based on lime milk dosage
    ph = 6.0 + lime_dosage * 1.5
    ph = min(max(ph, 5.5), 9.0)

    # Optimum clarification occurs at 7.2 pH. Deviations lead to sugar destruction or turbid juice!
    raw_purity = (juice_pol / juice_brix) * 100.0 if juice_brix > 0 else 0.0
    ph_loss = abs(7.2 - ph) * 0.6
    temp_loss = abs(102.0 - temp) * 0.04
    purity_uplift = max(0.2, 1.8 - ph_loss - temp_loss)
    clarified_purity = min(raw_purity + purity_uplift, 94.0)

    # Flocculated mud extraction (solids settling)
    mud_tph = juice_in * 0.08
    clarified_juice_tph = juice_in - mud_tph

    return {
        "clarified_juice_tph": round(clarified_juice_tph, 2),
        "mud_tph": round(mud_tph, 2),
        "estimated_ph": round(ph, 2),
        "clarified_purity_pct": round(clarified_purity, 2),
        "turbidity_reduction_pct": round(max(50.0, 96.0 - ph_loss * 15 - temp_loss * 10), 1)
    }

def evaporation_model(params: Dict[str, float], clarif_outputs: Dict[str, float]) -> Dict[str, float]:
    """
    Models the quadruple-effect evaporator train.
    Boils clarified juice to high-purity sugar syrup (~60-65% Brix).
    """
    juice_in = clarif_outputs.get("clarified_juice_tph", 179.4)
    brix_in = mill_outputs_fallback_brix = 15.0
    brix_in = params.get("juice_brix_in_pct", brix_in)
    steam_flow = params.get("steam_flow_tph", 42.0)
    economy = params.get("steam_economy", 3.4)  # Multi-effect efficiency ratio

    # Total evaporated water
    water_evap_tph = steam_flow * economy
    water_evap_tph = min(water_evap_tph, juice_in * 0.85)

    # Mass balance for syrup out
    syrup_out_tph = juice_in - water_evap_tph
    
    # Evaporated Brix concentration formula: brix_in * flow_in = brix_out * flow_out
    syrup_brix = brix_in * (juice_in / syrup_out_tph) if syrup_out_tph > 0 else 62.0
    syrup_brix = min(max(syrup_brix, 45.0), 78.0)

    return {
        "syrup_out_tph": round(syrup_out_tph, 2),
        "water_evaporated_tph": round(water_evap_tph, 2),
        "juice_brix_out_pct": round(syrup_brix, 2),
        "actual_steam_needed_tph": round(water_evap_tph / economy, 2)
    }

def crystallization_model(params: Dict[str, float], evap_outputs: Dict[str, float]) -> Dict[str, float]:
    """
    Models vacuum crystallization pans.
    Tracks boiling supersaturation and crystal size propagation.
    """
    syrup_in = evap_outputs.get("syrup_out_tph", 45.5)
    syrup_brix = evap_outputs.get("juice_brix_out_pct", 62.0)
    supersat = params.get("supersaturation_coeff", 1.15)
    vacuum = params.get("vacuum_pressure_mbar", 68.0)

    # Massecuite target Brix (Heavy molasses-crystal slurry)
    ma_brix = 88.0 + (supersat - 1.0) * 12.0
    ma_brix = min(max(ma_brix, 86.0), 96.0)

    # Boiling temperature matches vacuum pressure
    pan_temp = 100.0 - math.log10(1013.0 / vacuum) * 26.0
    pan_temp = min(max(pan_temp, 50.0), 85.0)

    # Crystal yield calculation (Doring formula coefficient)
    crystal_yield = (syrup_brix - 55.0) * 1.5 + (supersat - 1.0) * 35.0
    crystal_yield = min(max(crystal_yield, 30.0), 55.0)

    # Refined crystal output vs remaining mother-liquor molasses
    total_solids = syrup_in * (syrup_brix / 100.0)
    crystal_tph = total_solids * (crystal_yield / 100.0)
    molasses_tph = total_solids - crystal_tph

    return {
        "massecuite_brix_pct": round(ma_brix, 2),
        "pan_temp_c": round(pan_temp, 2),
        "crystal_yield_pct": round(crystal_yield, 2),
        "crystal_tph": round(crystal_tph, 2),
        "molasses_tph": round(molasses_tph, 2),
        "massecuite_tph": round(crystal_tph + molasses_tph, 2)
    }

def centrifugation_model(params: Dict[str, float], cryst_outputs: Dict[str, float]) -> Dict[str, float]:
    """
    Models batch centrifugal sugar-crystal separator.
    Computes purity and separation speed dynamics.
    """
    massecuite_in = cryst_outputs.get("massecuite_tph", 28.0)
    speed_rpm = params.get("centrifuge_speed_rpm", 1080.0)
    wash_water = params.get("wash_water_m3_hr", 0.8)

    # G-Force separation index
    r_meters = 0.45  # Basket radius
    g_force = ((speed_rpm / 60.0) ** 2) * r_meters * 2.0 * (math.pi ** 2) / 9.81
    
    # Efficiency is directly driven by spinning G-force
    efficiency = 88.0 + (g_force - 400.0) * 0.015
    efficiency = min(max(efficiency, 85.0), 99.2)

    # Output pure crystals (99.5% standard refining purity)
    sugar_tph = massecuite_in * 0.50 * (efficiency / 100.0)
    molasses_out = massecuite_in - sugar_tph

    # Wash water cleans off final syrup film but dissolves a micro-fraction of sugar
    sugar_purity = 99.2 + wash_water * 0.3
    sugar_purity = min(sugar_purity, 99.98)

    return {
        "sugar_tph": round(sugar_tph, 2),
        "molasses_tph_out": round(molasses_out, 2),
        "g_factor": round(g_force, 1),
        "separation_efficiency_pct": round(efficiency, 2),
        "final_sugar_purity_pct": round(sugar_purity, 2)
    }
