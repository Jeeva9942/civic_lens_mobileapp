import { motion } from "framer-motion";
import { FileText, ThumbsUp, Eye } from "lucide-react";
import IssueCard from "@/components/IssueCard";
import { mockIssues } from "@/data/mockIssues";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useState, useEffect } from "react";

const ActivityPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/civic');
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        const transformedData = data.map((item: any) => ({
          ...item,
          time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
        }));
        setReports(transformedData);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const myReports = reports;
  const validated = reports.slice(2, 6);

  return (
    <div className="pb-24 min-h-screen bg-background">
      {/* Header */}
      <div className="civic-gradient px-5 pt-12 pb-5">
        <h1 className="text-lg font-bold text-primary-foreground">Activity</h1>
        <p className="text-primary-foreground/70 text-sm">Track your reports and engagement</p>
      </div>

      <div className="px-5 mt-5">
        <Tabs defaultValue="reports">
          <TabsList className="w-full bg-secondary rounded-xl p-1 h-auto">
            <TabsTrigger
              value="reports"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs font-semibold py-2.5"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              My Reports
            </TabsTrigger>
            <TabsTrigger
              value="validations"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs font-semibold py-2.5"
            >
              <ThumbsUp className="w-4 h-4 mr-1.5" />
              Validations
            </TabsTrigger>
            <TabsTrigger
              value="updates"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs font-semibold py-2.5"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              Updates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-4">
            <div className="flex flex-col gap-3">
              {myReports.map((issue, i) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <IssueCard {...issue} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="validations" className="mt-4">
            <div className="flex flex-col gap-3">
              {validated.map((issue, i) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp className="w-4 h-4 text-success" />
                      <span className="text-xs font-semibold text-success">You validated this</span>
                    </div>
                    <p className="text-sm text-foreground">{issue.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{issue.location} · {issue.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="updates" className="mt-4">
            <div className="flex flex-col gap-3">
              {/* Before/After cards */}
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <p className="text-xs font-semibold text-success mb-2">✅ Resolved</p>
                <p className="text-sm font-medium text-foreground">Pothole near MG Road</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-destructive/5 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold text-destructive mb-1">Before</p>
                    <div className="h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">Photo</div>
                  </div>
                  <div className="bg-success/5 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold text-success mb-1">After</p>
                    <div className="h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">Photo</div>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <p className="text-xs font-semibold text-info mb-1">🔄 Status Updated</p>
                <p className="text-sm text-foreground">Drainage overflow in Koramangala moved to <span className="font-semibold text-info">In Progress</span></p>
                <p className="text-[10px] text-muted-foreground mt-1">Updated 2h ago</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ActivityPage;
