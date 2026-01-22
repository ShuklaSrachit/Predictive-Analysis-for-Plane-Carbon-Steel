# Steel Microstructure AI - Product Requirements Document

## Original Problem Statement
Build a data-driven hybrid machine learning framework to predict the microstructural characteristics of plain carbon steel using numerical chemical composition and processing parameters.

## Architecture
- **Backend**: FastAPI (Python) with scikit-learn ML models
- **Frontend**: React with Tailwind CSS, Recharts for visualizations
- **Database**: MongoDB for prediction history
- **ML Models**: Random Forest + Artificial Neural Network (hybrid ensemble)

## User Personas
- Materials Scientists
- Metallurgical Engineers
- QC Engineers in Steel Industry
- Materials Science Students

## Core Requirements (Static)
### Inputs
| Parameter | Unit | Range |
|-----------|------|-------|
| Carbon Content | wt% | 0.05 - 2.10 |
| Manganese Content | wt% | 0.30 - 1.50 |
| Silicon Content | wt% | 0.10 - 0.60 |
| Austenitizing Temp | °C | 750 - 950 |
| Holding Time | min | 15 - 120 |
| Heat Treatment | - | Annealing/Normalizing/Quenching |
| Cooling Rate | °C/s | Conditioned by heat treatment |

### Outputs
- **Microstructure**: Initial/Final Grain Size (ASTM), Phase Fractions (Ferrite, Pearlite, Cementite, Martensite)
- **Mechanical Properties**: Yield Strength (MPa), Tensile Strength (MPa), Hardness (HV), Elongation (%)

### Physics Constraints Enforced
- Cooling rate conditioned by heat treatment type
- Martensite only forms during quenching (cooling rate ≥ 50°C/s)
- C > 1.5% requires Mn ≤ 1.0%

## What's Been Implemented (Jan 22, 2026)
- ✅ Backend ML pipeline with RF + ANN ensemble (3000 synthetic samples)
- ✅ Physics-guided feature engineering
- ✅ Full input validation with metallurgical constraints
- ✅ Dark industrial theme UI with JetBrains Mono font
- ✅ Interactive Fe-C Phase Diagram
- ✅ Phase distribution charts (Pie, Bar, Radar)
- ✅ Mechanical properties prediction and visualization
- ✅ Regime classification (Hypoeutectoid/Eutectoid/Hypereutectoid/Cementite-Dominant)
- ✅ Prediction history with full data persistence
- ✅ Regime info modal with metallurgical details

## Prioritized Backlog
### P0 (Critical)
- ✅ All P0 features implemented

### P1 (Important)
- [ ] Export predictions to CSV/PDF
- [ ] Batch prediction mode
- [ ] Compare multiple predictions side-by-side
- [ ] TTT/CCT diagram integration

### P2 (Nice to Have)
- [ ] User authentication for personalized history
- [ ] Model performance metrics dashboard
- [ ] Integration with experimental microstructure images for validation
- [ ] Custom alloy element inputs (Cr, Ni, Mo)

## Next Tasks
1. Add export functionality for predictions
2. Implement batch prediction from CSV upload
3. Add comparison view for multiple predictions
4. Consider TTT/CCT diagram visualization for advanced users
