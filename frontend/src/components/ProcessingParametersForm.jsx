import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

// Cooling rate constraints by heat treatment
const COOLING_RATE_RANGES = {
  annealing: { min: 0.01, max: 1.0, default: 0.5 },
  normalizing: { min: 5, max: 20, default: 10 },
  quenching: { min: 50, max: 200, default: 100 }
};

export const ProcessingParametersForm = ({ formData, setFormData, onPredict, loading }) => {
  const [validationError, setValidationError] = useState(null);

  // Update cooling rate when heat treatment changes
  useEffect(() => {
    const range = COOLING_RATE_RANGES[formData.heat_treatment];
    if (range) {
      if (formData.cooling_rate < range.min || formData.cooling_rate > range.max) {
        setFormData(prev => ({ ...prev, cooling_rate: range.default }));
      }
    }
  }, [formData.heat_treatment]);

  // Validate inputs
  useEffect(() => {
    let error = null;
    
    if (formData.carbon_content > 1.5 && formData.manganese_content > 1.0) {
      error = "For C > 1.5%, Mn must be ≤ 1.0%";
    }
    
    const range = COOLING_RATE_RANGES[formData.heat_treatment];
    if (range && (formData.cooling_rate < range.min || formData.cooling_rate > range.max)) {
      error = `${formData.heat_treatment} requires cooling rate ${range.min}-${range.max} °C/s`;
    }
    
    setValidationError(error);
  }, [formData]);

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

  const coolingRange = COOLING_RATE_RANGES[formData.heat_treatment];

  return (
    <div className="space-y-5" data-testid="processing-parameters-form">
      {/* Austenitizing Temperature */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#2B3674]">Austenitizing Temp (°C)</Label>
        <div className="flex items-center gap-4">
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
            className="w-20 light-input text-center h-10"
            data-testid="temp-input"
          />
        </div>
        <div className="flex justify-between text-xs text-[#A3AED0]">
          <span>750°C</span>
          <span>950°C</span>
        </div>
      </div>

      {/* Holding Time */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#2B3674]">Holding Time (minutes)</Label>
        <div className="flex items-center gap-4">
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
            className="w-20 light-input text-center h-10"
            data-testid="time-input"
          />
        </div>
        <div className="flex justify-between text-xs text-[#A3AED0]">
          <span>15 min</span>
          <span>120 min</span>
        </div>
      </div>

      {/* Heat Treatment */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#2B3674]">Heat Treatment</Label>
        <Select 
          value={formData.heat_treatment} 
          onValueChange={handleHeatTreatmentChange}
        >
          <SelectTrigger className="light-input h-12" data-testid="heat-treatment-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#E0E5F2]">
            <SelectItem value="annealing" className="text-[#2B3674] focus:bg-[#F4F7FE]">
              Annealing (Furnace Cool)
            </SelectItem>
            <SelectItem value="normalizing" className="text-[#2B3674] focus:bg-[#F4F7FE]">
              Normalizing (Air Cool)
            </SelectItem>
            <SelectItem value="quenching" className="text-[#2B3674] focus:bg-[#F4F7FE]">
              Quenching (Rapid Cool)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cooling Rate */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-[#2B3674]">Cooling Rate (°C/s)</Label>
          <span className="text-xs text-[#A3AED0] bg-[#F4F7FE] px-2 py-1 rounded-lg">
            Valid: {coolingRange.min} - {coolingRange.max}
          </span>
        </div>
        <div className="flex items-center gap-4">
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
            className="w-20 light-input text-center h-10"
            data-testid="rate-input"
          />
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-[#FFF5F5] border border-[#EE5D50]/30 text-[#EE5D50] text-sm rounded-xl" data-testid="validation-error">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={onPredict}
        disabled={loading || validationError}
        className="w-full primary-btn h-12 text-base"
        data-testid="predict-btn"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Computing...
          </>
        ) : (
          "Predict Microstructure"
        )}
      </Button>
    </div>
  );
};
