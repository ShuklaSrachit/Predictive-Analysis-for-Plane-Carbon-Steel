import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export const PhaseChart = ({ prediction }) => {
  if (!prediction) return null;

  const pieData = [
    { name: "Ferrite", value: prediction.ferrite_fraction, color: "#007AFF" },
    { name: "Pearlite", value: prediction.pearlite_fraction, color: "#10B981" },
    { name: "Cementite", value: prediction.cementite_fraction, color: "#FF3B30" },
  ].filter(d => d.value > 0.5);

  const barData = [
    { name: "RF", grainSize: prediction.grain_size_rf, fill: "#007AFF" },
    { name: "ANN", grainSize: prediction.grain_size_ann, fill: "#F59E0B" },
    { name: "Ensemble", grainSize: prediction.grain_size_astm, fill: "#10B981" },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111] border border-white/20 p-3 font-mono text-sm">
          <p className="text-white">{payload[0].name}</p>
          <p style={{ color: payload[0].payload.color || payload[0].color }}>
            {payload[0].value.toFixed(1)}%
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="phase-charts">
      {/* Pie Chart - Phase Distribution */}
      <div className="bg-black/30 border border-white/5 p-4">
        <h4 className="data-label mb-4">Phase Distribution</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
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
                formatter={(value) => <span className="text-slate-400 font-mono text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Model Comparison */}
      <div className="bg-black/30 border border-white/5 p-4">
        <h4 className="data-label mb-4">Grain Size by Model</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#888', fontFamily: 'JetBrains Mono', fontSize: 11 }}
                axisLine={{ stroke: '#333' }}
              />
              <YAxis
                domain={[0, 14]}
                tick={{ fill: '#888', fontFamily: 'JetBrains Mono', fontSize: 11 }}
                axisLine={{ stroke: '#333' }}
                label={{
                  value: 'ASTM Number',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#666', fontFamily: 'JetBrains Mono', fontSize: 10 }
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
    </div>
  );
};
