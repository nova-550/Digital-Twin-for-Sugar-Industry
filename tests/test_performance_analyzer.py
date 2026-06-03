"""
tests/test_performance_analyzer.py — Tests for KPI calculation and anomaly detection.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from performance_analyzer import (
    get_status, compute_stage_kpis, compute_plant_kpis,
    detect_anomalies, bottleneck_analysis, sustainability_report
)

DUMMY_ALL = {s: {} for s in ["cane_handling","milling","clarification","evaporation",
                               "crystallization","centrifugation","drying","molasses"]}


class TestGetStatus:
    def test_green_above_good(self):
        assert get_status(97.0, "mill_extraction_pct") == "GREEN"

    def test_red_below_poor(self):
        assert get_status(91.0, "mill_extraction_pct") == "RED"

    def test_unknown_param(self):
        assert get_status(50.0, "nonexistent_param") == "NORMAL"

    def test_lower_is_better_energy(self):
        # energy lower is better
        assert get_status(30.0, "energy_intensity_kwh_ton", higher_is_better=False) == "GREEN"
        assert get_status(55.0, "energy_intensity_kwh_ton", higher_is_better=False) == "RED"


class TestComputeStageKpis:
    def test_evaporation_returns_8_kpis(self):
        kpis = compute_stage_kpis("evaporation", {"energy_efficiency_pct": 89.0,
                                                   "juice_brix_out_pct": 62.0})
        assert len(kpis) == 8

    def test_kpi_has_required_fields(self):
        kpis = compute_stage_kpis("milling", {})
        for k in kpis:
            assert "name" in k
            assert "value" in k
            assert "status" in k
            assert "unit" in k

    def test_status_is_valid(self):
        kpis = compute_stage_kpis("clarification", {"estimated_ph": 7.2})
        for k in kpis:
            assert k["status"] in ("GREEN","YELLOW","RED")

    def test_all_stages_return_kpis(self):
        stages = ["cane_handling","milling","clarification","evaporation",
                  "crystallization","centrifugation","drying","molasses"]
        for s in stages:
            kpis = compute_stage_kpis(s, {})
            assert len(kpis) > 0, f"No KPIs for {s}"


class TestComputePlantKpis:
    def test_returns_6_kpis(self):
        kpis = compute_plant_kpis(DUMMY_ALL)
        assert len(kpis) == 6

    def test_all_have_values(self):
        kpis = compute_plant_kpis(DUMMY_ALL)
        for k in kpis:
            assert isinstance(k["value"], (int, float))

    def test_recovery_reasonable(self):
        kpis = compute_plant_kpis(DUMMY_ALL)
        rec = next(k for k in kpis if "Recovery" in k["name"])
        assert 5 <= rec["value"] <= 18


class TestDetectAnomalies:
    def test_no_anomaly_normal_values(self):
        normal = {
            "cane_feed_rate_tph": 210, "trash_pct": 3.5, "moisture_pct": 72,
            "cane_brix_pct": 20.5, "cane_pol_pct": 18.2,
            "conveyor_speed_mpm": 45, "unloading_rate_trucks_hr": 12,
        }
        anomalies = detect_anomalies("cane_handling", normal)
        critical = [a for a in anomalies if a["severity"] == "CRITICAL"]
        assert len(critical) == 0

    def test_detects_critical_low_feed(self):
        bad = {"cane_feed_rate_tph": 100}  # way below low=170
        anomalies = detect_anomalies("cane_handling", bad)
        assert any(a["severity"] == "CRITICAL" for a in anomalies)

    def test_detects_high_ph(self):
        bad = {"estimated_ph": 8.5, "lime_dosage_kg_tc": 1.8, "clarification_temp_c": 102,
               "mud_volume_pct": 12, "sulfur_dosage_ppm": 180, "turbidity_ntu": 35,
               "clarified_juice_tph": 185}
        anomalies = detect_anomalies("clarification", bad)
        assert any("ph" in a["parameter"].lower() or "lime" in a["parameter"].lower()
                   for a in anomalies)

    def test_anomaly_has_required_fields(self):
        bad = {"cane_feed_rate_tph": 100}
        anomalies = detect_anomalies("cane_handling", bad)
        for a in anomalies:
            assert "stage_id" in a
            assert "severity" in a
            assert "message" in a


class TestBottleneckAnalysis:
    def test_returns_list(self):
        result = bottleneck_analysis(DUMMY_ALL)
        assert isinstance(result, list)
        assert len(result) > 0

    def test_each_has_stage_and_score(self):
        result = bottleneck_analysis(DUMMY_ALL)
        for item in result:
            assert "stage" in item
            assert "bottleneck_score" in item
            assert "status" in item

    def test_sorted_by_score(self):
        result = bottleneck_analysis(DUMMY_ALL)
        scores = [r["bottleneck_score"] for r in result]
        assert scores == sorted(scores, reverse=True)


class TestSustainabilityReport:
    def test_score_in_range(self):
        r = sustainability_report({
            "energy_intensity_kwh_ton": 38, "water_intensity_m3_ton": 1.2,
            "co2_tons_day": 85, "sugar_recovery_pct": 11.5
        })
        assert 0 <= r["sustainability_score"] <= 100

    def test_better_values_higher_score(self):
        r_bad  = sustainability_report({"energy_intensity_kwh_ton":55,"water_intensity_m3_ton":2.5,
                                        "co2_tons_day":130,"sugar_recovery_pct":9.0})
        r_good = sustainability_report({"energy_intensity_kwh_ton":33,"water_intensity_m3_ton":0.9,
                                        "co2_tons_day":65,"sugar_recovery_pct":12.5})
        assert r_good["sustainability_score"] > r_bad["sustainability_score"]
