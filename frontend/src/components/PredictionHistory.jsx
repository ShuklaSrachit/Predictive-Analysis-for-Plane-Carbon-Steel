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
      <div className="text-center py-12" data-testid="no-history">
        <p className="font-medium text-[#2B3674]">No predictions yet</p>
        <p className="text-sm text-[#A3AED0] mt-1">
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
      <Table className="light-table">
        <TableHeader>
          <TableRow className="border-[#E9EDF7] hover:bg-transparent">
            <TableHead className="text-[#A3AED0]">Time</TableHead>
            <TableHead className="text-[#A3AED0]">C%</TableHead>
            <TableHead className="text-[#A3AED0]">Regime</TableHead>
            <TableHead className="text-[#A3AED0]">Grain</TableHead>
            <TableHead className="text-[#A3AED0]">YS (MPa)</TableHead>
            <TableHead className="text-[#A3AED0]">TS (MPa)</TableHead>
            <TableHead className="text-[#A3AED0]">HV</TableHead>
            <TableHead className="text-[#A3AED0]">Treatment</TableHead>
            <TableHead className="text-[#A3AED0] w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((prediction, index) => (
            <TableRow
              key={prediction.id}
              className="border-[#E9EDF7] hover:bg-[#F4F7FE] cursor-pointer transition-colors"
              onClick={() => onSelect(prediction)}
              data-testid={`history-row-${index}`}
            >
              <TableCell className="text-sm text-[#A3AED0]">
                {formatDate(prediction.timestamp)}
              </TableCell>
              <TableCell className="font-mono text-sm font-medium text-[#2B3674]">
                {prediction.carbon_content.toFixed(2)}%
              </TableCell>
              <TableCell>
                <span className={`regime-badge text-[10px] ${getRegimeBadgeClass(prediction.regime)}`}>
                  {prediction.regime}
                </span>
              </TableCell>
              <TableCell className="font-mono text-sm font-medium text-[#4318FF]">
                {prediction.grain_size_astm.toFixed(1)}
              </TableCell>
              <TableCell className="font-mono text-sm text-[#7551FF]">
                {prediction.yield_strength?.toFixed(0) || '—'}
              </TableCell>
              <TableCell className="font-mono text-sm text-[#EE5D50]">
                {prediction.tensile_strength?.toFixed(0) || '—'}
              </TableCell>
              <TableCell className="font-mono text-sm text-[#868CFF]">
                {prediction.hardness?.toFixed(0) || '—'}
              </TableCell>
              <TableCell className="text-sm text-[#A3AED0] capitalize">
                {prediction.heat_treatment}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(prediction);
                    }}
                    className="p-2 text-[#A3AED0] hover:text-[#4318FF] hover:bg-[#F4F7FE] rounded-lg transition-colors"
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
                    className="p-2 text-[#A3AED0] hover:text-[#EE5D50] hover:bg-[#FFF5F5] rounded-lg transition-colors"
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
