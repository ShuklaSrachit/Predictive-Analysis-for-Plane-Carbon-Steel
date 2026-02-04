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
      case "Hypoeutectoid": return "#4318FF";
      case "Eutectoid": return "#05CD99";
      case "Hypereutectoid": return "#FFB547";
      case "Cementite-Dominant": return "#EE5D50";
      default: return "#4318FF";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white border-[#E0E5F2] rounded-3xl max-w-lg" data-testid="regime-info-modal">
        <DialogHeader>
          <DialogTitle className="text-[#2B3674] flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-md"
              style={{ backgroundColor: getRegimeColor(regime) }}
            ></div>
            {regime} Steel
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#4318FF]" />
          </div>
        ) : info ? (
          <div className="space-y-4">
            <div className="bg-[#F4F7FE] rounded-xl p-4">
              <p className="text-xs font-medium text-[#A3AED0] mb-1">Carbon Range</p>
              <p className="font-semibold text-[#2B3674]">{info.carbon_range}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#A3AED0] mb-1">Description</p>
              <p className="text-sm text-[#2B3674] leading-relaxed">{info.description}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#A3AED0] mb-1">Phase Distribution</p>
              <p className="text-sm text-[#2B3674]">{info.phase_distribution}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#A3AED0] mb-1">Properties</p>
              <p className="text-sm text-[#2B3674]">{info.properties}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#A3AED0] mb-1">Applications</p>
              <p className="text-sm text-[#2B3674]">{info.applications}</p>
            </div>

            <div className="bg-[#F4F7FE] rounded-xl p-4">
              <p className="text-xs font-medium text-[#A3AED0] mb-1">Heat Treatment Response</p>
              <p className="text-sm text-[#2B3674]">{info.heat_treatment_response}</p>
            </div>
          </div>
        ) : (
          <p className="text-[#A3AED0] text-center py-8">
            Failed to load regime information
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
