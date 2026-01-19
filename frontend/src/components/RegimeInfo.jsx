import { useState, useEffect } from "react";
import axios from "axios";
import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const RegimeInfo = ({ regime, onClose }) => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await axios.get(`${API}/regime-info/${regime}`);
        setInfo(response.data);
      } catch (error) {
        console.error("Failed to fetch regime info:", error);
      } finally {
        setLoading(false);
      }
    };

    if (regime) {
      fetchInfo();
    }
  }, [regime]);

  const getRegimeColor = (regime) => {
    switch (regime) {
      case "Hypoeutectoid": return "#3B82F6";
      case "Eutectoid": return "#10B981";
      case "Hypereutectoid": return "#F59E0B";
      case "Cementite-Dominant": return "#EF4444";
      default: return "#007AFF";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#111111] border-white/10 max-w-lg" data-testid="regime-info-modal">
        <DialogHeader>
          <DialogTitle className="font-mono text-white flex items-center gap-3">
            <div
              className="w-3 h-3"
              style={{ backgroundColor: getRegimeColor(regime) }}
            ></div>
            {regime} Steel
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#007AFF]" />
          </div>
        ) : info ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="data-label mb-1">Carbon Range</p>
              <p className="font-mono text-white">{info.carbon_range}</p>
            </div>

            <div>
              <p className="data-label mb-1">Description</p>
              <p className="text-slate-300 leading-relaxed">{info.description}</p>
            </div>

            <div>
              <p className="data-label mb-1">Phase Distribution</p>
              <p className="text-slate-300">{info.phase_distribution}</p>
            </div>

            <div>
              <p className="data-label mb-1">Properties</p>
              <p className="text-slate-300">{info.properties}</p>
            </div>

            <div>
              <p className="data-label mb-1">Applications</p>
              <p className="text-slate-300">{info.applications}</p>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">
            Failed to load regime information
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
