import { TrendingUp, TrendingDown, Target, Percent, Layers, Grid3X3, Zap, Shield, Ruler } from "lucide-react";
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

  // Check if martensite is present (quenching)
  const hasMartensite = prediction.martensite_fraction > 1;

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Initial Grain Size */}
        <div className="bg-black/30 border border-white/5 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-3 h-3 text-slate-500" />
            <span className="data-label text-[10px]">Initial Grain</span>
          </div>
          <p className="text-lg font-mono font-bold text-slate-400" data-testid="initial-grain-value">
            {prediction.initial_grain_size}
          </p>
          <p className="text-[10px] font-mono text-slate-600">ASTM No.</p>
        </div>

        {/* Final Grain Size */}
        <div className="bg-black/30 border border-white/5 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-3 h-3 text-[#007AFF]" />
            <span className="data-label text-[10px]">Final Grain</span>
          </div>
          <p className="data-value text-lg" data-testid="grain-size-value">{prediction.grain_size_astm}</p>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600">
            <span>RF:{prediction.grain_size_rf}</span>
            <span>ANN:{prediction.grain_size_ann}</span>
          </div>
        </div>

        {/* Grain Classification */}
        <div className="bg-black/30 border border-white/5 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-3 h-3 text-[#F59E0B]" />
            <span className="data-label text-[10px]">Grain Class</span>
          </div>
          <p className={`text-lg font-mono font-bold ${getGrainClassColor(prediction.grain_classification)}`} data-testid="grain-class-value">
            {prediction.grain_classification}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600">
            {prediction.grain_classification === "Fine" ? (
              <>
                <TrendingDown className="w-3 h-3 text-[#10B981]" />
                <span>High strength</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3 h-3 text-[#F59E0B]" />
                <span>Better ductility</span>
              </>
            )}
          </div>
        </div>

        {/* Carbon Content */}
        <div className="bg-black/30 border border-white/5 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Percent className="w-3 h-3 text-[#FF3B30]" />
            <span className="data-label text-[10px]">Carbon</span>
          </div>
          <p className="text-lg font-mono font-bold text-[#FF6B6B]" data-testid="carbon-value">{prediction.carbon_content}%</p>
          <p className="text-[10px] font-mono text-slate-600">
            Mn: {prediction.manganese_content}% Si: {prediction.silicon_content}%
          </p>
        </div>
      </div>

      {/* Phase Fractions */}
      <div className="space-y-3">
        <h3 className="font-mono text-sm font-semibold text-white tracking-wide">
          PHASE FRACTIONS
        </h3>
        
        {/* Ferrite */}
        {prediction.ferrite_fraction > 0.5 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">α-Ferrite (BCC)</span>
              <span className="font-mono font-bold text-[#007AFF]" data-testid="ferrite-value">
                {prediction.ferrite_fraction.toFixed(1)}%
              </span>
            </div>
            <Progress value={prediction.ferrite_fraction} className="h-1.5 bg-black/50" indicatorClassName="bg-[#007AFF]" />
          </div>
        )}

        {/* Pearlite */}
        {prediction.pearlite_fraction > 0.5 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Pearlite (α + Fe₃C)</span>
              <span className="font-mono font-bold text-[#10B981]" data-testid="pearlite-value">
                {prediction.pearlite_fraction.toFixed(1)}%
              </span>
            </div>
            <Progress value={prediction.pearlite_fraction} className="h-1.5 bg-black/50" indicatorClassName="bg-[#10B981]" />
          </div>
        )}

        {/* Cementite */}
        {prediction.cementite_fraction > 0.5 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Fe₃C (Cementite)</span>
              <span className="font-mono font-bold text-[#FF3B30]" data-testid="cementite-value">
                {prediction.cementite_fraction.toFixed(1)}%
              </span>
            </div>
            <Progress value={prediction.cementite_fraction} className="h-1.5 bg-black/50" indicatorClassName="bg-[#FF3B30]" />
          </div>
        )}

        {/* Martensite - Only shown for quenching */}
        {hasMartensite && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Martensite (BCT)</span>
              <span className="font-mono font-bold text-[#A855F7]" data-testid="martensite-value">
                {prediction.martensite_fraction.toFixed(1)}%
              </span>
            </div>
            <Progress value={prediction.martensite_fraction} className="h-1.5 bg-black/50" indicatorClassName="bg-[#A855F7]" />
          </div>
        )}
      </div>

      {/* Mechanical Properties */}
      <div className="space-y-3">
        <h3 className="font-mono text-sm font-semibold text-white tracking-wide">
          MECHANICAL PROPERTIES
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Yield Strength */}
          <div className="bg-black/30 border border-white/5 p-3 text-center">
            <Zap className="w-4 h-4 mx-auto mb-1 text-[#F59E0B]" />
            <p className="data-label text-[10px]">Yield Strength</p>
            <p className="text-lg font-mono font-bold text-[#F59E0B]" data-testid="yield-strength">
              {prediction.yield_strength}
            </p>
            <p className="text-[10px] text-slate-600">MPa</p>
          </div>

          {/* Tensile Strength */}
          <div className="bg-black/30 border border-white/5 p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-[#EF4444]" />
            <p className="data-label text-[10px]">Tensile Strength</p>
            <p className="text-lg font-mono font-bold text-[#EF4444]" data-testid="tensile-strength">
              {prediction.tensile_strength}
            </p>
            <p className="text-[10px] text-slate-600">MPa</p>
          </div>

          {/* Hardness */}
          <div className="bg-black/30 border border-white/5 p-3 text-center">
            <Shield className="w-4 h-4 mx-auto mb-1 text-[#A855F7]" />
            <p className="data-label text-[10px]">Hardness</p>
            <p className="text-lg font-mono font-bold text-[#A855F7]" data-testid="hardness">
              {prediction.hardness}
            </p>
            <p className="text-[10px] text-slate-600">HV</p>
          </div>

          {/* Elongation */}
          <div className="bg-black/30 border border-white/5 p-3 text-center">
            <Ruler className="w-4 h-4 mx-auto mb-1 text-[#10B981]" />
            <p className="data-label text-[10px]">Elongation</p>
            <p className="text-lg font-mono font-bold text-[#10B981]" data-testid="elongation">
              {prediction.elongation}
            </p>
            <p className="text-[10px] text-slate-600">%</p>
          </div>
        </div>
      </div>

      {/* Input Summary */}
      <div className="pt-3 border-t border-white/10">
        <h4 className="data-label mb-2">Processing Parameters</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-black/20 p-2">
            <span className="text-slate-500">Temp:</span>
            <span className="text-slate-300 ml-1">{prediction.austenitizing_temp}°C</span>
          </div>
          <div className="bg-black/20 p-2">
            <span className="text-slate-500">Time:</span>
            <span className="text-slate-300 ml-1">{prediction.holding_time} min</span>
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
