import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export const ChemicalCompositionForm = ({ formData, setFormData }) => {
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
    <div className="space-y-5" data-testid="chemical-composition-form">
      {/* Carbon Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-[#2B3674]">Carbon Content (wt%)</Label>
          <span className={`regime-badge ${regime.class}`} data-testid="carbon-regime-badge">
            {regime.label}
          </span>
        </div>
        <div className="flex items-center gap-4">
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
            className="w-20 light-input text-center h-10"
            data-testid="carbon-input"
          />
        </div>
        <div className="flex justify-between text-xs text-[#A3AED0]">
          <span>0.05%</span>
          <span className="text-[#05CD99] font-medium">↑ 0.76% (Eutectoid)</span>
          <span>2.1%</span>
        </div>
      </div>

      {/* Manganese */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#2B3674]">Manganese (wt%)</Label>
        <div className="flex items-center gap-4">
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
            className="w-20 light-input text-center h-10"
            data-testid="mn-input"
          />
        </div>
        <div className="flex justify-between text-xs text-[#A3AED0]">
          <span>0.30%</span>
          <span>{formData.carbon_content > 1.5 ? "1.0% (C>1.5% limit)" : "1.50%"}</span>
        </div>
      </div>

      {/* Silicon */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#2B3674]">Silicon (wt%)</Label>
        <div className="flex items-center gap-4">
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
            className="w-20 light-input text-center h-10"
            data-testid="si-input"
          />
        </div>
        <div className="flex justify-between text-xs text-[#A3AED0]">
          <span>0.10%</span>
          <span>0.60%</span>
        </div>
      </div>
    </div>
  );
};
