import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Beaker, FlaskConical, Thermometer, Clock, Gauge, History, Trash2, Info, User, Settings, BarChart3, Home, Layers, Zap, ChevronDown } from "lucide-react";
import { ChemicalCompositionForm } from "@/components/ChemicalCompositionForm";
import { ProcessingParametersForm } from "@/components/ProcessingParametersForm";
import { PredictionResults } from "@/components/PredictionResults";
import { PhaseChart } from "@/components/PhaseChart";
import { PredictionHistory } from "@/components/PredictionHistory";
import { RegimeInfo } from "@/components/RegimeInfo";
import { MicrostructureVisualization } from "@/components/MicrostructureVisualization";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [formData, setFormData] = useState({
    carbon_content: 0.45,
    manganese_content: 0.65,
    silicon_content: 0.25,
    austenitizing_temp: 850,
    holding_time: 30,
    cooling_rate: 10,
    heat_treatment: "normalizing"
  });
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRegimeInfo, setShowRegimeInfo] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/predictions`);
      setHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/predict`, formData);
      setPrediction(response.data);
      fetchHistory();
      toast.success("Prediction completed successfully!");
    } catch (error) {
      console.error("Prediction failed:", error);
      const message = error.response?.data?.detail || "Prediction failed. Please check your inputs.";
      toast.error(message);
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

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "predictions", label: "Predictions", icon: BarChart3 },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex">
      {/* Sidebar */}
      <aside className="w-[280px] p-5 hidden lg:block">
        <div className="sidebar h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#868CFF] to-[#4318FF] flex items-center justify-center">
              <Beaker className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#2B3674]" data-testid="app-title">Steel AI</h1>
              <p className="text-xs text-[#A3AED0]">Microstructure Lab</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`sidebar-item w-full flex items-center gap-3 text-left ${activeNav === item.id ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Stats Card */}
          <div className="mt-auto pt-10">
            <div className="bg-gradient-to-br from-[#868CFF] to-[#4318FF] rounded-2xl p-5 text-white">
              <Layers className="w-8 h-8 mb-3 opacity-80" />
              <p className="font-semibold mb-1">Total Predictions</p>
              <p className="text-3xl font-bold">{history.length}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 lg:p-8 overflow-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#2B3674]">Welcome to Steel Microstructure AI</h1>
            <p className="text-[#A3AED0]">Predict microstructure and mechanical properties of carbon steels</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <div className="w-2 h-2 rounded-full bg-[#05CD99] animate-pulse"></div>
              <span className="text-sm font-medium text-[#2B3674]">Models Active</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#868CFF] to-[#4318FF] flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="stat-card">
            <p className="text-[#A3AED0] text-sm font-medium mb-1">Last Regime</p>
            <p className="text-2xl font-bold text-[#2B3674]" data-testid="last-regime">
              {prediction?.regime || "—"}
            </p>
          </div>
          <div className="stat-card purple">
            <p className="text-white/80 text-sm font-medium mb-1">Yield Strength</p>
            <p className="text-2xl font-bold" data-testid="stat-yield">
              {prediction?.yield_strength?.toFixed(0) || "—"} <span className="text-sm font-normal">MPa</span>
            </p>
          </div>
          <div className="stat-card teal">
            <p className="text-white/80 text-sm font-medium mb-1">Hardness</p>
            <p className="text-2xl font-bold" data-testid="stat-hardness">
              {prediction?.hardness?.toFixed(0) || "—"} <span className="text-sm font-normal">HV</span>
            </p>
          </div>
          <div className="stat-card coral">
            <p className="text-white/80 text-sm font-medium mb-1">Elongation</p>
            <p className="text-2xl font-bold" data-testid="stat-elongation">
              {prediction?.elongation?.toFixed(1) || "—"} <span className="text-sm font-normal">%</span>
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Input Forms */}
          <div className="xl:col-span-1 space-y-6">
            {/* Chemical Composition Card */}
            <div className="dashboard-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#F4F7FE] flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-[#4318FF]" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#2B3674]">Chemical Composition</h2>
                  <p className="text-xs text-[#A3AED0]">Steel alloy elements</p>
                </div>
              </div>
              <ChemicalCompositionForm formData={formData} setFormData={setFormData} />
            </div>

            {/* Processing Parameters Card */}
            <div className="dashboard-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#F4F7FE] flex items-center justify-center">
                  <Thermometer className="w-5 h-5 text-[#05CD99]" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#2B3674]">Processing Parameters</h2>
                  <p className="text-xs text-[#A3AED0]">Heat treatment settings</p>
                </div>
              </div>
              <ProcessingParametersForm 
                formData={formData} 
                setFormData={setFormData}
                onPredict={handlePredict}
                loading={loading}
              />
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="xl:col-span-2 space-y-6">
            {/* Prediction Results Card */}
            <div className="dashboard-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F7FE] flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-[#7551FF]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#2B3674]">Prediction Results</h2>
                    <p className="text-xs text-[#A3AED0]">Microstructure & mechanical properties</p>
                  </div>
                </div>
                {prediction && (
                  <button
                    onClick={() => setShowRegimeInfo(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#4318FF] bg-[#F4F7FE] rounded-xl hover:bg-[#E9EDF7] transition-colors"
                    data-testid="regime-info-btn"
                  >
                    <Info className="w-4 h-4" />
                    Regime Info
                  </button>
                )}
              </div>
              <PredictionResults prediction={prediction} />
            </div>

            {/* Phase Distribution Chart */}
            {prediction && (
              <div className="dashboard-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F7FE] flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#FFB547]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#2B3674]">Phase Distribution</h2>
                    <p className="text-xs text-[#A3AED0]">Visual analysis of microstructure</p>
                  </div>
                </div>
                <PhaseChart prediction={prediction} />
              </div>
            )}
          </div>
        </div>

        {/* Prediction History */}
        <div className="dashboard-card p-6 mt-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4F7FE] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#4318FF]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#2B3674]">Prediction History</h2>
                <p className="text-xs text-[#A3AED0]">Recent predictions and results</p>
              </div>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#EE5D50] bg-[#FFF5F5] rounded-xl hover:bg-[#FFEBEB] transition-colors"
                data-testid="clear-history-btn"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
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
