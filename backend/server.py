from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
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
    Physics-guided ML for carbon steels (0.05-2.1 wt% C)
    Includes: Random Forest + ANN models with metallurgical constraints
    """
    
    def __init__(self):
        self.rf_grain_size = None
        self.rf_ferrite = None
        self.rf_pearlite = None
        self.rf_cementite = None
        self.rf_martensite = None
        self.ann_grain_size = None
        self.rf_classifier = None
        # Mechanical property models
        self.rf_yield_strength = None
        self.rf_tensile_strength = None
        self.rf_hardness = None
        self.rf_elongation = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self._train_models()
    
    def _generate_synthetic_data(self, n_samples=3000):
        """
        Generate synthetic training data based on metallurgical principles
        from the iron-carbon phase diagram and heat treatment knowledge
        Following strict physical constraints
        """
        np.random.seed(42)
        
        # Input features with metallurgical ranges
        carbon = np.random.uniform(0.05, 2.1, n_samples)  # wt% C (steel range)
        manganese = np.random.uniform(0.30, 1.50, n_samples)  # wt% Mn
        silicon = np.random.uniform(0.10, 0.60, n_samples)  # wt% Si
        austenitizing_temp = np.random.uniform(750, 950, n_samples)  # °C
        holding_time = np.random.uniform(15, 120, n_samples)  # minutes
        heat_treatment = np.random.randint(0, 3, n_samples)  # 0: Annealing, 1: Normalizing, 2: Quenching
        
        # Conditioned cooling rate based on heat treatment
        cooling_rate = np.zeros(n_samples)
        for i in range(n_samples):
            if heat_treatment[i] == 0:  # Annealing - furnace cooled
                cooling_rate[i] = np.random.uniform(0.01, 1.0)  # ≤1 °C/s
            elif heat_treatment[i] == 1:  # Normalizing - air cooled
                cooling_rate[i] = np.random.uniform(5, 20)  # 5-20 °C/s
            else:  # Quenching - rapid cooling
                cooling_rate[i] = np.random.uniform(50, 200)  # ≥50 °C/s
        
        # Apply composition constraints: For C > 1.5%, Mn ≤ 1.0%
        for i in range(n_samples):
            if carbon[i] > 1.5:
                manganese[i] = min(manganese[i], 1.0)
        
        # Physics-guided feature engineering
        X = np.column_stack([carbon, manganese, silicon, austenitizing_temp, 
                            holding_time, heat_treatment, cooling_rate])
        
        # Generate outputs based on metallurgical principles
        initial_grain_size = []
        final_grain_size = []
        ferrite_frac = []
        pearlite_frac = []
        cementite_frac = []
        martensite_frac = []
        grain_class = []
        yield_strength = []
        tensile_strength = []
        hardness = []
        elongation = []
        
        for i in range(n_samples):
            c = carbon[i]
            mn = manganese[i]
            si = silicon[i]
            temp = austenitizing_temp[i]
            time = holding_time[i]
            ht = heat_treatment[i]
            rate = cooling_rate[i]
            
            # ========== GRAIN SIZE CALCULATION ==========
            # Initial grain size (before heat treatment) - based on composition
            init_gs = 7.0 + 0.5 * c - 0.3 * mn + np.random.normal(0, 0.2)
            init_gs = np.clip(init_gs, 4, 10)
            initial_grain_size.append(init_gs)
            
            # Final grain size (after heat treatment)
            # Higher temp → grain growth (lower ASTM)
            # Longer time → grain growth
            # Faster cooling → finer grains (higher ASTM)
            base_grain = 8.0
            temp_effect = -0.012 * (temp - 850)  # Temperature effect
            time_effect = -0.008 * np.sqrt(time)  # Holding time effect
            cooling_effect = 0.02 * np.log1p(rate)  # Cooling rate effect
            
            # Cementite in high-C steels limits grain growth (grain boundary pinning)
            if c > 0.76:
                c_pinning = 0.5 * (c - 0.76)
            else:
                c_pinning = 0
            
            # Heat treatment effects
            if ht == 0:  # Annealing - coarser grains
                ht_effect = -1.5
            elif ht == 1:  # Normalizing - medium grains
                ht_effect = 0.5
            else:  # Quenching - finest grains
                ht_effect = 2.0
            
            final_gs = base_grain + temp_effect + time_effect + cooling_effect + ht_effect + c_pinning
            final_gs = np.clip(final_gs + np.random.normal(0, 0.3), 2, 14)
            final_grain_size.append(final_gs)
            
            # ========== PHASE FRACTIONS ==========
            eutectoid_c = 0.76
            max_c_ferrite = 0.022  # Max C in ferrite at 727°C
            
            if ht == 2:  # Quenching - Martensite formation
                # Martensite % depends on carbon and cooling rate
                if rate >= 50:  # Critical cooling rate exceeded
                    # Low C: Low hardness martensite
                    # Medium C (0.4-0.8): Optimal martensite
                    # High C (>1.0): Brittle martensite + retained austenite
                    if c < 0.3:
                        mart = 0.7 + 0.3 * (c / 0.3)  # 70-100%
                        mart *= (rate / 200)
                    elif c <= 0.8:
                        mart = 0.9 + 0.1 * ((c - 0.3) / 0.5)  # 90-100%
                    else:
                        mart = 0.85 - 0.15 * ((c - 0.8) / 1.3)  # Reduces due to retained austenite
                    
                    mart = np.clip(mart * 100 + np.random.normal(0, 3), 50, 100)
                    martensite_frac.append(mart)
                    
                    # Remaining phases
                    remaining = 100 - mart
                    if c <= eutectoid_c:
                        ferrite = remaining * 0.7
                        pearlite = remaining * 0.3
                        cementite_f = 0
                    else:
                        ferrite = 0
                        pearlite = remaining * 0.6
                        cementite_f = remaining * 0.4
                    
                    ferrite_frac.append(max(0, ferrite))
                    pearlite_frac.append(max(0, pearlite))
                    cementite_frac.append(max(0, cementite_f))
                else:
                    martensite_frac.append(0)
                    # Regular phase calculation below
                    if c <= eutectoid_c:
                        ferrite = max(0, (eutectoid_c - c) / (eutectoid_c - max_c_ferrite)) * 100
                        pearlite = 100 - ferrite
                        cementite_f = 0
                    else:
                        ferrite = 0
                        cementite_f = min(25, (c - eutectoid_c) / (6.67 - eutectoid_c) * 100)
                        pearlite = 100 - cementite_f
                    ferrite_frac.append(ferrite + np.random.normal(0, 2))
                    pearlite_frac.append(pearlite + np.random.normal(0, 2))
                    cementite_frac.append(cementite_f + np.random.normal(0, 1))
            else:  # Annealing or Normalizing - No martensite
                martensite_frac.append(0)
                
                if c <= eutectoid_c:  # Hypoeutectoid
                    # Lever rule: Ferrite + Pearlite
                    ferrite = max(0, (eutectoid_c - c) / (eutectoid_c - max_c_ferrite)) * 100
                    pearlite = 100 - ferrite
                    cementite_f = 0
                elif c <= 2.1:  # Hypereutectoid
                    # Pearlite + Proeutectoid Cementite
                    ferrite = 0
                    cementite_f = min(25, (c - eutectoid_c) / (6.67 - eutectoid_c) * 100)
                    pearlite = 100 - cementite_f
                else:
                    ferrite = 0
                    pearlite = 50
                    cementite_f = 50
                
                # Cooling rate affects phase distribution slightly
                if ht == 1:  # Normalizing - finer pearlite
                    pearlite *= 1.02
                    ferrite *= 0.98
                
                ferrite_frac.append(np.clip(ferrite + np.random.normal(0, 2), 0, 100))
                pearlite_frac.append(np.clip(pearlite + np.random.normal(0, 2), 0, 100))
                cementite_frac.append(np.clip(cementite_f + np.random.normal(0, 1), 0, 30))
            
            # Grain classification (0: Coarse, 1: Fine)
            grain_class.append(1 if final_gs >= 6 else 0)
            
            # ========== MECHANICAL PROPERTIES ==========
            # Yield Strength (MPa) - Hall-Petch relationship + composition effects
            # σ_y = σ_0 + k * d^(-1/2) + solid solution strengthening
            sigma_0 = 50  # Base strength
            k_hp = 18  # Hall-Petch coefficient (MPa·mm^0.5)
            d_mm = 0.254 * np.exp(-0.347 * final_gs)  # ASTM to mm conversion
            
            hp_contribution = k_hp / np.sqrt(d_mm)
            c_contribution = 300 * c  # Carbon strengthening
            mn_contribution = 40 * mn  # Manganese strengthening
            si_contribution = 80 * si  # Silicon strengthening
            
            # Martensite contribution
            mart_frac = martensite_frac[-1]
            mart_contribution = 8 * mart_frac if mart_frac > 0 else 0
            
            ys = sigma_0 + hp_contribution + c_contribution + mn_contribution + si_contribution + mart_contribution
            ys = np.clip(ys + np.random.normal(0, 15), 200, 2000)
            yield_strength.append(ys)
            
            # Tensile Strength (MPa) - typically 1.1-1.5x yield strength
            ts_ratio = 1.3 + 0.1 * c + 0.05 * (mart_frac / 100)
            ts = ys * ts_ratio + np.random.normal(0, 20)
            ts = np.clip(ts, 300, 2500)
            tensile_strength.append(ts)
            
            # Hardness (HV) - strongly correlated with martensite and carbon
            base_hardness = 100 + 200 * c
            mart_hardness = 7 * mart_frac if mart_frac > 0 else 0
            pearlite_hardness = 1.5 * pearlite_frac[-1] * (1 + c)
            hv = base_hardness + mart_hardness + pearlite_hardness * 0.5
            hv = np.clip(hv + np.random.normal(0, 10), 80, 900)
            hardness.append(hv)
            
            # Elongation (%) - inversely related to strength/hardness
            # Sharp reduction at high carbon and with martensite
            base_elong = 40 - 15 * c
            mart_reduction = -0.3 * mart_frac
            cementite_reduction = -0.5 * cementite_frac[-1]
            elong = base_elong + mart_reduction + cementite_reduction
            elong = np.clip(elong + np.random.normal(0, 2), 2, 45)
            elongation.append(elong)
        
        # Normalize phase fractions
        for i in range(n_samples):
            total = ferrite_frac[i] + pearlite_frac[i] + cementite_frac[i] + martensite_frac[i]
            if total > 0:
                ferrite_frac[i] = max(0, ferrite_frac[i] / total * 100)
                pearlite_frac[i] = max(0, pearlite_frac[i] / total * 100)
                cementite_frac[i] = max(0, cementite_frac[i] / total * 100)
                martensite_frac[i] = max(0, martensite_frac[i] / total * 100)
        
        y_initial_grain = np.array(initial_grain_size)
        y_final_grain = np.array(final_grain_size)
        y_ferrite = np.array(ferrite_frac)
        y_pearlite = np.array(pearlite_frac)
        y_cementite = np.array(cementite_frac)
        y_martensite = np.array(martensite_frac)
        y_grain_class = np.array(grain_class)
        y_yield = np.array(yield_strength)
        y_tensile = np.array(tensile_strength)
        y_hardness = np.array(hardness)
        y_elongation = np.array(elongation)
        
        return (X, y_initial_grain, y_final_grain, y_ferrite, y_pearlite, 
                y_cementite, y_martensite, y_grain_class, y_yield, 
                y_tensile, y_hardness, y_elongation)
    
    def _train_models(self):
        """Train Random Forest and ANN models on synthetic data"""
        logger.info("Training ML models on synthetic metallurgical data...")
        
        (X, y_initial_grain, y_final_grain, y_ferrite, y_pearlite, 
         y_cementite, y_martensite, y_grain_class, y_yield, 
         y_tensile, y_hardness, y_elongation) = self._generate_synthetic_data()
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Random Forest models for microstructure
        self.rf_initial_grain = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_initial_grain.fit(X_scaled, y_initial_grain)
        
        self.rf_grain_size = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_grain_size.fit(X_scaled, y_final_grain)
        
        self.rf_ferrite = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_ferrite.fit(X_scaled, y_ferrite)
        
        self.rf_pearlite = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_pearlite.fit(X_scaled, y_pearlite)
        
        self.rf_cementite = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_cementite.fit(X_scaled, y_cementite)
        
        self.rf_martensite = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_martensite.fit(X_scaled, y_martensite)
        
        # Train ANN model for grain size (complementary predictor)
        self.ann_grain_size = MLPRegressor(
            hidden_layer_sizes=(64, 32, 16),
            activation='relu',
            solver='adam',
            max_iter=500,
            random_state=42
        )
        self.ann_grain_size.fit(X_scaled, y_final_grain)
        
        # Train Random Forest classifier for grain classification
        self.rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_classifier.fit(X_scaled, y_grain_class)
        
        # Train mechanical property models
        self.rf_yield_strength = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_yield_strength.fit(X_scaled, y_yield)
        
        self.rf_tensile_strength = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_tensile_strength.fit(X_scaled, y_tensile)
        
        self.rf_hardness = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_hardness.fit(X_scaled, y_hardness)
        
        self.rf_elongation = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        self.rf_elongation.fit(X_scaled, y_elongation)
        
        self.is_trained = True
        logger.info("ML models trained successfully!")
    
    def predict(self, carbon: float, manganese: float, silicon: float,
                austenitizing_temp: float, holding_time: float, 
                cooling_rate: float, heat_treatment: int) -> dict:
        """Make predictions using the trained models"""
        
        if not self.is_trained:
            raise ValueError("Models not trained yet")
        
        # Prepare input
        X = np.array([[carbon, manganese, silicon, austenitizing_temp, 
                      holding_time, heat_treatment, cooling_rate]])
        X_scaled = self.scaler.transform(X)
        
        # Random Forest predictions - Grain size
        rf_initial_grain = float(self.rf_initial_grain.predict(X_scaled)[0])
        rf_grain_size = float(self.rf_grain_size.predict(X_scaled)[0])
        ann_grain_size = float(self.ann_grain_size.predict(X_scaled)[0])
        ensemble_grain_size = (rf_grain_size + ann_grain_size) / 2
        
        # Phase fractions
        rf_ferrite = float(self.rf_ferrite.predict(X_scaled)[0])
        rf_pearlite = float(self.rf_pearlite.predict(X_scaled)[0])
        rf_cementite = float(self.rf_cementite.predict(X_scaled)[0])
        rf_martensite = float(self.rf_martensite.predict(X_scaled)[0])
        
        # Apply physics constraints
        if heat_treatment != 2:  # Not quenching
            rf_martensite = 0.0
        
        # Normalize phase fractions
        total = max(rf_ferrite + rf_pearlite + rf_cementite + rf_martensite, 0.01)
        ferrite_normalized = max(0, rf_ferrite / total * 100)
        pearlite_normalized = max(0, rf_pearlite / total * 100)
        cementite_normalized = max(0, rf_cementite / total * 100)
        martensite_normalized = max(0, rf_martensite / total * 100)
        
        # Mechanical properties
        yield_strength = float(self.rf_yield_strength.predict(X_scaled)[0])
        tensile_strength = float(self.rf_tensile_strength.predict(X_scaled)[0])
        hardness = float(self.rf_hardness.predict(X_scaled)[0])
        elongation = float(self.rf_elongation.predict(X_scaled)[0])
        
        # Classification
        grain_class_pred = int(self.rf_classifier.predict(X_scaled)[0])
        grain_classification = "Fine" if grain_class_pred == 1 else "Coarse"
        
        # Determine steel regime
        regime = self._determine_regime(carbon)
        
        return {
            "initial_grain_size": round(rf_initial_grain, 2),
            "grain_size_astm": round(ensemble_grain_size, 2),
            "grain_size_rf": round(rf_grain_size, 2),
            "grain_size_ann": round(ann_grain_size, 2),
            "ferrite_fraction": round(ferrite_normalized, 2),
            "pearlite_fraction": round(pearlite_normalized, 2),
            "cementite_fraction": round(cementite_normalized, 2),
            "martensite_fraction": round(martensite_normalized, 2),
            "grain_classification": grain_classification,
            "yield_strength": round(yield_strength, 1),
            "tensile_strength": round(tensile_strength, 1),
            "hardness": round(hardness, 1),
            "elongation": round(elongation, 2),
            "regime": regime,
            "confidence": self._calculate_confidence(carbon, regime, heat_treatment)
        }
    
    def _determine_regime(self, carbon: float) -> str:
        """Determine steel regime based on carbon content"""
        if carbon < 0.76:
            return "Hypoeutectoid"
        elif carbon >= 0.74 and carbon <= 0.78:
            return "Eutectoid"
        elif carbon <= 1.4:
            return "Hypereutectoid"
        else:
            return "Cementite-Dominant"
    
    def _calculate_confidence(self, carbon: float, regime: str, heat_treatment: int) -> float:
        """Calculate prediction confidence based on regime and treatment"""
        base_confidence = 0.85
        
        # Regime adjustments
        if regime == "Hypoeutectoid":
            base_confidence = 0.92 - abs(carbon - 0.4) * 0.05
        elif regime == "Eutectoid":
            base_confidence = 0.95
        elif regime == "Hypereutectoid":
            base_confidence = 0.85 - (carbon - 0.76) * 0.08
        else:  # Cementite-Dominant
            base_confidence = 0.70
        
        # Quenching adds uncertainty
        if heat_treatment == 2:
            base_confidence *= 0.95
        
        return round(min(0.98, max(0.5, base_confidence)), 2)

# Initialize predictor
predictor = SteelMicrostructurePredictor()

# ==================== PYDANTIC MODELS ====================

class PredictionInput(BaseModel):
    carbon_content: float = Field(..., ge=0.05, le=2.1, description="Carbon content in wt%")
    manganese_content: float = Field(default=0.65, ge=0.30, le=1.50, description="Manganese content in wt%")
    silicon_content: float = Field(default=0.25, ge=0.10, le=0.60, description="Silicon content in wt%")
    austenitizing_temp: float = Field(..., ge=750, le=950, description="Austenitizing temperature in °C")
    holding_time: float = Field(..., ge=15, le=120, description="Holding time in minutes")
    cooling_rate: float = Field(..., ge=0.01, le=200, description="Cooling rate in °C/s")
    heat_treatment: str = Field(..., description="Heat treatment type: annealing, normalizing, quenching")
    
    @field_validator('cooling_rate')
    @classmethod
    def validate_cooling_rate(cls, v, info):
        # Will be validated in endpoint based on heat treatment
        return v

class PredictionResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Inputs
    carbon_content: float
    manganese_content: float
    silicon_content: float
    austenitizing_temp: float
    holding_time: float
    cooling_rate: float
    heat_treatment: str
    
    # Microstructure Outputs
    initial_grain_size: float
    grain_size_astm: float
    grain_size_rf: float
    grain_size_ann: float
    ferrite_fraction: float
    pearlite_fraction: float
    cementite_fraction: float
    martensite_fraction: float
    grain_classification: str
    
    # Mechanical Properties
    yield_strength: float
    tensile_strength: float
    hardness: float
    elongation: float
    
    regime: str
    confidence: float

class PhaseDiagramPoint(BaseModel):
    carbon: float
    temperature: float
    phase: str

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Steel Microstructure Prediction API", "status": "operational", "version": "2.0"}

@api_router.post("/predict", response_model=PredictionResult)
async def make_prediction(input_data: PredictionInput):
    """Make microstructure prediction based on input parameters"""
    
    # Map heat treatment to numeric
    ht_map = {"annealing": 0, "normalizing": 1, "quenching": 2}
    ht_numeric = ht_map.get(input_data.heat_treatment.lower(), 0)
    
    # Validate cooling rate against heat treatment
    if ht_numeric == 0 and input_data.cooling_rate > 1.0:
        raise HTTPException(status_code=400, detail="Annealing requires cooling rate ≤ 1 °C/s")
    if ht_numeric == 1 and (input_data.cooling_rate < 5 or input_data.cooling_rate > 20):
        raise HTTPException(status_code=400, detail="Normalizing requires cooling rate 5-20 °C/s")
    if ht_numeric == 2 and input_data.cooling_rate < 50:
        raise HTTPException(status_code=400, detail="Quenching requires cooling rate ≥ 50 °C/s")
    
    # Validate Mn constraint for high C
    if input_data.carbon_content > 1.5 and input_data.manganese_content > 1.0:
        raise HTTPException(status_code=400, detail="For C > 1.5%, Mn must be ≤ 1.0%")
    
    # Get prediction
    prediction = predictor.predict(
        carbon=input_data.carbon_content,
        manganese=input_data.manganese_content,
        silicon=input_data.silicon_content,
        austenitizing_temp=input_data.austenitizing_temp,
        holding_time=input_data.holding_time,
        cooling_rate=input_data.cooling_rate,
        heat_treatment=ht_numeric
    )
    
    # Create result object
    result = PredictionResult(
        carbon_content=input_data.carbon_content,
        manganese_content=input_data.manganese_content,
        silicon_content=input_data.silicon_content,
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
        "steel_range": {"min": 0.05, "max": 2.1},
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
            "phase_distribution": "Ferrite-dominated with pearlite islands",
            "phases": ["Ferrite", "Pearlite"],
            "heat_treatment_response": "Responds well to annealing and normalizing. Quenching produces low-hardness martensite."
        },
        "Eutectoid": {
            "carbon_range": "≈ 0.76 wt%",
            "description": "Steel at the eutectoid composition. Transforms completely to pearlite (lamellar ferrite + cementite).",
            "properties": "High strength, good wear resistance, moderate ductility",
            "applications": "Rails, wire ropes, springs, high-strength fasteners",
            "phase_distribution": "100% pearlite structure",
            "phases": ["Pearlite"],
            "heat_treatment_response": "Optimal hardenability. Quenching produces ideal martensite."
        },
        "Hypereutectoid": {
            "carbon_range": "0.76 - 1.4 wt%",
            "description": "Steel with carbon above eutectoid. Contains pro-eutectoid cementite at grain boundaries.",
            "properties": "Very high hardness, excellent wear resistance, lower ductility",
            "applications": "Cutting tools, dies, ball bearings, files",
            "phase_distribution": "Pearlite matrix with cementite network",
            "phases": ["Pearlite", "Cementite"],
            "heat_treatment_response": "Quenching produces very hard but brittle martensite."
        },
        "Cementite-Dominant": {
            "carbon_range": "> 1.4 wt%",
            "description": "High-carbon steel approaching cast iron territory. Extensive cementite networks dominate.",
            "properties": "Extreme hardness, very brittle, limited formability",
            "applications": "Specialized cutting tools, wear plates",
            "phase_distribution": "Continuous cementite networks with pearlite",
            "phases": ["Cementite", "Pearlite"],
            "heat_treatment_response": "Brittle martensite with retained austenite on quenching."
        }
    }
    
    info = regime_info.get(regime)
    if not info:
        raise HTTPException(status_code=404, detail=f"Regime '{regime}' not found")
    
    return {"regime": regime, **info}

@api_router.get("/cooling-rate-range/{heat_treatment}")
async def get_cooling_rate_range(heat_treatment: str):
    """Get valid cooling rate range for a heat treatment type"""
    ranges = {
        "annealing": {"min": 0.01, "max": 1.0, "description": "Furnace cooling (very slow)"},
        "normalizing": {"min": 5, "max": 20, "description": "Air cooling"},
        "quenching": {"min": 50, "max": 200, "description": "Rapid cooling (water/oil)"}
    }
    
    ht = heat_treatment.lower()
    if ht not in ranges:
        raise HTTPException(status_code=404, detail=f"Heat treatment '{heat_treatment}' not found")
    
    return {"heat_treatment": ht, **ranges[ht]}

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
