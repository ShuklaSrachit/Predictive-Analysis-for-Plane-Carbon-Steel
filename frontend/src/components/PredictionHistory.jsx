import { Trash2, ArrowUpRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const PredictionHistory = ({ history, onDelete, onSelect }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8" data-testid="no-history">
        <p className="font-mono text-sm text-slate-500">No predictions yet</p>
        <p className="text-xs text-slate-600 mt-1">
          Your prediction history will appear here
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollArea className="h-[400px]" data-testid="prediction-history">
      <Table className="industrial-table">
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-slate-500 font-mono">Time</TableHead>
            <TableHead className="text-slate-500 font-mono">C%</TableHead>
            <TableHead className="text-slate-500 font-mono">Regime</TableHead>
            <TableHead className="text-slate-500 font-mono">Grain Size</TableHead>
            <TableHead className="text-slate-500 font-mono">Ferrite</TableHead>
            <TableHead className="text-slate-500 font-mono">Pearlite</TableHead>
            <TableHead className="text-slate-500 font-mono">Treatment</TableHead>
            <TableHead className="text-slate-500 font-mono w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((prediction, index) => (
            <TableRow
              key={prediction.id}
              className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
              onClick={() => onSelect(prediction)}
              data-testid={`history-row-${index}`}
            >
              <TableCell className="font-mono text-xs text-slate-400">
                {formatDate(prediction.timestamp)}
              </TableCell>
              <TableCell className="font-mono text-sm text-white">
                {prediction.carbon_content.toFixed(2)}%
              </TableCell>
              <TableCell>
                <span className={`regime-badge text-[10px] ${getRegimeBadgeClass(prediction.regime)}`}>
                  {prediction.regime}
                </span>
              </TableCell>
              <TableCell className="font-mono text-sm text-[#60A5FA]">
                {prediction.grain_size_astm.toFixed(1)}
              </TableCell>
              <TableCell className="font-mono text-sm text-[#007AFF]">
                {prediction.ferrite_fraction.toFixed(1)}%
              </TableCell>
              <TableCell className="font-mono text-sm text-[#10B981]">
                {prediction.pearlite_fraction.toFixed(1)}%
              </TableCell>
              <TableCell className="font-mono text-xs text-slate-400 capitalize">
                {prediction.heat_treatment}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(prediction);
                    }}
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                    title="View details"
                    data-testid={`view-btn-${index}`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(prediction.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                    data-testid={`delete-btn-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
