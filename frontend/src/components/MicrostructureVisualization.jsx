import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MicrostructureVisualization = ({ prediction }) => {
  const [grid, setGrid] = useState([]);
  const gridSize = 25; // 25x25 grid = 625 cells
  
  // Phase colors matching realistic metallographic appearance
  const phaseColors = {
    ferrite: "#60A5FA",    // Blue - representing white/light areas in real micrograph
    pearlite: "#C084FC",   // Purple - representing dark lamellar areas
    cementite: "#EF4444",  // Red - for cementite networks
    martensite: "#1E3A5F", // Dark blue - needle-like martensite
  };

  const generateGrid = useCallback(() => {
    if (!prediction) return;

    const ferrite = prediction.ferrite_fraction || 0;
    const pearlite = prediction.pearlite_fraction || 0;
    const cementite = prediction.cementite_fraction || 0;
    const martensite = prediction.martensite_fraction || 0;

    const totalCells = gridSize * gridSize;
    const newGrid = [];

    // Calculate number of cells for each phase
    const ferriteCells = Math.round((ferrite / 100) * totalCells);
    const pearliteCells = Math.round((pearlite / 100) * totalCells);
    const cementiteCells = Math.round((cementite / 100) * totalCells);
    const martensiteCells = Math.round((martensite / 100) * totalCells);

    // Create array of phases based on fractions
    const phases = [];
    for (let i = 0; i < ferriteCells; i++) phases.push("ferrite");
    for (let i = 0; i < pearliteCells; i++) phases.push("pearlite");
    for (let i = 0; i < cementiteCells; i++) phases.push("cementite");
    for (let i = 0; i < martensiteCells; i++) phases.push("martensite");

    // Fill remaining cells with the dominant phase
    while (phases.length < totalCells) {
      if (ferrite >= pearlite && ferrite >= martensite) {
        phases.push("ferrite");
      } else if (pearlite >= ferrite && pearlite >= martensite) {
        phases.push("pearlite");
      } else {
        phases.push("martensite");
      }
    }

    // Fisher-Yates shuffle for random distribution
    for (let i = phases.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [phases[i], phases[j]] = [phases[j], phases[i]];
    }

    // Create 2D grid
    for (let row = 0; row < gridSize; row++) {
      const rowData = [];
      for (let col = 0; col < gridSize; col++) {
        const index = row * gridSize + col;
        rowData.push(phases[index]);
      }
      newGrid.push(rowData);
    }

    setGrid(newGrid);
  }, [prediction]);

  useEffect(() => {
    generateGrid();
  }, [generateGrid]);

  if (!prediction) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-[#F4F7FE] rounded-2xl">
        <p className="text-[#A3AED0]">Make a prediction to see microstructure visualization</p>
      </div>
    );
  }

  // Get active phases (>0.5%)
  const activePhases = [
    { name: "Ferrite", value: prediction.ferrite_fraction, color: phaseColors.ferrite },
    { name: "Pearlite", value: prediction.pearlite_fraction, color: phaseColors.pearlite },
    { name: "Cementite", value: prediction.cementite_fraction, color: phaseColors.cementite },
    { name: "Martensite", value: prediction.martensite_fraction, color: phaseColors.martensite },
  ].filter(p => p.value > 0.5);

  return (
    <div className="space-y-4" data-testid="microstructure-visualization">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#2B3674]">Microstructure Visualization</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={generateGrid}
          className="flex items-center gap-2 bg-white hover:bg-[#F4F7FE] border-[#E0E5F2] text-[#2B3674]"
          data-testid="generate-new-btn"
        >
          <RefreshCw className="w-4 h-4" />
          Generate New
        </Button>
      </div>

      {/* Grid Container */}
      <div className="bg-[#1B2559] rounded-2xl p-3 shadow-lg">
        <div 
          className="grid gap-[1px]"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            aspectRatio: '1'
          }}
        >
          {grid.flat().map((phase, index) => (
            <div
              key={index}
              className="aspect-square transition-colors"
              style={{ backgroundColor: phaseColors[phase] }}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
        {activePhases.map((phase) => (
          <div key={phase.name} className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-md shadow-sm"
              style={{ backgroundColor: phase.color }}
            />
            <div>
              <p className="font-semibold text-[#2B3674]">{phase.name}</p>
              <p className="text-sm text-[#A3AED0]">{phase.value.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
