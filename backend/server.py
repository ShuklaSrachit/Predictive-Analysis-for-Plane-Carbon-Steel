from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.neural_network import MLPRegressor, MLPClassifier
from sklearn.preprocessing import StandardScaler
import joblib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== ML MODELS ====================

class SteelMicrostructurePredictor:
    """
    Hybrid ML Framework for Steel Microstructure Prediction
    Uses Random Forest and ANN models trained on synthetic metallurgical data
    """
    
    def __init__(self):
        self.rf_grain_size = None
        self.rf_ferrite = None
        self.rf_pearlite = None
        self.rf_cementite = None
        self.ann_grain_size = None
        self.rf_classifier = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self._train_models()
    
    def _generate_synthetic_data(self, n_samples=2000):
        """
        Generate synthetic training data based on metallurgical principles
        from the iron-carbon phase diagram and heat treatment knowledge
        """
        np.random.seed(42)
        
        # Input features
        carbon = np.random.uniform(0.01, 2.1, n_samples)  # wt% C
        austenitizing_temp = np.random.uniform(750, 1100, n_samples)  # °C
        holding_time = np.random.uniform(0.5, 24, n_samples)  # hours
        cooling_rate = np.random.uniform(0.1, 100, n_samples)  # °C/s
        heat_treatment = np.random.randint(0, 3, n_samples)  # 0: Annealing, 1: Normalizing, 2: Quenching
        
        # Physics-guided feature engineering
        X = np.column_stack([carbon, austenitizing_temp, holding_time, cooling_rate, heat_treatment])
        
        # Generate outputs based on metallurgical principles
        grain_size = []
        ferrite_frac = []
        pearlite_frac = []
        cementite_frac = []
        grain_class = []
        
        for i in range(n_samples):
            c = carbon[i]
            temp = austenitizing_temp[i]
            time = holding_time[i]
            rate = cooling_rate[i]
            ht = heat_treatment[i]
            
            # Grain size calculation (ASTM number)
            # Higher temp → coarser grains (lower ASTM)
            # Longer time → coarser grains
            # Faster cooling → finer grains
            base_grain = 8.0
            temp_effect = -0.01 * (temp - 850)  # Temperature effect
            time_effect = -0.15 * np.log1p(time)  # Holding time effect
            cooling_effect = 0.03 * np.log1p(rate)  # Cooling rate effect
            
            # Heat treatment effects
            if ht == 0:  # Annealing - coarser grains
                ht_effect = -1.5
            elif ht == 1:  # Normalizing - medium grains
                ht_effect = 0.5
            else:  # Quenching - finer grains
                ht_effect = 2.0
            
            gs = base_grain + temp_effect + time_effect + cooling_effect + ht_effect
            gs = np.clip(gs + np.random.normal(0, 0.3), 1, 14)
            grain_size.append(gs)
            
            # Phase fractions based on iron-carbon phase diagram
            # Eutectoid composition: ~0.76 wt% C
            eutectoid_c = 0.76
            max_c_ferrite = 0.022  # Max C in ferrite at 727°C
            
            if c <= eutectoid_c:  # Hypoeutectoid
                # Lever rule approximation
                ferrite = max(0, (eutectoid_c - c) / (eutectoid_c - max_c_ferrite))
                pearlite = 1 - ferrite
                cementite_f = 0.0
            elif c <= 2.1:  # Hypereutectoid (including cementite dominant)
                # Pro-eutectoid cementite + pearlite
                ferrite = 0.0
                cementite_f = min(0.25, (c - eutectoid_c) / (6.67 - eutectoid_c))
                pearlite = 1 - cementite_f
            else:
                ferrite = 0.0
                pearlite = 0.5
                cementite_f = 0.5
            
            # Add some variation based on cooling rate
            cooling_variation = 0.05 * (1 - rate / 100)
            ferrite = np.clip(ferrite + np.random.uniform(-0.03, 0.03), 0, 1)
            pearlite = np.clip(pearlite + np.random.uniform(-0.03, 0.03), 0, 1)
            cementite_f = np.clip(cementite_f + np.random.uniform(-0.02, 0.02), 0, 0.3)
            
            # Normalize to ensure sum = 1
            total = ferrite + pearlite + cementite_f
            if total > 0:
                ferrite /= total
                pearlite /= total
                cementite_f /= total
            
            ferrite_frac.append(ferrite * 100)
            pearlite_frac.append(pearlite * 100)
            cementite_frac.append(cementite_f * 100)
            
            # Grain classification (0: Coarse, 1: Fine)
            grain_class.append(1 if gs >= 6 else 0)
        
        y_grain_size = np.array(grain_size)
        y_ferrite = np.array(ferrite_frac)
        y_pearlite = np.array(pearlite_frac)
        y_cementite = np.array(cementite_frac)
        y_grain_class = np.array(grain_class)
        
        return X, y_grain_size, y_ferrite, y_pearlite, y_cementite, y_grain_class
    
    def _train_models(self):
        """Train Random Forest and ANN models on synthetic data"""
        logger.info("Training ML models on synthetic metallurgical data...")
        
        X, y_grain_size, y_ferrite, y_pearlite, y_cementite, y_grain_class = self._generate_synthetic_data()
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Random Forest models for regression
        self.rf_grain_size = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_grain_size.fit(X_scaled, y_grain_size)
        
        self.rf_ferrite = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_ferrite.fit(X_scaled, y_ferrite)
        
        self.rf_pearlite = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_pearlite.fit(X_scaled, y_pearlite)
        
        self.rf_cementite = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_cementite.fit(X_scaled, y_cementite)
        
        # Train ANN model for grain size (complementary predictor)
        self.ann_grain_size = MLPRegressor(
            hidden_layer_sizes=(64, 32, 16),
            activation='relu',
            solver='adam',
            max_iter=500,
            random_state=42
        )
        self.ann_grain_size.fit(X_scaled, y_grain_size)
        
        # Train Random Forest classifier for grain classification
        self.rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_classifier.fit(X_scaled, y_grain_class)
        
        self.is_trained = True
        logger.info("ML models trained successfully!")
    
    def predict(self, carbon: float, austenitizing_temp: float, holding_time: float, 
                cooling_rate: float, heat_treatment: int) -> dict:
        """Make predictions using the trained models"""
        
        if not self.is_trained:
            raise ValueError("Models not trained yet")
        
        # Prepare input
        X = np.array([[carbon, austenitizing_temp, holding_time, cooling_rate, heat_treatment]])
        X_scaled = self.scaler.transform(X)
        
        # Random Forest predictions
        rf_grain_size = float(self.rf_grain_size.predict(X_scaled)[0])
        rf_ferrite = float(self.rf_ferrite.predict(X_scaled)[0])
        rf_pearlite = float(self.rf_pearlite.predict(X_scaled)[0])
        rf_cementite = float(self.rf_cementite.predict(X_scaled)[0])
        
        # ANN prediction for grain size
        ann_grain_size = float(self.ann_grain_size.predict(X_scaled)[0])
        
        # Ensemble grain size (average of RF and ANN)
        ensemble_grain_size = (rf_grain_size + ann_grain_size) / 2
        
        # Classification
        grain_class_pred = int(self.rf_classifier.predict(X_scaled)[0])
        grain_classification = "Fine" if grain_class_pred == 1 else "Coarse"
        
        # Determine steel regime
        regime = self._determine_regime(carbon)
        
        # Normalize phase fractions
        total = max(rf_ferrite + rf_pearlite + rf_cementite, 0.01)
        ferrite_normalized = max(0, rf_ferrite / total * 100)
        pearlite_normalized = max(0, rf_pearlite / total * 100)
        cementite_normalized = max(0, rf_cementite / total * 100)
        
        return {
            "grain_size_astm": round(ensemble_grain_size, 2),
            "grain_size_rf": round(rf_grain_size, 2),
            "grain_size_ann": round(ann_grain_size, 2),
            "ferrite_fraction": round(ferrite_normalized, 2),
            "pearlite_fraction": round(pearlite_normalized, 2),
            "cementite_fraction": round(cementite_normalized, 2),
            "grain_classification": grain_classification,
            "regime": regime,
            "confidence": self._calculate_confidence(carbon, regime)
        }
    
    def _determine_regime(self, carbon: float) -> str:
        """Determine steel regime based on carbon content"""
        if carbon < 0.76:
            return "Hypoeutectoid"
        elif carbon == 0.76 or (carbon >= 0.74 and carbon <= 0.78):
            return "Eutectoid"
        elif carbon <= 1.4:
            return "Hypereutectoid"
        else:
            return "Cementite-Dominant"
    
    def _calculate_confidence(self, carbon: float, regime: str) -> float:
        """Calculate prediction confidence based on regime"""
        # Higher confidence for well-studied regimes
        if regime == "Hypoeutectoid":
            return 0.92 - abs(carbon - 0.4) * 0.1
        elif regime == "Eutectoid":
            return 0.95
        elif regime == "Hypereutectoid":
            return 0.85 - (carbon - 0.76) * 0.1
        else:  # Cementite-Dominant
            return 0.70  # Lower confidence due to complex networks

