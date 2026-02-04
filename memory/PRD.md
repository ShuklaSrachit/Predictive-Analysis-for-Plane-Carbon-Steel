# Steel Microstructure AI - Product Requirements Document

## Original Problem Statement
Build a data-driven hybrid machine learning framework to predict the microstructural characteristics of plain carbon steel using numerical chemical composition and processing parameters.

## Architecture
- **Backend**: FastAPI (Python) with scikit-learn ML models (Random Forest + ANN)
- **Frontend**: React with Tailwind CSS, Recharts for visualizations
- **Database**: MongoDB for prediction history
- **ML Models**: Physics-guided hybrid ensemble trained on 3000 synthetic samples

## User Personas
- Materials Scientists
- Metallurgical Engineers  
- QC Engineers in Steel Industry
- Materials Science Students

## Core Requirements (Static)
### Inputs - Chemical Composition
| Parameter | Unit | Range |
|-----------|------|-------|
| Carbon Content | wt% | 0.05 - 2.10 |
| Manganese Content | wt% | 0.30 - 1.50 |
| Silicon Content | wt% | 0.10 - 0.60 |

### Inputs - Processing Parameters
| Parameter | Unit | Range |
|-----------|------|-------|
| Austenitizing Temp | °C | 750 - 950 |
| Holding Time | min | 15 - 120 |
| Heat Treatment | - | Annealing/Normalizing/Quenching |
| Cooling Rate | °C/s | Conditioned by treatment |

### Outputs
- **Microstructure**: Initial/Final Grain Size (ASTM), Phase Fractions (Ferrite, Pearlite, Cementite, Martensite)
- **Mechanical Properties**: Yield Strength (MPa), Tensile Strength (MPa), Hardness (HV), Elongation (%)

## What's Been Implemented (Feb 4, 2026)
### Phase 1: Core ML Framework
- ✅ Backend ML pipeline with RF + ANN ensemble
- ✅ Physics-guided feature engineering
- ✅ Full input validation with metallurgical constraints
- ✅ Phase fraction and mechanical property predictions

### Phase 2: UI Redesign (Skydash Light Theme)
- ✅ Light theme (#F4F7FE background)
- ✅ Sidebar navigation (Dashboard, Predictions, History, Settings)
- ✅ Separated input forms: Chemical Composition + Processing Parameters
- ✅ Colorful gradient stat cards (Yield, Hardness, Elongation)
- ✅ Clean white dashboard cards with shadows
- ✅ Removed Fe-C Phase Diagram as requested
- ✅ Phase Distribution charts (Pie, Bar, Radar)
- ✅ Prediction history with full CRUD operations
- ✅ Regime info modal with metallurgical details

## Physics Constraints Enforced
- Cooling rate conditioned by heat treatment type
- Martensite only forms during quenching (cooling rate ≥ 50°C/s)
- C > 1.5% requires Mn ≤ 1.0%

## Prioritized Backlog
### P1 (Important)
- [ ] Export predictions to CSV/PDF
- [ ] Batch prediction mode
- [ ] Compare multiple predictions side-by-side

### P2 (Nice to Have)
- [ ] User authentication
- [ ] TTT/CCT diagram integration
- [ ] Custom alloy element inputs (Cr, Ni, Mo)

## Next Tasks
1. Add export functionality for predictions
2. Implement batch prediction from CSV upload
3. Add comparison view for multiple predictions
