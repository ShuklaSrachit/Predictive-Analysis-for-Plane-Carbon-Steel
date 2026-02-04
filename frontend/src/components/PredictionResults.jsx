import { TrendingUp, TrendingDown, Target, Percent, Layers, Grid3X3, Zap, Shield, Ruler } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const PredictionResults = ({ prediction }) => {
  if (!prediction) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="no-prediction">
        <div className="w-20 h-20 mb-4 rounded-2xl bg-[#F4F7FE] flex items-center justify-center">
          <Target className="w-10 h-10 text-[#A3AED0]" />
        </div>
        <p className="font-semibold text-[#2B3674] mb-1">No Prediction Yet</p>
        <p className="text-sm text-[#A3AED0]">
          Enter parameters and click predict to see results
        </p>
      </div>
    );
  }

  const getRegimeBadgeClass = (regime) => {
    switch (regime) {
      case "Hypoeutectoid": return "regime-hypoeutectoid";
      case "Eutectoid": return "regime-eutectoid";
      case "Hypereutectoid": return "regime-hypereutectoid";
      case "Cementite-Dominant": return "regime-cementite";
      default: return "regime-hypoeutectoid";
    }
  };

  const getGrainClassStyle = (classification) => {
    return classification === "Fine" 
      ? { color: "#05CD99", bg: "bg-[#E6FFF9]" } 
      : { color: "#FFB547", bg: "bg-[#FFF9E6]" };
  };

  const hasMartensite = prediction.martensite_fraction > 1;
  const grainStyle = getGrainClassStyle(prediction.grain_classification);

  return (
    <div className="space-y-6" data-testid="prediction-results">
      {/* Header with Regime and Confidence */}
      <div className="flex items-center justify-between">
        <span className={`regime-badge ${getRegimeBadgeClass(prediction.regime)}`} data-testid="result-regime-badge">
          {prediction.regime}
        </span>
        <div className="flex items-center gap-2 bg-[#F4F7FE] px-3 py-1.5 rounded-lg">
          <span className="text-xs text-[#A3AED0]">Confidence</span>
          <span className="font-bold text-[#4318FF]" data-testid="confidence-value">
            {(prediction.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Initial Grain Size */}
        <div className="bg-[#F4F7FE] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Grid3X3 className="w-4 h-4 text-[#A3AED0]" />
            <span className="text-xs font-medium text-[#A3AED0]">Initial Grain</span>
          </div>
          <p className="text-xl font-bold text-[#2B3674]" data-testid="initial-grain-value">
            {prediction.initial_grain_size}
          </p>
          <p className="text-xs text-[#A3AED0]">ASTM No.</p>
        </div>

        {/* Final Grain Size */}
        <div className="bg-[#F4F7FE] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Grid3X3 className="w-4 h-4 text-[#4318FF]" />
            <span className="text-xs font-medium text-[#A3AED0]">Final Grain</span>
          </div>
          <p className="text-xl font-bold text-[#4318FF]" data-testid="grain-size-value">
            {prediction.grain_size_astm}
          </p>
          <p className="text-xs text-[#A3AED0]">RF: {prediction.grain_size_rf} | ANN: {prediction.grain_size_ann}</p>
        </div>

        {/* Grain Classification */}
        <div className={`${grainStyle.bg} rounded-2xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4" style={{ color: grainStyle.color }} />
            <span className="text-xs font-medium text-[#A3AED0]">Grain Class</span>
          </div>
          <p className="text-xl font-bold" style={{ color: grainStyle.color }} data-testid="grain-class-value">
            {prediction.grain_classification}
          </p>
          <p className="text-xs text-[#A3AED0]">
            {prediction.grain_classification === "Fine" ? "High strength" : "Better ductility"}
          </p>
        </div>

        {/* Carbon Content */}
        <div className="bg-[#F4F7FE] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-[#EE5D50]" />
            <span className="text-xs font-medium text-[#A3AED0]">Carbon</span>
          </div>
          <p className="text-xl font-bold text-[#EE5D50]" data-testid="carbon-value">
            {prediction.carbon_content}%
          </p>
          <p className="text-xs text-[#A3AED0]">
            Mn: {prediction.manganese_content}% | Si: {prediction.silicon_content}%
          </p>
        </div>
      </div>

      {/* Phase Fractions */}
      <div className="bg-[#F4F7FE] rounded-2xl p-5">
        <h3 className="font-semibold text-[#2B3674] mb-4">Phase Fractions</h3>
        <div className="space-y-4">
          {/* Ferrite */}
          {prediction.ferrite_fraction > 0.5 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#2B3674]">α-Ferrite (BCC)</span>
                <span className="font-bold text-[#4318FF]" data-testid="ferrite-value">
                  {prediction.ferrite_fraction.toFixed(1)}%
                </span>
              </div>
              <div className="progress-track">
                <div 
                  className="h-full bg-[#4318FF] rounded-full transition-all"
                  style={{ width: `${prediction.ferrite_fraction}%` }}
                />
              </div>
            </div>
          )}

          {/* Pearlite */}
          {prediction.pearlite_fraction > 0.5 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#2B3674]">Pearlite (α + Fe₃C)</span>
                <span className="font-bold text-[#05CD99]" data-testid="pearlite-value">
                  {prediction.pearlite_fraction.toFixed(1)}%
                </span>
              </div>
              <div className="progress-track">
                <div 
                  className="h-full bg-[#05CD99] rounded-full transition-all"
                  style={{ width: `${prediction.pearlite_fraction}%` }}
                />
              </div>
            </div>
          )}

          {/* Cementite */}
          {prediction.cementite_fraction > 0.5 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#2B3674]">Fe₃C (Cementite)</span>
                <span className="font-bold text-[#EE5D50]" data-testid="cementite-value">
                  {prediction.cementite_fraction.toFixed(1)}%
                </span>
              </div>
              <div className="progress-track">
                <div 
                  className="h-full bg-[#EE5D50] rounded-full transition-all"
                  style={{ width: `${prediction.cementite_fraction}%` }}
                />
              </div>
            </div>
          )}

          {/* Martensite */}
          {hasMartensite && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#2B3674]">Martensite (BCT)</span>
                <span className="font-bold text-[#7551FF]" data-testid="martensite-value">
                  {prediction.martensite_fraction.toFixed(1)}%
                </span>
              </div>
              <div className="progress-track">
                <div 
                  className="h-full bg-[#7551FF] rounded-full transition-all"
                  style={{ width: `${prediction.martensite_fraction}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mechanical Properties */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#868CFF] to-[#4318FF] rounded-2xl p-4 text-white text-center">
          <Zap className="w-5 h-5 mx-auto mb-2 opacity-80" />
          <p className="text-xs opacity-80 mb-1">Yield Strength</p>
          <p className="text-xl font-bold" data-testid="yield-strength">{prediction.yield_strength}</p>
          <p className="text-xs opacity-60">MPa</p>
        </div>

        <div className="bg-gradient-to-br from-[#FF6B6B] to-[#EE5D50] rounded-2xl p-4 text-white text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-2 opacity-80" />
          <p className="text-xs opacity-80 mb-1">Tensile Strength</p>
          <p className="text-xl font-bold" data-testid="tensile-strength">{prediction.tensile_strength}</p>
          <p className="text-xs opacity-60">MPa</p>
        </div>

        <div className="bg-gradient-to-br from-[#7551FF] to-[#4318FF] rounded-2xl p-4 text-white text-center">
          <Shield className="w-5 h-5 mx-auto mb-2 opacity-80" />
          <p className="text-xs opacity-80 mb-1">Hardness</p>
          <p className="text-xl font-bold" data-testid="hardness">{prediction.hardness}</p>
          <p className="text-xs opacity-60">HV</p>
        </div>

        <div className="bg-gradient-to-br from-[#05CD99] to-[#00B574] rounded-2xl p-4 text-white text-center">
          <Ruler className="w-5 h-5 mx-auto mb-2 opacity-80" />
          <p className="text-xs opacity-80 mb-1">Elongation</p>
          <p className="text-xl font-bold" data-testid="elongation">{prediction.elongation}</p>
          <p className="text-xs opacity-60">%</p>
        </div>
      </div>

      {/* Processing Summary */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-[#F4F7FE] px-4 py-2 rounded-xl">
          <span className="text-xs text-[#A3AED0]">Temp:</span>
          <span className="text-sm font-medium text-[#2B3674] ml-1">{prediction.austenitizing_temp}°C</span>
        </div>
        <div className="bg-[#F4F7FE] px-4 py-2 rounded-xl">
          <span className="text-xs text-[#A3AED0]">Time:</span>
          <span className="text-sm font-medium text-[#2B3674] ml-1">{prediction.holding_time} min</span>
        </div>
        <div className="bg-[#F4F7FE] px-4 py-2 rounded-xl">
          <span className="text-xs text-[#A3AED0]">Rate:</span>
          <span className="text-sm font-medium text-[#2B3674] ml-1">{prediction.cooling_rate}°C/s</span>
        </div>
        <div className="bg-[#F4F7FE] px-4 py-2 rounded-xl">
          <span className="text-xs text-[#A3AED0]">Treatment:</span>
          <span className="text-sm font-medium text-[#2B3674] ml-1 capitalize">{prediction.heat_treatment}</span>
        </div>
      </div>
    </div>
  );
};