# Initialize predictor
predictor = SteelMicrostructurePredictor()

# ==================== PYDANTIC MODELS ====================

class PredictionInput(BaseModel):
    carbon_content: float = Field(..., ge=0.01, le=2.1, description="Carbon content in wt%")
    austenitizing_temp: float = Field(..., ge=727, le=1100, description="Austenitizing temperature in °C")
    holding_time: float = Field(..., ge=0.5, le=24, description="Holding time in hours")
    cooling_rate: float = Field(..., ge=0.1, le=100, description="Cooling rate in °C/s")
    heat_treatment: str = Field(..., description="Heat treatment type: annealing, normalizing, quenching")

class PredictionResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Inputs
    carbon_content: float
    austenitizing_temp: float
    holding_time: float
    cooling_rate: float
    heat_treatment: str
    
    # Outputs
    grain_size_astm: float
    grain_size_rf: float
    grain_size_ann: float
    ferrite_fraction: float
    pearlite_fraction: float
    cementite_fraction: float
    grain_classification: str
    regime: str
    confidence: float

class PhaseDiagramPoint(BaseModel):
    carbon: float
    temperature: float
    phase: str

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Steel Microstructure Prediction API", "status": "operational"}

@api_router.post("/predict", response_model=PredictionResult)
async def make_prediction(input_data: PredictionInput):
    """Make microstructure prediction based on input parameters"""
    
    # Map heat treatment to numeric
    ht_map = {"annealing": 0, "normalizing": 1, "quenching": 2}
    ht_numeric = ht_map.get(input_data.heat_treatment.lower(), 0)
    
    # Get prediction
    prediction = predictor.predict(
        carbon=input_data.carbon_content,
        austenitizing_temp=input_data.austenitizing_temp,
        holding_time=input_data.holding_time,
        cooling_rate=input_data.cooling_rate,
        heat_treatment=ht_numeric
    )
    
    # Create result object
    result = PredictionResult(
        carbon_content=input_data.carbon_content,
        austenitizing_temp=input_data.austenitizing_temp,
        holding_time=input_data.holding_time,
        cooling_rate=input_data.cooling_rate,
        heat_treatment=input_data.heat_treatment,
        **prediction
    )
    
    # Save to database
    doc = result.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.predictions.insert_one(doc)
    
    return result

