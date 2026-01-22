import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Cooling rate constraints by heat treatment
const COOLING_RATE_RANGES = {
  annealing: { min: 0.01, max: 1.0, default: 0.5 },
  normalizing: { min: 5, max: 20, default: 10 },
  quenching: { min: 50, max: 200, default: 100 }
};

export const PredictionForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    carbon_content: 0.45,
    manganese_content: 0.65,
    silicon_content: 0.25,
    austenitizing_temp: 850,
    holding_time: 30,
    cooling_rate: 10,
    heat_treatment: "normalizing"
  });

  const [validationError, setValidationError] = useState(null);

  // Update cooling rate when heat treatment changes
  useEffect(() => {
    const range = COOLING_RATE_RANGES[formData.heat_treatment];
    if (range) {
      // If current cooling rate is outside valid range, reset to default
      if (formData.cooling_rate < range.min || formData.cooling_rate > range.max) {
        setFormData(prev => ({ ...prev, cooling_rate: range.default }));
      }
    }
  }, [formData.heat_treatment]);

  // Validate inputs
  useEffect(() => {
    let error = null;
    
    // Check Mn constraint for high C
    if (formData.carbon_content > 1.5 && formData.manganese_content > 1.0) {
      error = "For C > 1.5%, Mn must be ≤ 1.0%";
    }
    
    // Check cooling rate vs heat treatment
    const range = COOLING_RATE_RANGES[formData.heat_treatment];
    if (range && (formData.cooling_rate < range.min || formData.cooling_rate > range.max)) {
      error = `${formData.heat_treatment} requires cooling rate ${range.min}-${range.max} °C/s`;
    }
    
    setValidationError(error);
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validationError) return;
    onSubmit(formData);
  };

  const handleSliderChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value[0] }));
  };

  const handleHeatTreatmentChange = (value) => {
    const range = COOLING_RATE_RANGES[value];
    setFormData(prev => ({ 
      ...prev, 
      heat_treatment: value,
      cooling_rate: range.default
    }));
  };

  const getRegimeLabel = (carbon) => {
    if (carbon < 0.76) return { label: "Hypoeutectoid", class: "regime-hypoeutectoid" };
    if (carbon >= 0.74 && carbon <= 0.78) return { label: "Eutectoid", class: "regime-eutectoid" };
    if (carbon <= 1.4) return { label: "Hypereutectoid", class: "regime-hypereutectoid" };
    return { label: "Cementite-Dominant", class: "regime-cementite" };
  };

  const regime = getRegimeLabel(formData.carbon_content);
  const coolingRange = COOLING_RATE_RANGES[formData.heat_treatment];

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="prediction-form">
      {/* Carbon Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="data-label">Carbon Content (wt%)</Label>
          <span className={`regime-badge ${regime.class}`} data-testid="carbon-regime-badge">
            {regime.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Slider
            value={[formData.carbon_content]}
            onValueChange={(v) => handleSliderChange("carbon_content", v)}
            min={0.05}
            max={2.1}
            step={0.01}
            className="flex-1"
            data-testid="carbon-slider"
          />
          <Input
            type="number"
            value={formData.carbon_content}
            onChange={(e) => setFormData(prev => ({ ...prev, carbon_content: parseFloat(e.target.value) || 0.05 }))}
            min={0.05}
            max={2.1}
            step={0.01}
            className="w-20 industrial-input text-center h-9"
            data-testid="carbon-input"
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-600">
          <span>0.05</span>
          <span className="text-[#10B981]">↑ 0.76 (Eutectoid)</span>
          <span>2.1</span>
        </div>
      </div>

      {/* Manganese & Silicon Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="data-label">Manganese (wt%)</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[formData.manganese_content]}
              onValueChange={(v) => handleSliderChange("manganese_content", v)}
              min={0.30}
              max={formData.carbon_content > 1.5 ? 1.0 : 1.50}
              step={0.01}
              className="flex-1"
              data-testid="mn-slider"
            />
            <Input
              type="number"
              value={formData.manganese_content}
              onChange={(e) => setFormData(prev => ({ ...prev, manganese_content: parseFloat(e.target.value) || 0.30 }))}
              min={0.30}
              max={1.50}
              step={0.01}
              className="w-16 industrial-input text-center h-9 text-sm"
              data-testid="mn-input"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="data-label">Silicon (wt%)</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[formData.silicon_content]}
              onValueChange={(v) => handleSliderChange("silicon_content", v)}
              min={0.10}
              max={0.60}
              step={0.01}
              className="flex-1"
              data-testid="si-slider"
            />
            <Input
              type="number"
              value={formData.silicon_content}
              onChange={(e) => setFormData(prev => ({ ...prev, silicon_content: parseFloat(e.target.value) || 0.10 }))}
              min={0.10}
              max={0.60}
              step={0.01}
              className="w-16 industrial-input text-center h-9 text-sm"
              data-testid="si-input"
            />
          </div>
        </div>
      </div>

      {/* Austenitizing Temperature */}
      <div className="space-y-2">
        <Label className="data-label">Austenitizing Temp (°C)</Label>
        <div className="flex items-center gap-3">
          <Slider
            value={[formData.austenitizing_temp]}
            onValueChange={(v) => handleSliderChange("austenitizing_temp", v)}
            min={750}
            max={950}
            step={1}
            className="flex-1"
            data-testid="temp-slider"
          />
          <Input
            type="number"
            value={formData.austenitizing_temp}
            onChange={(e) => setFormData(prev => ({ ...prev, austenitizing_temp: parseFloat(e.target.value) || 750 }))}
            min={750}
            max={950}
            step={1}
            className="w-20 industrial-input text-center h-9"
            data-testid="temp-input"
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-600">
          <span>750</span>
          <span>950</span>
        </div>
      </div>

      {/* Holding Time */}
      <div className="space-y-2">
        <Label className="data-label">Holding Time (minutes)</Label>
        <div className="flex items-center gap-3">
          <Slider
            value={[formData.holding_time]}
            onValueChange={(v) => handleSliderChange("holding_time", v)}
            min={15}
            max={120}
            step={1}
            className="flex-1"
            data-testid="time-slider"
          />
          <Input
            type="number"
            value={formData.holding_time}
            onChange={(e) => setFormData(prev => ({ ...prev, holding_time: parseFloat(e.target.value) || 15 }))}
            min={15}
            max={120}
            step={1}
            className="w-20 industrial-input text-center h-9"
            data-testid="time-input"
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-600">
          <span>15 min</span>
          <span>120 min</span>
        </div>
      </div>

      {/* Heat Treatment */}
      <div className="space-y-2">
        <Label className="data-label">Heat Treatment</Label>
        <Select 
          value={formData.heat_treatment} 
          onValueChange={handleHeatTreatmentChange}
        >
          <SelectTrigger className="industrial-input h-10" data-testid="heat-treatment-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111111] border-white/10">
            <SelectItem value="annealing" className="font-mono text-slate-300 focus:bg-white/10">
              ANNEALING (Furnace Cool)
            </SelectItem>
            <SelectItem value="normalizing" className="font-mono text-slate-300 focus:bg-white/10">
              NORMALIZING (Air Cool)
            </SelectItem>
            <SelectItem value="quenching" className="font-mono text-slate-300 focus:bg-white/10">
              QUENCHING (Rapid Cool)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cooling Rate - Conditioned by Heat Treatment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="data-label">Cooling Rate (°C/s)</Label>
          <span className="text-[10px] font-mono text-slate-500">
            Valid: {coolingRange.min} - {coolingRange.max}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Slider
            value={[formData.cooling_rate]}
            onValueChange={(v) => handleSliderChange("cooling_rate", v)}
            min={coolingRange.min}
            max={coolingRange.max}
            step={coolingRange.min < 1 ? 0.01 : 1}
            className="flex-1"
            data-testid="rate-slider"
          />
          <Input
            type="number"
            value={formData.cooling_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, cooling_rate: parseFloat(e.target.value) || coolingRange.min }))}
            min={coolingRange.min}
            max={coolingRange.max}
            step={coolingRange.min < 1 ? 0.01 : 1}
            className="w-20 industrial-input text-center h-9"
            data-testid="rate-input"
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-600">
          <span>{coolingRange.min} (Slow)</span>
          <span>{coolingRange.max} (Fast)</span>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono" data-testid="validation-error">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || validationError}
        className="w-full industrial-btn h-11"
        data-testid="predict-btn"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            COMPUTING...
          </>
        ) : (
          "PREDICT MICROSTRUCTURE"
        )}
      </Button>
    </form>
  );
};
