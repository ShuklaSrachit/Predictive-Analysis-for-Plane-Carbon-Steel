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
    <ScrollArea className="h-[350px]" data-testid="prediction-history">
      <Table className="industrial-table">
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-slate-500 font-mono text-[10px]">Time</TableHead>
            <TableHead className="text-slate-500 font-mono text-[10px]">C%</TableHead>
            <TableHead className="text-slate-500 font-mono text-[10px]">Regime</TableHead>
            <TableHead className="text-slate-500 font-mono text-[10px]">Grain</TableHead>
            <TableHead className="text-slate-500 font-mono text-[10px]">YS (MPa)</TableHead>
            <TableHead className="text-slate-500 font-mono text-[10px]">TS (MPa)</TableHead>
            <TableHead className="text-slate-500 font-mono text-[10px]">HV</TableHead>
            <TableHead className="text-slate-500 font-mono text-[10px]">Treatment</TableHead>
            <TableHead className="text-slate-500 font-mono text-[10px] w-16">Actions</TableHead>
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
              <TableCell className="font-mono text-[10px] text-slate-400">
                {formatDate(prediction.timestamp)}
              </TableCell>
              <TableCell className="font-mono text-xs text-white">
                {prediction.carbon_content.toFixed(2)}%
              </TableCell>
              <TableCell>
                <span className={`regime-badge text-[8px] px-1.5 py-0.5 ${getRegimeBadgeClass(prediction.regime)}`}>
                  {prediction.regime}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs text-[#60A5FA]">
                {prediction.grain_size_astm.toFixed(1)}
              </TableCell>
              <TableCell className="font-mono text-xs text-[#F59E0B]">
                {prediction.yield_strength?.toFixed(0) || '—'}
              </TableCell>
              <TableCell className="font-mono text-xs text-[#EF4444]">
                {prediction.tensile_strength?.toFixed(0) || '—'}
              </TableCell>
              <TableCell className="font-mono text-xs text-[#A855F7]">
                {prediction.hardness?.toFixed(0) || '—'}
              </TableCell>
              <TableCell className="font-mono text-[10px] text-slate-400 capitalize">
                {prediction.heat_treatment}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(prediction);
                    }}
                    className="p-1 text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                    title="View details"
                    data-testid={`view-btn-${index}`}
                  >
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(prediction.id);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                    data-testid={`delete-btn-${index}`}
                  >
                    <Trash2 className="w-3 h-3" />
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
