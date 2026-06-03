import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

def train_final_sugar_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "plant_stages_dataset.csv")
    model_output_path = os.path.join(base_dir, "final_sugar_model.joblib")
    
    print(f"Loading dataset from {csv_path}...")
    if not os.path.exists(csv_path):
        print("Error: plant_stages_dataset.csv not found!")
        return
        
    df = pd.read_csv(csv_path)
    print(f"Dataset loaded successfully with shape: {df.shape}")
    
    # 17 input features across all stages
    features = [
        "ch_cane_feed_rate_tph", 
        "ch_trash_pct", 
        "ch_cane_pol_pct", 
        "ch_cane_brix_pct",
        "mill_imbibition_water_pct",
        "mill_mill_speed_rpm",
        "mill_bagasse_moisture_pct",
        "mill_shift",
        "mill_cane_source",
        "clar_lime_dosage_kg_tc",
        "clar_clarification_temp_c",
        "evap_steam_flow_tph",
        "evap_steam_economy",
        "cryst_supersaturation_coeff",
        "cryst_vacuum_pressure_mbar",
        "cent_centrifuge_speed_rpm",
        "cent_wash_water_m3_hr"
    ]
    target = "cent_sugar_tph"
    
    print("\nSetting up training data...")
    print(f"Features (Inputs): {len(features)} variables")
    print(f"Target (Output): {target} (Final Sugar Production Rate)")
    
    X = df[features]
    y = df[target]
    
    # Categorical vs Numerical Column Classification
    categorical_cols = ["mill_shift", "mill_cane_source"]
    numeric_cols = [c for c in features if c not in categorical_cols]
    
    # Train-test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Train set size: {X_train.shape[0]} rows, Test set size: {X_test.shape[0]} rows")
    
    # Preprocessor (One-Hot encode context categoricals, pass through numericals)
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols)
        ],
        remainder="passthrough"
    )
    
    # Random Forest Regressor Pipeline
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])
    
    print("\nTraining Random Forest Regressor pipeline (this may take a few seconds)...")
    pipeline.fit(X_train, y_train)
    print("Model fitting complete!")
    
    # Save the trained model pipeline
    print(f"Saving trained model pipeline to {model_output_path}...")
    joblib.dump(pipeline, model_output_path)
    print("Model saved successfully!")
    
    # Evaluate metrics on holdout set
    print("\nEvaluating model on holdout test set...")
    y_pred = pipeline.predict(X_test)
    
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    
    print("\n================ MODEL TRAINING METRICS ================")
    print(f" R-squared Score (R²): {r2:.6f} (accuracy index)")
    print(f" Mean Absolute Error (MAE): {mae:.6f} T/H")
    print(f" Mean Squared Error (MSE): {mse:.6f}")
    print(f" Root Mean Squared Error (RMSE): {rmse:.6f} T/H")
    print("========================================================\n")
    
    # Verification
    print("Verifying saved model load viability...")
    try:
        loaded_model = joblib.load(model_output_path)
        sample_pred = loaded_model.predict(X_test.iloc[[0]])[0]
        print(f"Verification: Success! Sample prediction: {sample_pred:.3f} T/H (Actual: {y_test.iloc[0]:.3f} T/H)")
    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    train_final_sugar_model()
