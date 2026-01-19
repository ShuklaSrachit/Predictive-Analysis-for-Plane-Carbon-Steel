import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea, Tooltip, Scatter, ScatterChart, ZAxis } from "recharts";

export const PhaseDiagram = ({ data, currentCarbon }) => {
  // Generate phase boundary lines based on Fe-C diagram principles
  const diagramData = useMemo(() => {
    if (!data) return null;

    // Austenite + Ferrite boundary (A3 line)
    const a3Line = [];
    for (let c = 0; c <= 0.76; c += 0.02) {
      const temp = 912 - (912 - 727) * (c / 0.76);
      a3Line.push({ carbon: c, temperature: temp });
    }

    // Austenite + Cementite boundary (Acm line)
    const acmLine = [];
    for (let c = 0.76; c <= 2.1; c += 0.02) {
      const temp = 727 + (1148 - 727) * ((c - 0.76) / (2.1 - 0.76));
      acmLine.push({ carbon: c, temperature: temp });
    }

    // Liquidus line approximation
    const liquidusLine = [];
    for (let c = 0; c <= 2.1; c += 0.05) {
      const temp = 1538 - (1538 - 1148) * (c / 2.1);
      liquidusLine.push({ carbon: c, temperature: temp });
    }

    // Solidus line approximation
    const solidusLine = [];
    for (let c = 0; c <= 2.1; c += 0.05) {
      const temp = c <= 0.5 ? 1495 - c * 190 : 1400 - (c - 0.5) * 157;
      solidusLine.push({ carbon: c, temperature: Math.max(temp, 1148) });
    }

    return { a3Line, acmLine, liquidusLine, solidusLine };
  }, [data]);

  if (!diagramData) {
    return (
      <div className="h-80 flex items-center justify-center border border-white/10 bg-black/30">
        <p className="font-mono text-sm text-slate-500">Loading phase diagram...</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111] border border-white/20 p-3 font-mono text-sm">
          <p className="text-slate-400">C: {payload[0]?.payload?.carbon?.toFixed(2)} wt%</p>
          <p className="text-slate-400">T: {payload[0]?.payload?.temperature?.toFixed(0)}°C</p>
        </div>
      );
    }
    return null;
  };

  // Current point marker
  const currentPoint = currentCarbon ? [{ carbon: currentCarbon, temperature: 850, z: 200 }] : [];

  return (
    <div className="space-y-4" data-testid="phase-diagram">
      <div className="h-80 phase-diagram-container p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              type="number"
              dataKey="carbon"
              domain={[0, 2.2]}
              tick={{ fill: '#888', fontFamily: 'JetBrains Mono', fontSize: 10 }}
              axisLine={{ stroke: '#444' }}
              label={{
                value: 'Carbon Content (wt%)',
                position: 'bottom',
                offset: 0,
                style: { fill: '#666', fontFamily: 'JetBrains Mono', fontSize: 11 }
              }}
            />
            <YAxis
              type="number"
              dataKey="temperature"
              domain={[200, 1600]}
              tick={{ fill: '#888', fontFamily: 'JetBrains Mono', fontSize: 10 }}
              axisLine={{ stroke: '#444' }}
              label={{
                value: 'Temperature (°C)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#666', fontFamily: 'JetBrains Mono', fontSize: 11 }
              }}
            />
            <ZAxis range={[50, 200]} />
            
            {/* Phase regions reference areas */}
            <ReferenceArea
              x1={0}
              x2={0.76}
              y1={200}
              y2={727}
              fill="#007AFF"
              fillOpacity={0.1}
              label={{ value: 'α + Fe₃C', position: 'center', fill: '#007AFF', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            />
            <ReferenceArea
              x1={0.76}
              x2={2.1}
              y1={200}
              y2={727}
              fill="#FF3B30"
              fillOpacity={0.1}
            />
            
            {/* Eutectoid line */}
            <ReferenceLine
              y={727}
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: 'A₁ (727°C)', position: 'right', fill: '#F59E0B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            />
            
            {/* Eutectoid point vertical line */}
            <ReferenceLine
              x={0.76}
              stroke="#10B981"
              strokeWidth={1}
              strokeDasharray="3 3"
              label={{ value: '0.76%', position: 'top', fill: '#10B981', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            />

            {/* A3 line */}
            <Scatter
              name="A₃ Line"
              data={diagramData.a3Line}
              line={{ stroke: '#007AFF', strokeWidth: 2 }}
              fill="transparent"
              legendType="none"
            />

            {/* Acm line */}
            <Scatter
              name="Acm Line"
              data={diagramData.acmLine}
              line={{ stroke: '#FF3B30', strokeWidth: 2 }}
              fill="transparent"
              legendType="none"
            />

            {/* Liquidus line */}
            <Scatter
              name="Liquidus"
              data={diagramData.liquidusLine}
              line={{ stroke: '#F59E0B', strokeWidth: 1.5 }}
              fill="transparent"
              legendType="none"
            />

            {/* Current carbon marker */}
            {currentPoint.length > 0 && (
              <Scatter
                name="Current"
                data={currentPoint}
                fill="#FFFFFF"
                shape="diamond"
              />
            )}

            <Tooltip content={<CustomTooltip />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-[#007AFF]"></div>
          <span className="text-slate-400">A₃ (γ/α boundary)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-[#FF3B30]"></div>
          <span className="text-slate-400">Acm (γ/Fe₃C boundary)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-[#F59E0B]"></div>
          <span className="text-slate-400">A₁ (Eutectoid 727°C)</span>
        </div>
        {currentCarbon && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rotate-45"></div>
            <span className="text-slate-400">Current ({currentCarbon}%)</span>
          </div>
        )}
      </div>

      {/* Phase Labels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4">
        <div className="text-center p-2 border border-[#007AFF]/30 bg-[#007AFF]/5">
          <p className="text-xs font-mono text-[#007AFF]">α (Ferrite)</p>
          <p className="text-[10px] text-slate-500">BCC, Soft, Ductile</p>
        </div>
        <div className="text-center p-2 border border-[#10B981]/30 bg-[#10B981]/5">
          <p className="text-xs font-mono text-[#10B981]">Pearlite (α+Fe₃C)</p>
          <p className="text-[10px] text-slate-500">Lamellar, Strong</p>
        </div>
        <div className="text-center p-2 border border-[#FF3B30]/30 bg-[#FF3B30]/5">
          <p className="text-xs font-mono text-[#FF3B30]">Fe₃C (Cementite)</p>
          <p className="text-[10px] text-slate-500">Hard, Brittle</p>
        </div>
        <div className="text-center p-2 border border-[#F59E0B]/30 bg-[#F59E0B]/5">
          <p className="text-xs font-mono text-[#F59E0B]">γ (Austenite)</p>
          <p className="text-[10px] text-slate-500">FCC, High Temp</p>
        </div>
      </div>
    </div>
  );
};
