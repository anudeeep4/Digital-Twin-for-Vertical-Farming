from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import os

app = FastAPI(title="Lettuce Growth Digital Twin")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model if it exists
MODEL_PATH = "lettuce_xgboost_model.pkl"
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
else:
    model = None

class PredictionRequest(BaseModel):
    co2: float = Field(..., ge=300, le=1200)
    temperature: float = Field(..., ge=15, le=40)
    humidity: float = Field(..., ge=20, le=100)
    radiation: float = Field(..., ge=50, le=800)
    days_after_transplant: float = Field(..., ge=1, le=60)

class PredictionResponse(BaseModel):
    shoot_fresh_weight: float
    shoot_dry_weight: float
    root_fresh_weight: float
    root_dry_weight: float
    leaf_area: float
    total_fresh_weight: float
    total_dry_weight: float

@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    if model:
        # Array of features matching training columns
        features = [[req.co2, req.temperature, req.humidity, req.radiation, req.days_after_transplant]]
        try:
            pred = model.predict(features)[0]
            return PredictionResponse(
                shoot_fresh_weight=float(pred[0]),
                shoot_dry_weight=float(pred[1]),
                root_fresh_weight=float(pred[2]),
                root_dry_weight=float(pred[3]),
                leaf_area=float(pred[4]),
                total_fresh_weight=float(pred[5]),
                total_dry_weight=float(pred[6])
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Mock formula simulating realistic relationships if model is missing
        maturity = (req.days_after_transplant / 32.0)
        light_effect = (req.radiation / 234.67)
        co2_effect = (req.co2 / 422.6)
        temp_effect = 1.0 - abs(req.temperature - 26.41) / 30.0 
        
        factor = maturity * light_effect * co2_effect * temp_effect
        # Avoid negative
        factor = max(0.01, factor)

        return PredictionResponse(
            shoot_fresh_weight=53.93 * factor,
            shoot_dry_weight=2.86 * factor,
            root_fresh_weight=2.56 * factor,
            root_dry_weight=0.14 * factor,
            leaf_area=1205.47 * factor,
            total_fresh_weight=56.62 * factor,
            total_dry_weight=2.96 * factor
        )

@app.get("/")
def read_root():
    return {"status": "Lettuce Model API is running.", "model_loaded": model is not None}
