import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, AlertCircle, Loader2, Search, X, Calendar, MapPin, History, Info, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import IssueCard from "@/components/IssueCard";
import { categories, type CategoryKey } from "@/components/CategoryIcon";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/context/TranslationContext";

const severityColors: Record<string, string> = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#22c55e",
};

const ProgressPage = () => {
    const { t } = useTranslation();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [aiTimings, setAiTimings] = useState<Record<string, string>>({});
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [aiTiming, setAiTiming] = useState<string | null>(null);
    const [aiLoadingDetail, setAiLoadingDetail] = useState(false);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch('/api/civic');
                if (!response.ok) throw new Error('Failed to fetch reports');
                const data = await response.json();
                setReports(data || []);

                if (data && data.length > 0) {
                    fetchAiEstimates(data);
                }
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchAiEstimates = async (allReports: any[]) => {
            try {
                const activeOnes = allReports.filter(r => r.status !== 'Resolved' && r.status !== 'resolved').slice(0, 5);
                const estimates: Record<string, string> = {};

                for (const report of activeOnes) {
                    const prompt = `Analyze this civic issue description: "${report.description}" (Category: ${report.category}). 
                    Based on severity "${report.severity}", provide a tiny approximate resolution timeline (e.g., "Fix in 2d"). Only return the estimate.`;

                    const response = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: prompt, sessionId: "ai_progress_list_estimation" }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        estimates[report._id || report.id] = data.output.trim();
                    }
                }
                setAiTimings(estimates);
            } catch (err) {
                console.error("AI List Estimation Error:", err);
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
            setAiLoadingDetail(true);
            try {
                const prompt = `Analyze this civic issue description: "${selectedIssue.description}" (Category: ${selectedIssue.category}). 
                Based on severity "${selectedIssue.severity}", provide a tiny approximate resolution timeline (e.g., "Fix in 2d"). Only return the estimate.`;

                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: prompt, sessionId: "progress_estimation" }),
                });

                if (!response.ok) throw new Error("AI failed");
                const data = await response.json();
                setAiTiming(data.output || "Unable to estimate at this time.");
            } catch (err) {
                console.error("AI Timing Error:", err);
                setAiTiming("Estimation service temporarily unavailable.");
            } finally {
                setAiLoadingDetail(false);
            }
        };

        fetchAiTiming();
    }, [selectedIssue]);

    const filteredReports = reports.filter(report =>
        report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeReports = filteredReports.filter(r => r.status !== 'Resolved' && r.status !== 'resolved');
    const resolvedReports = filteredReports.filter(r => r.status === 'Resolved' || r.status === 'resolved');

    return (
        <div className="pb-24 min-h-screen bg-background">
            {/* Header */}
            <div className="civic-gradient px-5 pt-12 pb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-bold text-primary-foreground">{t('track_progress')}</h1>
                    <p className="text-primary-foreground/70 text-sm mt-1">Real-time status of civic fixes</p>
                </div>
                <LanguageSelector />
            </div>

            <div className="px-5 -mt-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={t('search_placeholder')}
                        className="pl-10 h-12 rounded-2xl border-none shadow-lg glass"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="px-5 mt-8">
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-secondary/50 rounded-xl p-1 h-11">
                        <TabsTrigger value="active" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            {t('active')} ({activeReports.length})
                        </TabsTrigger>
                        <TabsTrigger value="resolved" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            {t('resolved')} ({resolvedReports.length})
                        </TabsTrigger>
                    </TabsList>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
                            <p className="text-xs">Syncing with municipal database...</p>
                        </div>
                    ) : (
                        <>
                            <TabsContent value="active" className="mt-6 space-y-4">
                                {activeReports.length > 0 ? (
                                    activeReports.map((report, idx) => (
                                        <motion.div
                                            key={report.id || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <IssueCard
                                                {...report}
                                                category={report.category || 'pothole'}
                                                description={report.description || 'No description'}
                                                location={report.location || 'Unknown location'}
                                                status={report.status || 'Reported'}
                                                severity={report.severity || 'medium'}
                                                time={report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Today'}
                                                aiTiming={aiTimings[report._id || report.id]}
                                                onClick={() => setSelectedIssue(report)}
                                            />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border p-8">
                                        <CheckCircle2 className="w-10 h-10 text-success/30 mx-auto mb-3" />
                                        <h3 className="text-sm font-bold text-foreground">No active issues found</h3>
                                        <p className="text-xs text-muted-foreground mt-2">All filtered reports are resolved or none match your search.</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="resolved" className="mt-6 space-y-4">
                                {resolvedReports.length > 0 ? (
                                    resolvedReports.map((report, idx) => (
                                        <motion.div
                                            key={report.id || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <IssueCard
                                                {...report}
                                                category={report.category || 'pothole'}
                                                description={report.description || 'No description'}
                                                location={report.location || 'Unknown location'}
                                                status={report.status || 'Resolved'}
                                                severity={report.severity || 'medium'}
                                                time={report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Today'}
                                                onClick={() => setSelectedIssue(report)}
                                            />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border p-8">
                                        <AlertCircle className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                                        <h3 className="text-sm font-bold text-foreground">No resolved reports</h3>
                                        <p className="text-xs text-muted-foreground mt-2">Recently completed work will appear here.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </div>

            {/* Detail Tracking Sheet */}
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
                                        {t(selectedIssue.category) || 'Civic Issue'}
                                    </Badge>
                                    <h2 className="text-2xl font-bold text-white leading-tight">
                                        {selectedIssue.location}
                                    </h2>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col p-6">
                                <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
                                    <TabsList className="grid grid-cols-3 w-full mb-6 bg-secondary/30 h-11 p-1 rounded-xl">
                                        <TabsTrigger value="timeline" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <History className="w-3.5 h-3.5 mr-1.5" />
                                            {t('timeline')}
                                        </TabsTrigger>
                                        <TabsTrigger value="details" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <Info className="w-3.5 h-3.5 mr-1.5" />
                                            {t('details')}
                                        </TabsTrigger>
                                        <TabsTrigger value="activity" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                            Feed
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="flex-1 overflow-y-auto">
                                        <TabsContent value="timeline" className="mt-0">
                                            <div className="space-y-6">
                                                {[
                                                    { status: t("reported"), time: selectedIssue.createdAt ? new Date(selectedIssue.createdAt).toLocaleDateString() : 'Just now', active: true, done: true },
                                                    { status: t("verified_categorized"), time: "Pending", active: selectedIssue.status === 'Reported', done: selectedIssue.status !== 'Reported' },
                                                    { status: t("assigned"), time: "Pending", active: selectedIssue.status === 'In Progress' || selectedIssue.status === 'in-progress', done: selectedIssue.status === 'Resolved' || selectedIssue.status === 'resolved' },
                                                    { status: t("completed"), time: "Pending", active: selectedIssue.status === 'Resolved' || selectedIssue.status === 'resolved', done: selectedIssue.status === 'Resolved' || selectedIssue.status === 'resolved' }
                                                ].map((step, idx) => (
                                                    <div key={idx} className="flex gap-4 items-start">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-4 h-4 rounded-full mt-1.5 flex items-center justify-center ${step.done ? 'bg-success text-white' : step.active ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted'}`}>
                                                                {step.done && <CheckCircle2 className="w-2.5 h-2.5" />}
                                                            </div>
                                                            {idx < 3 && <div className={`w-0.5 h-14 ${step.done ? 'bg-success' : 'bg-muted'} my-1`} />}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-bold ${step.done || step.active ? 'text-foreground' : 'text-muted-foreground'}`}>{step.status}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                {step.done ? 'Timestamp: ' + step.time : step.active ? 'Currently at this stage' : 'Awaiting processing'}
                                                            </p>
                                                            {step.active && (
                                                                <div className="mt-2 text-[10px] bg-primary/5 text-primary py-1.5 px-3 rounded-lg border border-primary/10">
                                                                    This issue is our current priority.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* AI Timing Estimation Section */}
                                                <div className="mt-8 pt-6 border-t border-dashed">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Clock className="w-3.5 h-3.5 text-primary" />
                                                        </div>
                                                        <h4 className="text-xs font-bold text-foreground">AI Timeline Analysis</h4>
                                                    </div>

                                                    {aiLoadingDetail ? (
                                                        <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-2xl animate-pulse">
                                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                            <p className="text-[10px] text-muted-foreground">Calculating estimated resolution time...</p>
                                                        </div>
                                                    ) : aiTiming && (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="p-4 bg-primary/5 rounded-2xl border border-primary/10"
                                                        >
                                                            <p className="text-sm font-semibold text-primary">{aiTiming}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-1 underline decoration-primary/20 decoration-dotted">Based on typical civic maintenance cycles for this category and severity.</p>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="details" className="mt-0 space-y-6">
                                            <div className="bg-secondary/20 rounded-2xl p-5 border border-border">
                                                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <Info className="w-4 h-4 text-primary" />
                                                    Report Summary
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {selectedIssue.description}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">ID</p>
                                                    <p className="text-xs font-mono font-bold">#CC-{selectedIssue.id?.slice(-6).toUpperCase()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-right">Severity</p>
                                                    <p className="text-xs font-bold text-right" style={{ color: severityColors[selectedIssue.severity] || '#f59e0b' }}>
                                                        {selectedIssue.severity?.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="activity" className="mt-0">
                                            <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border px-6">
                                                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                                                <h3 className="text-sm font-bold text-foreground">Community Hub</h3>
                                                <p className="text-xs text-muted-foreground mt-2">Connect with neighbors and municipal workers about this specific issue.</p>
                                            </div>
                                        </TabsContent>
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

export default ProgressPage;
