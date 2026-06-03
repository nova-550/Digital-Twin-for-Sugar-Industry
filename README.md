# SugarTech Digital Twin

A complete, production-ready Digital Twin for the Sustainable Sugar Industry. Designed for control room operations, this system provides real-time KPI monitoring, AI-driven anomaly detection and recommendations, and what-if scenario simulation across all 8 stages of sugar production.

## Features
- **Comprehensive Physics Engine:** Models all 8 stages (Cane Handling, Milling, Clarification, Evaporation, Crystallization, Centrifugation, Drying, Molasses).
- **Virtual Sensor Network:** Real-time 1 Hz simulated data with AR(1) correlated noise, diurnal drift, and occasional anomalies.
- **AI Recommendation Engine:** Rule-based heuristics evaluating over 40+ constraints to issue prioritized alerts and actions.
- **What-If Sandbox:** Isolate process tweaks and observe downstream impacts side-by-side with live KPIs.
- **Sustainability Reporting:** Energy intensity, water usage, and CO₂ emissions benchmarked against industry standards.

## Project Structure
- `app.py`: Main Streamlit UI entry point.
- `config/plant_config.yaml`: The master configuration. No code changes required to tune thresholds or targets!
- `data_generator.py`: Background thread simulating physics and pushing to SQLite.
- `process_models.py`: Mass and energy balance equations.
- `performance_analyzer.py`: KPI calculation and bottleneck detection.
- `ai_engine.py`: Heuristic rules for AI recommendations.
- `whatif_engine.py`: The simulation sandbox.

## Deployment

### Using Docker (Recommended)
This application is fully containerized. To run via Docker Compose:
```bash
docker-compose up -d
```
The application will be available at `http://localhost:8501`.

### Running Locally
Requires Python 3.11+. We recommend using a virtual environment.
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

## Testing
Run unit tests across process models and analyzers using `pytest`:
```bash
pytest tests/ -v
```