@api_router.get("/predictions", response_model=List[PredictionResult])
async def get_predictions(limit: int = 50):
    """Get prediction history"""
    predictions = await db.predictions.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    
    for pred in predictions:
        if isinstance(pred['timestamp'], str):
            pred['timestamp'] = datetime.fromisoformat(pred['timestamp'])
    
    return predictions

@api_router.delete("/predictions/{prediction_id}")
async def delete_prediction(prediction_id: str):
    """Delete a prediction from history"""
    result = await db.predictions.delete_one({"id": prediction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"message": "Prediction deleted successfully"}

@api_router.delete("/predictions")
async def clear_predictions():
    """Clear all predictions"""
    await db.predictions.delete_many({})
    return {"message": "All predictions cleared"}

@api_router.get("/phase-diagram-data")
async def get_phase_diagram_data():
    """Get Iron-Carbon phase diagram data for visualization"""
    
    # Key points from the Fe-C phase diagram
    phase_boundaries = {
        "liquidus": [
            {"carbon": 0, "temperature": 1538},
            {"carbon": 0.5, "temperature": 1495},
            {"carbon": 1.0, "temperature": 1450},
            {"carbon": 2.1, "temperature": 1148},
            {"carbon": 4.3, "temperature": 1148},
        ],
        "solidus": [
            {"carbon": 0, "temperature": 1538},
            {"carbon": 0.09, "temperature": 1495},
            {"carbon": 0.17, "temperature": 1495},
            {"carbon": 0.5, "temperature": 1400},
            {"carbon": 2.1, "temperature": 1148},
        ],
        "austenite_boundary": [
            {"carbon": 0, "temperature": 912},
            {"carbon": 0.022, "temperature": 727},
            {"carbon": 0.76, "temperature": 727},
        ],
        "cementite_boundary": [
            {"carbon": 0.76, "temperature": 727},
            {"carbon": 2.1, "temperature": 1148},
        ],
        "eutectoid_line": [
            {"carbon": 0.022, "temperature": 727},
            {"carbon": 6.67, "temperature": 727},
        ],
        "ferrite_solvus": [
            {"carbon": 0, "temperature": 727},
            {"carbon": 0.022, "temperature": 727},
            {"carbon": 0, "temperature": 0},
        ]
    }
    
    # Key points
    key_points = [
        {"carbon": 0.022, "temperature": 727, "label": "Max C in α-Fe", "phase": "ferrite"},
        {"carbon": 0.76, "temperature": 727, "label": "Eutectoid Point", "phase": "pearlite"},
        {"carbon": 2.1, "temperature": 1148, "label": "Eutectic Point", "phase": "ledeburite"},
        {"carbon": 6.67, "temperature": 727, "label": "Fe₃C (Cementite)", "phase": "cementite"},
    ]
    
    # Phase regions (simplified for steel range 0-2.1%)
    phase_regions = [
        {"name": "α (Ferrite)", "carbon_range": [0, 0.022], "temp_range": [0, 727]},
        {"name": "α + Fe₃C", "carbon_range": [0.022, 0.76], "temp_range": [0, 727]},
        {"name": "γ (Austenite)", "carbon_range": [0, 2.1], "temp_range": [727, 1148]},
        {"name": "γ + Fe₃C", "carbon_range": [0.76, 2.1], "temp_range": [727, 1148]},
    ]
    
    return {
        "phase_boundaries": phase_boundaries,
        "key_points": key_points,
        "phase_regions": phase_regions,
        "steel_range": {"min": 0, "max": 2.1},
        "temperature_range": {"min": 0, "max": 1600}
    }

@api_router.get("/regime-info/{regime}")
async def get_regime_info(regime: str):
    """Get detailed information about a steel regime"""
    
    regime_info = {
        "Hypoeutectoid": {
            "carbon_range": "< 0.76 wt%",
            "description": "Steel with carbon content below the eutectoid composition. Microstructure consists of primary ferrite and pearlite.",
            "properties": "Good ductility, moderate strength, easily formed and welded",
            "applications": "Structural steel, automotive parts, construction",
            "phase_distribution": "Ferrite-dominated with pearlite islands"
        },
        "Eutectoid": {
            "carbon_range": "≈ 0.76 wt%",
            "description": "Steel at the eutectoid composition. Transforms completely to pearlite (lamellar ferrite + cementite).",
            "properties": "High strength, good wear resistance, moderate ductility",
            "applications": "Rails, wire ropes, springs, high-strength fasteners",
            "phase_distribution": "100% pearlite structure"
        },
        "Hypereutectoid": {
            "carbon_range": "0.76 - 1.4 wt%",
            "description": "Steel with carbon above eutectoid. Contains pro-eutectoid cementite at grain boundaries.",
            "properties": "Very high hardness, excellent wear resistance, lower ductility",
            "applications": "Cutting tools, dies, ball bearings, files",
            "phase_distribution": "Pearlite matrix with cementite network"
        },
        "Cementite-Dominant": {
            "carbon_range": "> 1.4 wt%",
            "description": "High-carbon steel approaching cast iron territory. Extensive cementite networks dominate.",
            "properties": "Extreme hardness, very brittle, limited formability",
            "applications": "Specialized cutting tools, wear plates",
            "phase_distribution": "Continuous cementite networks with pearlite"
        }
    }
    
    info = regime_info.get(regime)
    if not info:
        raise HTTPException(status_code=404, detail=f"Regime '{regime}' not found")
    
    return {"regime": regime, **info}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
