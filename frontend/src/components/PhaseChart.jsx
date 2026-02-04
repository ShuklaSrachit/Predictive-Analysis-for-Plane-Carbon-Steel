import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export const PhaseChart = ({ prediction }) => {
  if (!prediction) return null;

  const pieData = [
    { name: "Ferrite", value: prediction.ferrite_fraction, color: "#4318FF" },
    { name: "Pearlite", value: prediction.pearlite_fraction, color: "#05CD99" },
    { name: "Cementite", value: prediction.cementite_fraction, color: "#EE5D50" },
    { name: "Martensite", value: prediction.martensite_fraction, color: "#7551FF" },
  ].filter(d => d.value > 0.5);

  const barData = [
    { name: "RF", grainSize: prediction.grain_size_rf, fill: "#4318FF" },
    { name: "ANN", grainSize: prediction.grain_size_ann, fill: "#7551FF" },
    { name: "Ensemble", grainSize: prediction.grain_size_astm, fill: "#05CD99" },
  ];

  const mechanicalData = [
    { property: "Yield", value: Math.min(100, prediction.yield_strength / 20), fullMark: 100 },
    { property: "Tensile", value: Math.min(100, prediction.tensile_strength / 25), fullMark: 100 },
    { property: "Hardness", value: Math.min(100, prediction.hardness / 9), fullMark: 100 },
    { property: "Elongation", value: prediction.elongation * 2.2, fullMark: 100 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E0E5F2] rounded-xl p-3 shadow-lg">
          <p className="text-[#2B3674] font-medium">{payload[0].name}</p>
          <p style={{ color: payload[0].payload.color || payload[0].color }} className="font-bold">
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
        <div className="bg-white border border-[#E0E5F2] rounded-xl p-3 shadow-lg">
          <p className="text-[#2B3674] font-medium">{payload[0].payload.name} Model</p>
          <p className="text-[#4318FF] font-bold">ASTM: {payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="phase-charts">
      {/* Pie Chart */}
      <div className="bg-[#F4F7FE] rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-[#2B3674] mb-4">Phase Distribution</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
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
                formatter={(value) => <span className="text-[#A3AED0] text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-[#F4F7FE] rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-[#2B3674] mb-4">Grain Size by Model</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E9EDF7" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#A3AED0', fontFamily: 'Inter', fontSize: 11 }}
                axisLine={{ stroke: '#E9EDF7' }}
              />
              <YAxis
                domain={[0, 14]}
                tick={{ fill: '#A3AED0', fontFamily: 'Inter', fontSize: 11 }}
                axisLine={{ stroke: '#E9EDF7' }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="grainSize" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-[#F4F7FE] rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-[#2B3674] mb-4">Mechanical Profile</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={mechanicalData}>
              <PolarGrid stroke="#E9EDF7" />
              <PolarAngleAxis 
                dataKey="property" 
                tick={{ fill: '#A3AED0', fontFamily: 'Inter', fontSize: 11 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fill: '#A3AED0', fontSize: 9 }}
                axisLine={false}
              />
              <Radar
                name="Properties"
                dataKey="value"
                stroke="#4318FF"
                fill="#4318FF"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
