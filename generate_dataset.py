import os
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

# Import the ML model loader
from physics_engine import get_ml_model

def generate_full_plant_dataset(num_samples=15000):
    print(f"Starting vectorized generation of {num_samples} plant telemetry records...")
    
    # Set random seeds for reproducibility
    np.random.seed(42)
    
    # Generate timestamps starting from 12/02/2025 10:00 PM (hourly ticks)
    start_date = pd.to_datetime("2025-02-12 22:00:00")
    timestamps = pd.date_range(start=start_date, periods=num_samples, freq="h")
    timestamp_strs = timestamps.strftime("%d/%m/%Y %I:%M %p")
    
    # Categorical context columns for all records
    mill_shift = np.random.choice(["morning", "night"], size=num_samples)
    mill_cane_source = np.random.choice(["estate", "member", "outside"], size=num_samples)
    
    # 1. Generate random inputs for all stages in parallel
    # Cane Handling Inputs
    cane_feed_rate_tph = np.random.uniform(100.0, 300.0, num_samples)
    trash_pct = np.random.uniform(0.5, 10.0, num_samples)
    cane_pol_pct = np.random.uniform(12.0, 19.0, num_samples)
    cane_brix_pct = cane_pol_pct + np.random.uniform(1.5, 3.5, num_samples)
    
    # Milling Inputs
    imbibition_water_pct = np.random.uniform(15.0, 40.0, num_samples)
    mill_speed_rpm = np.random.uniform(2.0, 8.0, num_samples)
    bagasse_moisture_pct = np.random.uniform(40.0, 60.0, num_samples)
    
    # Clarification Inputs
    lime_dosage_kg_tc = np.random.uniform(0.4, 1.6, num_samples)
    clarification_temp_c = np.random.uniform(85.0, 115.0, num_samples)
    
    # Evaporation Inputs
    steam_flow_tph = np.random.uniform(20.0, 60.0, num_samples)
    steam_economy = np.random.uniform(2.5, 4.5, num_samples)
    
    # Crystallization Inputs
    supersaturation_coeff = np.random.uniform(0.90, 1.40, num_samples)
    vacuum_pressure_mbar = np.random.uniform(40.0, 100.0, num_samples)
    
    # Centrifugation Inputs
    centrifuge_speed_rpm = np.random.uniform(800.0, 1400.0, num_samples)
    wash_water_m3_hr = np.random.uniform(0.2, 2.0, num_samples)
    
    # 2. Propagate calculations vectorially
    
    # Stage 1: Cane Handling
    ch_net_cane_tph = cane_feed_rate_tph * (1.0 - trash_pct / 100.0)
    ch_fibre_tph = ch_net_cane_tph * 0.125
    ch_sucrose_tph = ch_net_cane_tph * (cane_pol_pct / 100.0)
    ch_cane_purity_pct = (cane_pol_pct / cane_brix_pct) * 100.0
    
    # Stage 2: Milling
    # Calculate imbibition tph
    mill_imbibition_tph = ch_net_cane_tph * (imbibition_water_pct / 100.0)
    
    # Load ML Model for Extraction Efficiency
    ml_model = get_ml_model()
    if ml_model is not None:
        print("ML model found. Performing batch predictions...")
        # Prepare inputs exactly as expected by the ML model pipeline
        pol_pct_cane = (ch_sucrose_tph / ch_net_cane_tph * 100.0)
        imbibition_water_pct_fiber = (imbibition_water_pct / 12.5) * 100.0
        mill_speed_rpm_scaled = np.where(mill_speed_rpm < 10.0, mill_speed_rpm * 21.42, mill_speed_rpm)
        
        # Build features dataframe
        X_pred = pd.DataFrame({
            "crushing_rate_tph": ch_net_cane_tph,
            "fiber_pct_cane": 12.5,
            "pol_pct_cane": pol_pct_cane,
            "imbibition_water_pct_fiber": imbibition_water_pct_fiber,
            "mill_speed_rpm": mill_speed_rpm_scaled,
            "feed_temp_c": 30.0,
            "mj_purity": ch_cane_purity_pct,
            "bagasse_moisture_pct": bagasse_moisture_pct,
            "season_day": 100,
            "shift": mill_shift,
            "cane_source": mill_cane_source
        })
        
        # Batch predict
        mill_extraction_pct = ml_model.predict(X_pred)
        mill_extraction_pct = np.clip(mill_extraction_pct, 88.0, 98.2)
    else:
        print("ML model not found. Using physics fallback model...")
        speed_factor = 1.0 - np.abs(mill_speed_rpm - 4.2) * 0.08
        mill_extraction_pct = 93.0 + (imbibition_water_pct - 20.0) * 0.25 * speed_factor
        mill_extraction_pct = np.clip(mill_extraction_pct, 88.0, 98.2)
        
    mill_juice_tph = ch_net_cane_tph * (mill_extraction_pct / 100.0) + mill_imbibition_tph
    mill_juice_brix_pct = 16.5 - (imbibition_water_pct - 20.0) * 0.14
    mill_juice_pol_pct = mill_juice_brix_pct * 0.88
    mill_bagasse_wet_tph = (ch_net_cane_tph * 0.125) / (1.0 - bagasse_moisture_pct / 100.0)
    
    # Stage 3: Clarification
    clar_estimated_ph = np.clip(6.0 + lime_dosage_kg_tc * 1.5, 5.5, 9.0)
    ph_loss = np.abs(7.2 - clar_estimated_ph) * 0.6
    temp_loss = np.abs(102.0 - clarification_temp_c) * 0.04
    purity_uplift = np.maximum(0.2, 1.8 - ph_loss - temp_loss)
    clar_clarified_purity_pct = np.minimum(ch_cane_purity_pct + purity_uplift, 94.0)
    clar_mud_tph = mill_juice_tph * 0.08
    clar_clarified_juice_tph = mill_juice_tph - clar_mud_tph
    clar_turbidity_reduction_pct = np.maximum(50.0, 96.0 - ph_loss * 15.0 - temp_loss * 10.0)
    
    # Stage 4: Evaporation
    evap_water_evaporated_tph = np.minimum(steam_flow_tph * steam_economy, clar_clarified_juice_tph * 0.85)
    evap_syrup_out_tph = clar_clarified_juice_tph - evap_water_evaporated_tph
    evap_juice_brix_out_pct = np.clip(15.2 * (clar_clarified_juice_tph / evap_syrup_out_tph), 45.0, 78.0)
    evap_actual_steam_needed_tph = evap_water_evaporated_tph / steam_economy
    
    # Stage 5: Crystallization
    cryst_massecuite_brix_pct = np.clip(88.0 + (supersaturation_coeff - 1.0) * 12.0, 86.0, 96.0)
    cryst_pan_temp_c = np.clip(100.0 - np.log10(1013.0 / vacuum_pressure_mbar) * 26.0, 50.0, 85.0)
    cryst_crystal_yield_pct = np.clip((evap_juice_brix_out_pct - 55.0) * 1.5 + (supersaturation_coeff - 1.0) * 35.0, 30.0, 55.0)
    total_solids = evap_syrup_out_tph * (evap_juice_brix_out_pct / 100.0)
    cryst_crystal_tph = total_solids * (cryst_crystal_yield_pct / 100.0)
    cryst_molasses_tph = total_solids - cryst_crystal_tph
    cryst_massecuite_tph = cryst_crystal_tph + cryst_molasses_tph
    
    # Stage 6: Centrifugation
    g_force = ((centrifuge_speed_rpm / 60.0) ** 2) * 0.45 * 2.0 * (np.pi ** 2) / 9.81
    cent_separation_efficiency_pct = np.clip(88.0 + (g_force - 400.0) * 0.015, 85.0, 99.2)
    cent_sugar_tph = cryst_massecuite_tph * 0.50 * (cent_separation_efficiency_pct / 100.0)
    cent_molasses_tph_out = cryst_massecuite_tph - cent_sugar_tph
    cent_final_sugar_purity_pct = np.minimum(99.2 + wash_water_m3_hr * 0.3, 99.98)
    
    # 3. Compile all stages data into a single Pandas DataFrame
    df_out = pd.DataFrame({
        "timestamp": timestamp_strs,
        
        # Cane Handling Stage
        "ch_cane_feed_rate_tph": cane_feed_rate_tph,
        "ch_trash_pct": trash_pct,
        "ch_cane_pol_pct": cane_pol_pct,
        "ch_cane_brix_pct": cane_brix_pct,
        "ch_net_cane_tph": ch_net_cane_tph,
        "ch_fibre_tph": ch_fibre_tph,
        "ch_sucrose_tph": ch_sucrose_tph,
        "ch_cane_purity_pct": ch_cane_purity_pct,
        
        # Milling Stage
        "mill_imbibition_water_pct": imbibition_water_pct,
        "mill_mill_speed_rpm": mill_speed_rpm,
        "mill_bagasse_moisture_pct": bagasse_moisture_pct,
        "mill_juice_tph": mill_juice_tph,
        "mill_imbibition_tph": mill_imbibition_tph,
        "mill_mill_extraction_pct": mill_extraction_pct,
        "mill_juice_brix_pct": mill_juice_brix_pct,
        "mill_juice_pol_pct": mill_juice_pol_pct,
        "mill_bagasse_wet_tph": mill_bagasse_wet_tph,
        "mill_shift": mill_shift,
        "mill_cane_source": mill_cane_source,
        
        # Clarification Stage
        "clar_lime_dosage_kg_tc": lime_dosage_kg_tc,
        "clar_clarification_temp_c": clarification_temp_c,
        "clar_clarified_juice_tph": clar_clarified_juice_tph,
        "clar_mud_tph": clar_mud_tph,
        "clar_estimated_ph": clar_estimated_ph,
        "clar_clarified_purity_pct": clar_clarified_purity_pct,
        "clar_turbidity_reduction_pct": clar_turbidity_reduction_pct,
        
        # Evaporation Stage
        "evap_juice_brix_in_pct": mill_juice_brix_pct,
        "evap_steam_flow_tph": steam_flow_tph,
        "evap_steam_economy": steam_economy,
        "evap_syrup_out_tph": evap_syrup_out_tph,
        "evap_water_evaporated_tph": evap_water_evaporated_tph,
        "evap_juice_brix_out_pct": evap_juice_brix_out_pct,
        "evap_actual_steam_needed_tph": evap_actual_steam_needed_tph,
        
        # Crystallization Stage
        "cryst_supersaturation_coeff": supersaturation_coeff,
        "cryst_vacuum_pressure_mbar": vacuum_pressure_mbar,
        "cryst_massecuite_brix_pct": cryst_massecuite_brix_pct,
        "cryst_pan_temp_c": cryst_pan_temp_c,
        "cryst_crystal_yield_pct": cryst_crystal_yield_pct,
        "cryst_crystal_tph": cryst_crystal_tph,
        "cryst_molasses_tph": cryst_molasses_tph,
        "cryst_massecuite_tph": cryst_massecuite_tph,
        
        # Centrifugation Stage
        "cent_centrifuge_speed_rpm": centrifuge_speed_rpm,
        "cent_wash_water_m3_hr": wash_water_m3_hr,
        "cent_sugar_tph": cent_sugar_tph,
        "cent_molasses_tph_out": cent_molasses_tph_out,
        "cent_g_factor": g_force,
        "cent_separation_efficiency_pct": cent_separation_efficiency_pct,
        "cent_final_sugar_purity_pct": cent_final_sugar_purity_pct
    })
    
    # Round all values to 3 decimal places for cleaner CSV records (excl categorical & string columns)
    cols_to_round = df_out.select_dtypes(include=[np.number]).columns
    df_out[cols_to_round] = df_out[cols_to_round].round(3)
    
    # Save the output CSV file
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "plant_stages_dataset.csv")
    df_out.to_csv(output_path, index=False)
    
    print(f"Dataset generated successfully and saved to: {output_path}")
    print(f"Dataset Dimensions: {df_out.shape[0]} rows by {df_out.shape[1]} columns")
    print(f"First row timestamp: {df_out.iloc[0]['timestamp']}, Last row timestamp: {df_out.iloc[-1]['timestamp']}")

if __name__ == "__main__":
    generate_full_plant_dataset(num_samples=15000)
