import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export const PredictionForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    carbon_content: 0.4,
    austenitizing_temp: 850,
    holding_time: 2,
    cooling_rate: 10,
    heat_treatment: "normalizing"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSliderChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value[0] }));
  };

  const getRegimeLabel = (carbon) => {
    if (carbon < 0.76) return { label: "Hypoeutectoid", class: "regime-hypoeutectoid" };
    if (carbon >= 0.74 && carbon <= 0.78) return { label: "Eutectoid", class: "regime-eutectoid" };
    if (carbon <= 1.4) return { label: "Hypereutectoid", class: "regime-hypereutectoid" };
    return { label: "Cementite-Dominant", class: "regime-cementite" };
  };

  const regime = getRegimeLabel(formData.carbon_content);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="prediction-form">
      {/* Carbon Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="data-label">Carbon Content (wt%)</Label>
          <span className={`regime-badge ${regime.class}`} data-testid="carbon-regime-badge">
            {regime.label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Slider
            value={[formData.carbon_content]}
            onValueChange={(v) => handleSliderChange("carbon_content", v)}
            min={0.01}
            max={2.1}
            step={0.01}
            className="flex-1"
            data-testid="carbon-slider"
          />
          <Input
            type="number"
            value={formData.carbon_content}
            onChange={(e) => setFormData(prev => ({ ...prev, carbon_content: parseFloat(e.target.value) || 0 }))}
            min={0.01}
            max={2.1}
            step={0.01}
            className="w-20 industrial-input text-center h-10"
            data-testid="carbon-input"
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-slate-600">
          <span>0.01</span>
          <span className="text-[#10B981]">↑ 0.76 (Eutectoid)</span>
          <span>2.1</span>
        </div>
      </div>

      {/* Austenitizing Temperature */}
      <div className="space-y-3">
        <Label className="data-label">Austenitizing Temp (°C)</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[formData.austenitizing_temp]}
            onValueChange={(v) => handleSliderChange("austenitizing_temp", v)}
            min={727}
            max={1100}
            step={1}
            className="flex-1"
            data-testid="temp-slider"
          />
          <Input
            type="number"
            value={formData.austenitizing_temp}
            onChange={(e) => setFormData(prev => ({ ...prev, austenitizing_temp: parseFloat(e.target.value) || 727 }))}
            min={727}
            max={1100}
            step={1}
            className="w-20 industrial-input text-center h-10"
            data-testid="temp-input"
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-slate-600">
          <span>727 (A₁)</span>
          <span>1100</span>
        </div>
      </div>

      {/* Holding Time */}
      <div className="space-y-3">
        <Label className="data-label">Holding Time (hours)</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[formData.holding_time]}
            onValueChange={(v) => handleSliderChange("holding_time", v)}
            min={0.5}
            max={24}
            step={0.5}
            className="flex-1"
            data-testid="time-slider"
          />
          <Input
            type="number"
            value={formData.holding_time}
            onChange={(e) => setFormData(prev => ({ ...prev, holding_time: parseFloat(e.target.value) || 0.5 }))}
            min={0.5}
            max={24}
            step={0.5}
            className="w-20 industrial-input text-center h-10"
            data-testid="time-input"
          />
        </div>
      </div>

      {/* Cooling Rate */}
      <div className="space-y-3">
        <Label className="data-label">Cooling Rate (°C/s)</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[formData.cooling_rate]}
            onValueChange={(v) => handleSliderChange("cooling_rate", v)}
            min={0.1}
            max={100}
            step={0.1}
            className="flex-1"
            data-testid="rate-slider"
          />
          <Input
            type="number"
            value={formData.cooling_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, cooling_rate: parseFloat(e.target.value) || 0.1 }))}
            min={0.1}
            max={100}
            step={0.1}
            className="w-20 industrial-input text-center h-10"
            data-testid="rate-input"
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-slate-600">
          <span>0.1 (Slow)</span>
          <span>100 (Fast)</span>
        </div>
      </div>

      {/* Heat Treatment */}
      <div className="space-y-3">
        <Label className="data-label">Heat Treatment</Label>
        <Select 
          value={formData.heat_treatment} 
          onValueChange={(v) => setFormData(prev => ({ ...prev, heat_treatment: v }))}
        >
          <SelectTrigger className="industrial-input h-12" data-testid="heat-treatment-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111111] border-white/10">
            <SelectItem value="annealing" className="font-mono text-slate-300 focus:bg-white/10">
              ANNEALING (Slow Cool)
            </SelectItem>
            <SelectItem value="normalizing" className="font-mono text-slate-300 focus:bg-white/10">
              NORMALIZING (Air Cool)
            </SelectItem>
            <SelectItem value="quenching" className="font-mono text-slate-300 focus:bg-white/10">
              QUENCHING (Fast Cool)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full industrial-btn h-12"
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
