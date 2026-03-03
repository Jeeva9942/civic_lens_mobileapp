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
      className={`bg-card rounded-3xl p-5 border border-border shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5' : ''} transition-all relative overflow-hidden group`}
    >
      <div className="flex items-start gap-4">
        {/* Left Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cat.bg} ${cat.color} shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Center Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-foreground truncate leading-tight">{t(category)}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{description || 'No description provided'}</p>
            </div>

            {/* Badges Stack */}
            <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-bold h-6 border-0 ${statusStyles[status] || statusStyles.open}`}>
                {t(status)}
              </Badge>
              {aiTiming && (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 border-0 text-[10px] font-bold h-6 flex items-center gap-1 px-2.5">
                  <Clock className="w-3 h-3" />
                  {aiTiming}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-dashed border-border/50">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground max-w-[150px]">
              <MapPin className="w-3.5 h-3.5 text-primary/60" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary/60" />
              <span>{time}</span>
            </div>
            <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ml-auto border-0 font-bold tracking-tight ${severityStyles[severity]}`}>
              {t(severity).toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;

