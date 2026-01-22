import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export const PhaseChart = ({ prediction }) => {
  if (!prediction) return null;

  const pieData = [
    { name: "Ferrite", value: prediction.ferrite_fraction, color: "#007AFF" },
    { name: "Pearlite", value: prediction.pearlite_fraction, color: "#10B981" },
    { name: "Cementite", value: prediction.cementite_fraction, color: "#FF3B30" },
    { name: "Martensite", value: prediction.martensite_fraction, color: "#A855F7" },
  ].filter(d => d.value > 0.5);

  const barData = [
    { name: "RF", grainSize: prediction.grain_size_rf, fill: "#007AFF" },
    { name: "ANN", grainSize: prediction.grain_size_ann, fill: "#F59E0B" },
    { name: "Ensemble", grainSize: prediction.grain_size_astm, fill: "#10B981" },
  ];

  // Mechanical properties radar data
  const mechanicalData = [
    { property: "Yield", value: Math.min(100, prediction.yield_strength / 20), fullMark: 100 },
    { property: "Tensile", value: Math.min(100, prediction.tensile_strength / 25), fullMark: 100 },
    { property: "Hardness", value: Math.min(100, prediction.hardness / 9), fullMark: 100 },
    { property: "Elongation", value: prediction.elongation * 2.2, fullMark: 100 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111] border border-white/20 p-3 font-mono text-sm">
          <p className="text-white">{payload[0].name}</p>
          <p style={{ color: payload[0].payload.color || payload[0].color }}>
            {typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111] border border-white/20 p-3 font-mono text-sm">
          <p className="text-white">{payload[0].payload.name} Model</p>
          <p className="text-[#60A5FA]">
            ASTM: {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="phase-charts">
      {/* Pie Chart - Phase Distribution */}
      <div className="bg-black/30 border border-white/5 p-4">
        <h4 className="data-label mb-3">Phase Distribution</h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-slate-400 font-mono text-[10px]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Model Comparison */}
      <div className="bg-black/30 border border-white/5 p-4">
        <h4 className="data-label mb-3">Grain Size by Model</h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#888', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                axisLine={{ stroke: '#333' }}
              />
              <YAxis
                domain={[0, 14]}
                tick={{ fill: '#888', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                axisLine={{ stroke: '#333' }}
                label={{
                  value: 'ASTM',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#666', fontFamily: 'JetBrains Mono', fontSize: 9 }
                }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="grainSize" radius={[2, 2, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Chart - Mechanical Properties */}
      <div className="bg-black/30 border border-white/5 p-4">
        <h4 className="data-label mb-3">Mechanical Profile</h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mechanicalData}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis 
                dataKey="property" 
                tick={{ fill: '#888', fontFamily: 'JetBrains Mono', fontSize: 10 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fill: '#666', fontSize: 8 }}
                axisLine={false}
              />
              <Radar
                name="Properties"
                dataKey="value"
                stroke="#007AFF"
                fill="#007AFF"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
