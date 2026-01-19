import { TrendingUp, TrendingDown, Target, Percent, Layers, Grid3X3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const PredictionResults = ({ prediction }) => {
  if (!prediction) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="no-prediction">
        <div className="w-16 h-16 mb-4 border-2 border-dashed border-white/20 flex items-center justify-center">
          <Target className="w-8 h-8 text-slate-600" />
        </div>
        <p className="font-mono text-sm text-slate-500">
          NO PREDICTION YET
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Enter parameters and click predict
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

  const getGrainClassColor = (classification) => {
    return classification === "Fine" ? "text-[#10B981]" : "text-[#F59E0B]";
  };

  return (
    <div className="space-y-6" data-testid="prediction-results">
      {/* Regime Badge */}
      <div className="flex items-center justify-between">
        <span className={`regime-badge ${getRegimeBadgeClass(prediction.regime)}`} data-testid="result-regime-badge">
          {prediction.regime}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">CONFIDENCE</span>
          <span className="font-mono font-bold text-[#007AFF]" data-testid="confidence-value">
            {(prediction.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Grain Size */}
        <div className="bg-black/30 border border-white/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-[#007AFF]" />
            <span className="data-label">Grain Size (ASTM)</span>
          </div>
          <p className="data-value" data-testid="grain-size-value">{prediction.grain_size_astm}</p>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>RF: {prediction.grain_size_rf}</span>
            <span>|</span>
            <span>ANN: {prediction.grain_size_ann}</span>
          </div>
        </div>

        {/* Grain Classification */}
        <div className="bg-black/30 border border-white/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F59E0B]" />
            <span className="data-label">Grain Class</span>
          </div>
          <p className={`text-2xl font-mono font-bold ${getGrainClassColor(prediction.grain_classification)}`} data-testid="grain-class-value">
            {prediction.grain_classification}
          </p>
          <div className="flex items-center gap-1 text-xs font-mono text-slate-500">
            {prediction.grain_classification === "Fine" ? (
              <TrendingDown className="w-3 h-3 text-[#10B981]" />
            ) : (
              <TrendingUp className="w-3 h-3 text-[#F59E0B]" />
            )}
            <span>{prediction.grain_classification === "Fine" ? "High strength" : "Better ductility"}</span>
          </div>
        </div>

        {/* Carbon Content */}
        <div className="bg-black/30 border border-white/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#FF3B30]" />
            <span className="data-label">Carbon Content</span>
          </div>
          <p className="data-value text-[#FF6B6B]" data-testid="carbon-value">{prediction.carbon_content}%</p>
          <p className="text-xs font-mono text-slate-500">
            {prediction.carbon_content <= 0.3 ? "Low Carbon" : 
             prediction.carbon_content <= 0.6 ? "Medium Carbon" : "High Carbon"}
          </p>
        </div>
      </div>

      {/* Phase Fractions */}
      <div className="space-y-4">
        <h3 className="font-mono text-sm font-semibold text-white tracking-wide">
          PHASE FRACTIONS
        </h3>
        
        {/* Ferrite */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-slate-400">α-Ferrite</span>
            <span className="font-mono font-bold text-[#007AFF]" data-testid="ferrite-value">
              {prediction.ferrite_fraction.toFixed(1)}%
            </span>
          </div>
          <Progress value={prediction.ferrite_fraction} className="h-2 bg-black/50" indicatorClassName="bg-[#007AFF]" />
        </div>

        {/* Pearlite */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-slate-400">Pearlite (α + Fe₃C)</span>
            <span className="font-mono font-bold text-[#10B981]" data-testid="pearlite-value">
              {prediction.pearlite_fraction.toFixed(1)}%
            </span>
          </div>
          <Progress value={prediction.pearlite_fraction} className="h-2 bg-black/50" indicatorClassName="bg-[#10B981]" />
        </div>

        {/* Cementite */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-slate-400">Fe₃C (Cementite)</span>
            <span className="font-mono font-bold text-[#FF3B30]" data-testid="cementite-value">
              {prediction.cementite_fraction.toFixed(1)}%
            </span>
          </div>
          <Progress value={prediction.cementite_fraction} className="h-2 bg-black/50" indicatorClassName="bg-[#FF3B30]" />
        </div>
      </div>

      {/* Input Summary */}
      <div className="pt-4 border-t border-white/10">
        <h4 className="data-label mb-3">Input Parameters</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-black/20 p-2">
            <span className="text-slate-500">Temp:</span>
            <span className="text-slate-300 ml-1">{prediction.austenitizing_temp}°C</span>
          </div>
          <div className="bg-black/20 p-2">
            <span className="text-slate-500">Time:</span>
            <span className="text-slate-300 ml-1">{prediction.holding_time}h</span>
          </div>
          <div className="bg-black/20 p-2">
            <span className="text-slate-500">Rate:</span>
            <span className="text-slate-300 ml-1">{prediction.cooling_rate}°C/s</span>
          </div>
          <div className="bg-black/20 p-2">
            <span className="text-slate-500">Treatment:</span>
            <span className="text-slate-300 ml-1 capitalize">{prediction.heat_treatment}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
