import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Beaker, Thermometer, Clock, Gauge, Flame, History, Trash2, Info } from "lucide-react";
import { PredictionForm } from "@/components/PredictionForm";
import { PredictionResults } from "@/components/PredictionResults";
import { PhaseDiagram } from "@/components/PhaseDiagram";
import { PhaseChart } from "@/components/PhaseChart";
import { PredictionHistory } from "@/components/PredictionHistory";
import { RegimeInfo } from "@/components/RegimeInfo";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phaseDiagramData, setPhaseDiagramData] = useState(null);
  const [showRegimeInfo, setShowRegimeInfo] = useState(false);

  useEffect(() => {
    fetchHistory();
    fetchPhaseDiagramData();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/predictions`);
      setHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const fetchPhaseDiagramData = async () => {
    try {
      const response = await axios.get(`${API}/phase-diagram-data`);
      setPhaseDiagramData(response.data);
    } catch (error) {
      console.error("Failed to fetch phase diagram data:", error);
    }
  };

  const handlePredict = async (formData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/predict`, formData);
      setPrediction(response.data);
      fetchHistory();
      toast.success("Prediction completed successfully!");
    } catch (error) {
      console.error("Prediction failed:", error);
      toast.error("Prediction failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrediction = async (id) => {
    try {
      await axios.delete(`${API}/predictions/${id}`);
      fetchHistory();
      toast.success("Prediction deleted");
    } catch (error) {
      toast.error("Failed to delete prediction");
    }
  };

  const handleClearHistory = async () => {
    try {
      await axios.delete(`${API}/predictions`);
      setHistory([]);
      toast.success("History cleared");
    } catch (error) {
      toast.error("Failed to clear history");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] grid-pattern">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#111111]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#007AFF] flex items-center justify-center glow-blue">
                <Beaker className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-mono text-xl font-bold text-white tracking-tight" data-testid="app-title">
                  STEEL MICROSTRUCTURE AI
                </h1>
                <p className="text-xs text-slate-500 font-mono tracking-wider">
                  HYBRID ML PREDICTION FRAMEWORK
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-black/50">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-mono text-slate-400">MODELS ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form - Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="industrial-card p-6 corner-accent animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-6">
                <Flame className="w-5 h-5 text-[#FF3B30]" />
                <h2 className="font-mono text-lg font-semibold text-white tracking-wide">
                  INPUT PARAMETERS
                </h2>
              </div>
              <PredictionForm onSubmit={handlePredict} loading={loading} />
            </div>

            {/* Quick Stats */}
            <div className="industrial-card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-4">
                <History className="w-5 h-5 text-[#007AFF]" />
                <h3 className="font-mono text-sm font-semibold text-white tracking-wide">
                  SESSION STATS
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="data-label">Total Predictions</p>
                  <p className="data-value" data-testid="total-predictions">{history.length}</p>
                </div>
                <div>
                  <p className="data-label">Last Regime</p>
                  <p className="text-sm font-mono text-slate-300" data-testid="last-regime">
                    {prediction?.regime || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results and Charts - Right Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prediction Results */}
            <div className="industrial-card p-6 corner-accent animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-[#10B981]" />
                  <h2 className="font-mono text-lg font-semibold text-white tracking-wide">
                    PREDICTION RESULTS
                  </h2>
                </div>
                {prediction && (
                  <button
                    onClick={() => setShowRegimeInfo(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-white border border-white/10 hover:border-white/30 transition-all"
                    data-testid="regime-info-btn"
                  >
                    <Info className="w-4 h-4" />
                    REGIME INFO
                  </button>
                )}
              </div>
              <PredictionResults prediction={prediction} />
            </div>

            {/* Phase Distribution Chart */}
            {prediction && (
              <div className="industrial-card p-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#007AFF] to-[#FF3B30]" />
                  <h2 className="font-mono text-lg font-semibold text-white tracking-wide">
                    PHASE DISTRIBUTION
                  </h2>
                </div>
                <PhaseChart prediction={prediction} />
              </div>
            )}

            {/* Iron-Carbon Phase Diagram */}
            <div className="industrial-card p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3 mb-6">
                <Thermometer className="w-5 h-5 text-[#F59E0B]" />
                <h2 className="font-mono text-lg font-semibold text-white tracking-wide">
                  Fe-C PHASE DIAGRAM
                </h2>
              </div>
              <PhaseDiagram data={phaseDiagramData} currentCarbon={prediction?.carbon_content} />
            </div>
          </div>
        </div>

        {/* Prediction History - Full Width */}
        <div className="mt-6 industrial-card p-6 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#007AFF]" />
              <h2 className="font-mono text-lg font-semibold text-white tracking-wide">
                PREDICTION HISTORY
              </h2>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 transition-all"
                data-testid="clear-history-btn"
              >
                <Trash2 className="w-4 h-4" />
                CLEAR ALL
              </button>
            )}
          </div>
          <PredictionHistory 
            history={history} 
            onDelete={handleDeletePrediction}
            onSelect={(p) => setPrediction(p)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#111111]/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-mono text-slate-500">
              HYBRID ML FRAMEWORK • RANDOM FOREST + ANN • PHYSICS-GUIDED FEATURE ENGINEERING
            </p>
            <p className="text-xs font-mono text-slate-600">
              PLAIN CARBON STEEL RANGE: 0 – 2.1 WT% C
            </p>
          </div>
        </div>
      </footer>

      {/* Regime Info Modal */}
      {showRegimeInfo && prediction && (
        <RegimeInfo 
          regime={prediction.regime} 
          onClose={() => setShowRegimeInfo(false)} 
        />
      )}
    </div>
  );
}
