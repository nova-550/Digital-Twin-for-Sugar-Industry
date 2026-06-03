"""
tests/test_process_models.py — Unit tests for all 8 physics models.
Run: pytest tests/ -v --cov=process_models
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from process_models import (
    cane_handling_model, milling_model, clarification_model,
    evaporation_model, crystallization_model, centrifugation_model,
    drying_model, molasses_model, plant_mass_balance
)


class TestCaneHandling:
    def test_net_cane_lower_than_feed(self):
        r = cane_handling_model({"cane_feed_rate_tph": 210, "trash_pct": 3.5, "moisture_pct": 72,
                                  "cane_brix_pct": 20.5, "cane_pol_pct": 18.2})
        assert r["net_cane_tph"] < 210

    def test_sucrose_positive(self):
        r = cane_handling_model({"cane_feed_rate_tph": 200, "trash_pct": 3.0, "moisture_pct": 72,
                                  "cane_brix_pct": 20.0, "cane_pol_pct": 18.0})
        assert r["sucrose_tph"] > 0

    def test_zero_trash(self):
        r = cane_handling_model({"cane_feed_rate_tph": 200, "trash_pct": 0, "moisture_pct": 72,
                                  "cane_brix_pct": 20.0, "cane_pol_pct": 18.0})
        assert r["net_cane_tph"] == pytest.approx(200.0, rel=0.01)

    def test_purity_bounds(self):
        r = cane_handling_model({"cane_feed_rate_tph": 200, "trash_pct": 3.5, "moisture_pct": 72,
                                  "cane_brix_pct": 20.5, "cane_pol_pct": 18.2})
        assert 0 < r["cane_purity_pct"] < 100


class TestMillingModel:
    BASE = {"net_cane_tph": 210, "mill_extraction_pct": 96.5, "juice_brix_pct": 15.2,
            "juice_pol_pct": 13.8, "bagasse_moisture_pct": 50.5,
            "imbibition_water_pct": 25.0, "mill_speed_rpm": 4.2}

    def test_juice_output_positive(self):
        r = milling_model(self.BASE)
        assert r["juice_tph"] > 0

    def test_mass_balance(self):
        r = milling_model(self.BASE)
        # juice + bagasse ≈ cane_in + imbibition
        total_in  = self.BASE["net_cane_tph"] + self.BASE["net_cane_tph"] * self.BASE["imbibition_water_pct"]/100
        total_out = r["juice_tph"] + r["bagasse_wet_tph"]
        assert abs(total_in - total_out) < 50  # within 50 t/hr (model simplification)

    def test_higher_extraction_more_juice(self):
        r_low  = milling_model({**self.BASE, "mill_extraction_pct": 93.0})
        r_high = milling_model({**self.BASE, "mill_extraction_pct": 97.0})
        assert r_high["juice_tph"] > r_low["juice_tph"]

    def test_power_positive(self):
        r = milling_model(self.BASE)
        assert r["mill_power_kwh"] > 0


class TestClarificationModel:
    BASE = {"juice_tph": 200, "juice_brix_pct": 15.2, "juice_pol_pct": 13.8,
            "lime_dosage_kg_tc": 0.85, "clarification_temp_c": 102.0,
            "mud_volume_pct": 12.0, "sulfur_dosage_ppm": 180.0}

    def test_clarified_less_than_input(self):
        r = clarification_model(self.BASE)
        assert r["clarified_juice_tph"] < self.BASE["juice_tph"]

    def test_ph_in_range(self):
        r = clarification_model(self.BASE)
        assert 6.0 <= r["estimated_ph"] <= 9.0

    def test_higher_lime_raises_ph(self):
        r_low  = clarification_model({**self.BASE, "lime_dosage_kg_tc": 0.5})
        r_high = clarification_model({**self.BASE, "lime_dosage_kg_tc": 1.2})
        assert r_high["estimated_ph"] > r_low["estimated_ph"]

    def test_purity_uplift(self):
        r = clarification_model(self.BASE)
        raw_purity = self.BASE["juice_pol_pct"] / self.BASE["juice_brix_pct"] * 100
        assert r["clarified_purity_pct"] >= raw_purity


class TestEvaporationModel:
    BASE = {"clarified_juice_tph": 185, "juice_brix_in_pct": 15.0, "juice_brix_out_pct": 62.0,
            "steam_pressure_bar": 2.8, "steam_flow_tph": 45.0, "energy_efficiency_pct": 89.0}

    def test_mass_balance(self):
        r = evaporation_model(self.BASE)
        assert abs(self.BASE["clarified_juice_tph"] - r["syrup_out_tph"] - r["water_evaporated_tph"]) < 1.0

    def test_economy_positive(self):
        r = evaporation_model(self.BASE)
        assert r["steam_economy"] > 0

    def test_higher_brix_out_less_syrup(self):
        r_lo = evaporation_model({**self.BASE, "juice_brix_out_pct": 55.0})
        r_hi = evaporation_model({**self.BASE, "juice_brix_out_pct": 65.0})
        assert r_hi["syrup_out_tph"] < r_lo["syrup_out_tph"]

    def test_heat_duty_positive(self):
        r = evaporation_model(self.BASE)
        assert r["heat_duty_kw"] > 0


class TestCrystallizationModel:
    BASE = {"syrup_out_tph": 45, "juice_brix_out_pct": 62, "supersaturation_coeff": 1.12,
            "vacuum_pressure_mbar": 68, "crystal_purity_pct": 99.2,
            "pan_temp_c": 68, "batch_cycle_min": 120}

    def test_crystal_yield_positive(self):
        r = crystallization_model(self.BASE)
        assert r["crystal_tph"] > 0

    def test_massecuite_brix_in_range(self):
        r = crystallization_model(self.BASE)
        assert 85 <= r["massecuite_brix_pct"] <= 98

    def test_higher_ss_higher_brix(self):
        r_lo = crystallization_model({**self.BASE, "supersaturation_coeff": 1.05})
        r_hi = crystallization_model({**self.BASE, "supersaturation_coeff": 1.20})
        assert r_hi["massecuite_brix_pct"] >= r_lo["massecuite_brix_pct"]


class TestCentrifugationModel:
    BASE = {"massecuite_tph": 38, "centrifuge_speed_rpm": 1050, "sugar_purity_pct": 99.5,
            "molasses_brix_pct": 88, "wash_water_m3_hr": 0.8}

    def test_sugar_output_positive(self):
        r = centrifugation_model(self.BASE)
        assert r["sugar_tph"] > 0

    def test_total_output_less_than_input(self):
        r = centrifugation_model(self.BASE)
        assert r["sugar_tph"] + r["molasses_tph_out"] <= self.BASE["massecuite_tph"] * 1.01

    def test_g_factor_positive(self):
        r = centrifugation_model(self.BASE)
        assert r["g_factor"] > 0

    def test_higher_speed_better_efficiency(self):
        r_lo = centrifugation_model({**self.BASE, "centrifuge_speed_rpm": 900})
        r_hi = centrifugation_model({**self.BASE, "centrifuge_speed_rpm": 1150})
        assert r_hi["separation_efficiency_pct"] >= r_lo["separation_efficiency_pct"]


class TestDryingModel:
    BASE = {"sugar_tph": 20, "inlet_sugar_moisture_pct": 1.8, "outlet_sugar_moisture_pct": 0.05,
            "inlet_air_temp_c": 105, "outlet_air_temp_c": 45, "drum_speed_rpm": 6.0}

    def test_moisture_reduced(self):
        r = drying_model(self.BASE)
        assert r["final_sugar_moisture_pct"] <= self.BASE["inlet_sugar_moisture_pct"]

    def test_water_removed_positive(self):
        r = drying_model(self.BASE)
        assert r["water_removed_kg_hr"] > 0

    def test_energy_positive(self):
        r = drying_model(self.BASE)
        assert r["drying_heat_kw"] > 0


class TestMolassesModel:
    BASE = {"molasses_tph_out": 8.5, "molasses_brix_pct": 88.5, "molasses_purity_pct": 32.0,
            "tank_level_pct": 65.0, "storage_temp_c": 42.0, "dispatch_rate_m3_hr": 4.5}

    def test_viscosity_positive(self):
        r = molasses_model(self.BASE)
        assert r["viscosity_cp"] > 0

    def test_higher_temp_lower_viscosity(self):
        r_cold = molasses_model({**self.BASE, "storage_temp_c": 30})
        r_hot  = molasses_model({**self.BASE, "storage_temp_c": 55})
        assert r_hot["viscosity_cp"] < r_cold["viscosity_cp"]

    def test_density_reasonable(self):
        r = molasses_model(self.BASE)
        assert 1200 < r["molasses_density_kg_m3"] < 1600


class TestPlantMassBalance:
    def test_returns_all_keys(self):
        dummy = {s: {} for s in ["cane_handling","milling","clarification","evaporation",
                                  "crystallization","centrifugation","drying","molasses"]}
        r = plant_mass_balance(dummy)
        assert "sugar_recovery_pct" in r
        assert "energy_intensity_kwh_ton" in r
        assert "co2_tons_day" in r

    def test_recovery_in_range(self):
        dummy = {s: {} for s in ["cane_handling","milling","clarification","evaporation",
                                  "crystallization","centrifugation","drying","molasses"]}
        r = plant_mass_balance(dummy)
        assert 5 <= r["sugar_recovery_pct"] <= 18
