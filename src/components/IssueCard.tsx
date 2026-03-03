import { MapPin, Clock } from "lucide-react";
import { categories, type CategoryKey } from "./CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/context/TranslationContext";

interface IssueCardProps {
  id: string;
  category: CategoryKey;
  description: string;
  location: string;
  time: string;
  status: string;
  severity: "low" | "medium" | "high";
  aiTiming?: string;
  onClick?: () => void;
}

const statusStyles: Record<string, string> = {
  open: "bg-warning/10 text-warning border-warning/20",
  Reported: "bg-warning/10 text-warning border-warning/20",
  "in-progress": "bg-info/10 text-info border-info/20",
  "In Progress": "bg-info/10 text-info border-info/20",
  resolved: "bg-success/10 text-success border-success/20",
  Resolved: "bg-success/10 text-success border-success/20",
};

const severityStyles = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
};

const IssueCard = ({ category, description, location, time, status, severity, aiTiming, onClick }: IssueCardProps) => {
  const { t } = useTranslation();
  const cat = categories[category] || categories.pothole;
  const Icon = cat.icon;

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-2xl p-4 border border-border shadow-sm ${onClick ? 'cursor-pointer hover:border-primary/30' : ''} transition-all relative overflow-hidden`}
    >
      {/* AI Timing Overlay for Activity View */}
      {aiTiming && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary/10 text-primary text-[9px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-primary/20 flex items-center gap-1.5 backdrop-blur-sm animate-in fade-in slide-in-from-top-1 duration-500">
            <Clock className="w-2.5 h-2.5" />
            {aiTiming}
          </div>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.bg} ${cat.color} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm text-foreground truncate">{t(category)}</h3>
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${statusStyles[status] || statusStyles.open}`}>
              {t(status)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="w-3 h-3" /> {location}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" /> {time}
            </span>
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ml-auto border-0 ${severityStyles[severity]}`}>
              {t(severity)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;

