import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Filter, Flame, MapPin, Loader2, X, Calendar, AlertTriangle, Droplets, Lightbulb, TreePine, Construction, Waves, Route, Building2, MessageSquare, Info, History, Clock } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { categories, type CategoryKey } from "@/components/CategoryIcon";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/context/TranslationContext";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const categoryKeys: CategoryKey[] = [
  "pothole", "drainage", "streetlight", "vegetation",
  "construction", "flooding", "encroachment", "sewage",
];

const severityColors: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const getCategoryIconSvg = (category: CategoryKey) => {
  switch (category) {
    case "pothole": return `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`;
    case "drainage": return `<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>`;
    case "streetlight": return `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="m6.34 17.66-1.41 1.41"/>`;
    case "vegetation": return `<path d="M12 2L3 9h18L12 2z"/><path d="M12 2v16"/><path d="M12 18H8m4 0h4"/><path d="M12 9L9 12h6l-3-3z"/>`;
    case "construction": return `<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/>`;
    case "flooding": return `<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>`;
    case "encroachment": return `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`;
    case "sewage": return `<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>`;
    default: return `<circle cx="12" cy="12" r="10"/>`;
  }
};

const createCategoryIcon = (category: CategoryKey, severity: string) => {
  const color = severityColors[severity] || "#3b82f6";
  const iconSvg = getCategoryIconSvg(category);

  return L.divIcon({
    className: "custom-marker",
    html: `<div class="marker-pin" style="background:${color};">
      <div class="marker-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${iconSvg}
        </svg>
      </div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

const SatelliteToggle = ({ satellite }: { satellite: boolean }) => {
  const map = useMap();
  useEffect(() => {
    // Force re-render if needed
  }, [satellite, map]);
  return null;
};

const MapPage = () => {
  const { t } = useTranslation();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [filterCategory, setFilterCategory] = useState<CategoryKey | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [aiTiming, setAiTiming] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/civic');
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();

        const transformedData = data.map((item: any) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lng);
          return {
            ...item,
            lat: isNaN(lat) ? 12.9716 : lat,
            lng: isNaN(lng) ? 77.5946 : lng,
            time: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'
          };
        });

        setReports(transformedData);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    if (!selectedIssue) {
      setAiTiming(null);
      return;
    }

    const fetchAiTiming = async () => {
      setAiLoading(true);
      try {
        const prompt = `Analyze this civic issue description: "${selectedIssue.description}" (Category: ${selectedIssue.category}). 
                Based on its severity (${selectedIssue.severity}), provide a brief approximate resolution timeline (e.g., 'Estimated resolution: 3-5 business days'). 
                Mention a one-sentence reason based on typical maintenance cycles.`;

        const response = await fetch("http://localhost:5000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt, sessionId: "map_estimation" }),
        });

        if (response.ok) {
          const data = await response.json();
          setAiTiming(data.output.trim());
        }
      } catch (err) {
        console.error("Map AI Timing Error:", err);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAiTiming();
  }, [selectedIssue]);

  const filteredIssues = useMemo(() => {
    return filterCategory
      ? reports.filter((i) => i.category === filterCategory)
      : reports;
  }, [reports, filterCategory]);

  const center = useMemo<[number, number]>(() => {
    if (reports.length > 0) {
      return [reports[0].lat, reports[0].lng];
    }
    return [12.9716, 77.5946];
  }, [reports]);

  return (
    <div className="pb-24 min-h-screen bg-background">
      {/* Header */}
      <div className="civic-gradient px-5 pt-12 pb-5 flex justify-between items-start">
        <div>
          <h1 className="text-lg font-bold text-primary-foreground">{t('geo_intel')}</h1>
          <p className="text-primary-foreground/70 text-sm">Real-time civic status mapping</p>
        </div>
        <LanguageSelector />
      </div>

      {/* Leaflet Map */}
      <div className="relative mx-4 -mt-3 rounded-2xl overflow-hidden border border-border shadow-lg h-[400px]">
        {loading ? (
          <div className="w-full h-full bg-secondary/20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Loading interactive map...</p>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
            style={{ borderRadius: "1rem" }}
          >
            {satellite ? (
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}

            <SatelliteToggle satellite={satellite} />

            {filteredIssues.map((issue) => (
              <Marker
                key={issue.id || issue._id}
                position={[issue.lat, issue.lng]}
                icon={createCategoryIcon(issue.category as CategoryKey, issue.severity)}
                eventHandlers={{
                  click: () => setSelectedIssue(issue),
                }}
              >
                <Popup>
                  <div className="text-xs min-w-[160px] p-1">
                    <p className="font-bold text-sm mb-1">{categories[issue.category as CategoryKey]?.label || 'Other'}</p>
                    <p className="text-muted-foreground mb-2 line-clamp-2">{issue.description}</p>
                    <button
                      onClick={() => setSelectedIssue(issue)}
                      className="w-full bg-primary text-primary-foreground text-[10px] py-1.5 rounded-md font-bold"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Heatmap overlay mockup */}
        {showHeatmap && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute w-40 h-40 rounded-full bg-destructive/30 blur-[80px] top-1/4 left-1/4" />
            <div className="absolute w-48 h-48 rounded-full bg-warning/25 blur-[90px] top-1/2 right-1/4" />
            <div className="absolute w-36 h-36 rounded-full bg-destructive/20 blur-[70px] bottom-1/4 left-1/3" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 px-5 mt-4">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${showHeatmap ? "civic-gradient text-primary-foreground civic-glow" : "bg-card text-foreground border border-border"
            }`}
        >
          <Flame className="w-4 h-4" />
          Heatmap
        </button>
        <button
          onClick={() => setSatellite(!satellite)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${satellite ? "civic-gradient text-primary-foreground civic-glow" : "bg-card text-foreground border border-border"
            }`}
        >
          <Layers className="w-4 h-4" />
          Satellite
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${showFilters ? "civic-gradient text-primary-foreground" : "bg-card text-foreground border border-border"
            }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="px-5 mt-4 overflow-hidden"
        >
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={`cursor-pointer h-8 px-4 rounded-lg ${!filterCategory ? "civic-gradient text-primary-foreground border-0" : "bg-card"}`}
              onClick={() => setFilterCategory(null)}
            >
              All Issues
            </Badge>
            {categoryKeys.map((key) => (
              <Badge
                key={key}
                variant="outline"
                className={`cursor-pointer h-8 px-4 rounded-lg flex gap-2 items-center ${filterCategory === key ? "civic-gradient text-primary-foreground border-0" : "bg-card"}`}
                onClick={() => setFilterCategory(key)}
              >
                {categories[key].label}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info summary */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-sm font-bold text-foreground">Active Reports</h2>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {filteredIssues.length} points
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {filteredIssues.slice(0, 5).map((issue) => {
            const cat = categories[issue.category as CategoryKey] || categories.pothole;
            const Icon = cat.icon;
            return (
              <motion.div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.bg} ${cat.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{issue.description}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {issue.location}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[9px] font-bold ${issue.status === 'Resolved' ? 'bg-success/5 text-success border-success/20' :
                  issue.status === 'In Progress' ? 'bg-primary/5 text-primary border-primary/20' : 'bg-warning/5 text-warning border-warning/20'
                  }`}>
                  {issue.status}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Issue Detail Sheet */}
      <Sheet open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-[32px] border-t-0 p-0 overflow-hidden">
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

              <div className="flex-1 overflow-hidden flex flex-col p-6">
                <Tabs defaultValue="details" className="flex-1 flex flex-col">
                  <TabsList className="grid grid-cols-3 w-full mb-6 bg-secondary/30 h-11 p-1 rounded-xl">
                    <TabsTrigger value="details" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Info className="w-3.5 h-3.5 mr-1.5" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <History className="w-3.5 h-3.5 mr-1.5" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                      Feed
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-y-auto pr-1">
                    <TabsContent value="details" className="mt-0 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Severity</p>
                            <p className="text-sm font-bold mt-0.5" style={{ color: severityColors[selectedIssue.severity] || '#f59e0b' }}>
                              {selectedIssue.severity?.toUpperCase()}
                            </p>
                          </div>
                          <div className="w-px h-6 bg-border" />
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Status</p>
                            <p className="text-sm font-bold mt-0.5 text-primary">{selectedIssue.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs font-medium">{selectedIssue.time}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedIssue.description}
                        </p>
                      </div>

                      <div className="bg-secondary/20 rounded-2xl p-4 border border-border">
                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          Geo-Location
                        </h3>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Lat: {selectedIssue.lat.toFixed(6)}</span>
                          <span>Lng: {selectedIssue.lng.toFixed(6)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 italic">
                          Verified civic report from Bangalore Municipal jurisdiction.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="timeline" className="mt-0">
                      <div className="space-y-4">
                        {[
                          { status: "Reported", time: selectedIssue.time, active: true, done: true },
                          { status: "Under Review", time: "Pending", active: selectedIssue.status === 'Reported', done: selectedIssue.status !== 'Reported' },
                          { status: "Assigned", time: "Pending", active: selectedIssue.status === 'In Progress' || selectedIssue.status === 'in-progress', done: selectedIssue.status === 'Resolved' || selectedIssue.status === 'resolved' },
                          { status: "Resolved", time: "Pending", active: selectedIssue.status === 'Resolved' || selectedIssue.status === 'resolved', done: selectedIssue.status === 'Resolved' || selectedIssue.status === 'resolved' }
                        ].map((step, idx) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full mt-1.5 ${step.done ? 'bg-success' : step.active ? 'bg-primary ring-2 ring-primary/20' : 'bg-muted'}`} />
                              {idx < 3 && <div className={`w-0.5 h-12 ${step.done ? 'bg-success' : 'bg-muted'} my-1`} />}
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${step.done || step.active ? 'text-foreground' : 'text-muted-foreground'}`}>{step.status}</p>
                              <p className="text-[10px] text-muted-foreground">{step.time}</p>
                            </div>
                          </div>
                        ))}

                        {/* AI Timing Estimation Section */}
                        <div className="mt-6 pt-4 border-t border-dashed">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <Clock className="w-3 h-3 text-primary" />
                            </div>
                            <h4 className="text-[10px] font-bold text-foreground">AI Resolution Insight</h4>
                          </div>

                          {aiLoading ? (
                            <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-xl animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                              <p className="text-[9px] text-muted-foreground">Analyzing resolution window...</p>
                            </div>
                          ) : aiTiming && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-3 bg-primary/5 rounded-xl border border-primary/10"
                            >
                              <p className="text-xs font-bold text-primary">{aiTiming}</p>
                              <p className="text-[9px] text-muted-foreground mt-1">Based on local maintenance benchmarks.</p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="comments" className="mt-0">
                      <div className="text-center py-12 bg-secondary/10 rounded-2xl border border-dashed border-border">
                        <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                        <p className="text-sm text-muted-foreground font-medium">No community notes yet.</p>
                      </div>
                    </TabsContent>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <button className="w-full civic-gradient text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]">
                      Track Progress
                    </button>
                  </div>
                </Tabs>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MapPage;


