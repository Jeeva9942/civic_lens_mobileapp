import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileWarning, CheckCircle2, Clock, AlertCircle, Loader2, X, Calendar, MapPin, Zap, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import CategoryIcon, { type CategoryKey, categories } from "@/components/CategoryIcon";
import IssueCard from "@/components/IssueCard";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import LanguageSelector from "@/components/LanguageSelector";
import NotificationBell from "@/components/NotificationBell";
import { useTranslation } from "@/context/TranslationContext";

const categoryKeys: CategoryKey[] = [
  "pothole", "drainage", "streetlight", "vegetation",
  "construction", "flooding", "encroachment", "sewage",
];

const severityColors: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/civic');
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const openCount = reports.filter((i) => i.status === "open" || i.status === "Reported").length;
  const resolvedCount = reports.filter((i) => i.status === "resolved" || i.status === "Resolved").length;
  const inProgressCount = reports.filter((i) => i.status === "in-progress" || i.status === "In Progress").length;

  return (
    <div className="pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="civic-gradient px-5 pt-12 pb-20 flex justify-between items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 min-w-0 pr-4"
          >
            <p className="text-primary-foreground/70 text-sm font-medium">{t('welcome')} 👋</p>
            <h1 className="text-2xl font-bold text-primary-foreground mt-1 truncate">
              {t('hero_title')}
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-2 max-w-xs line-clamp-2">
              {t('hero_desc')}
            </p>
            <Button
              onClick={() => navigate("/report")}
              className="mt-5 bg-card text-primary font-semibold hover:bg-card/90 shadow-lg rounded-xl h-12 px-6"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              {t('report_issue')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => navigate("/profile")}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
            >
              <User className="w-5 h-5" />
            </button>
            <NotificationBell />
            <LanguageSelector />
          </div>

          <div className="absolute right-4 bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Stats overlay */}
        <div className="px-4 -mt-10 relative z-10">
          <div className="flex gap-2">
            <StatCard icon={FileWarning} label="Open" value={openCount} variant="warning" />
            <StatCard icon={Clock} label="In Progress" value={inProgressCount} variant="primary" />
            <StatCard icon={CheckCircle2} label="Resolved" value={resolvedCount} variant="success" />
          </div>
        </div>
      </div>

      {/* AI Smart Audit Link */}
      <div className="px-5 mt-8">
        <motion.div
          className="bg-indigo-600 rounded-[32px] p-5 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <Badge className="mb-2 bg-white/20 border-0 text-[10px] uppercase tracking-widest font-bold">New Technology</Badge>
              <h3 className="text-xl font-bold">AI Smart Audit</h3>
              <p className="text-indigo-100 text-xs mt-1 max-w-[180px]">Instant object detection & civic analysis powered by Edge AI.</p>
            </div>
            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
              <Zap className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
          {/* Abstract circles */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -left-2 top-0 w-16 h-16 bg-white/10 rounded-full blur-xl" />
        </motion.div>
      </div>

      {/* Categories */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground">Categories</h2>
          <button
            onClick={() => navigate("/report")}
            className="text-xs text-primary font-semibold"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {categoryKeys.map((key) => (
            <CategoryIcon
              key={key}
              category={key}
              size="sm"
              onClick={() => navigate("/report")}
            />
          ))}
        </div>
      </div>

      {/* Nearby Issues */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground">{t('recent_reports')}</h2>
          <button
            onClick={() => navigate("/map")}
            className="text-xs text-primary font-semibold"
          >
            {t('view_map')}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-xs">Loading local reports...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.length > 0 ? (
              reports.slice(0, 5).map((issue, idx) => (
                <motion.div
                  key={issue.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <IssueCard {...issue}
                    category={issue.category || 'pothole'}
                    description={issue.description || 'No description'}
                    location={issue.location || 'Unknown location'}
                    status={issue.status || 'Reported'}
                    severity={issue.severity || 'medium'}
                    time={issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Today'}
                    onClick={() => setSelectedIssue(issue)}
                  />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 bg-card rounded-2xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No reports found yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Issue Detail Sheet */}
      <Sheet open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-[32px] border-t-0 p-0 overflow-hidden">
          {selectedIssue && (
            <div className="flex flex-col h-full bg-background">
              <div className="relative h-64 shrink-0">
                <img
                  src={selectedIssue.image || "https://images.unsplash.com/photo-1590082223291-0ac3767cc70a?w=800&auto=format&fit=crop&q=60"}
                  className="w-full h-full object-cover"
                  alt="Issue"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute bottom-6 left-6">
                  <Badge className="mb-2 civic-gradient border-0 text-xs py-1 px-3">
                    {categories[selectedIssue.category as CategoryKey]?.label || 'Civic Issue'}
                  </Badge>
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {selectedIssue.location}
                  </h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Severity</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: severityColors[selectedIssue.severity] || '#f59e0b' }}>
                        {(selectedIssue.severity || 'medium').toUpperCase()}
                      </p>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Status</p>
                      <p className="text-sm font-bold mt-0.5 text-primary">{selectedIssue.status || 'Reported'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {selectedIssue.createdAt ? new Date(selectedIssue.createdAt).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {selectedIssue.description}
                </p>

                <div className="bg-secondary/20 rounded-2xl p-5 border border-border">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Location Details
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This issue has been verified by the community and is currently being processed by the local municipality.
                  </p>
                </div>

                <div className="mt-8 mb-4">
                  <button className="w-full civic-gradient text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20">
                    Track Progress
                  </button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};


export default HomePage;

