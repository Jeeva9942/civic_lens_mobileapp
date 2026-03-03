import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Users, TrendingUp, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { categories } from "@/components/CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import LanguageSelector from "@/components/LanguageSelector";
import NotificationBell from "@/components/NotificationBell";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CommunityPost {
  issue: any;
  user: { name: string; initials: string; score: number };
  likes: number;
  comments: { user: string; text: string; time: string }[];
  shares: number;
}

const mockUsers = [
  { name: "Arjun Kumar", initials: "AK", score: 320 },
  { name: "Priya Sharma", initials: "PS", score: 580 },
  { name: "Rahul Nair", initials: "RN", score: 410 },
  { name: "Deepa Rao", initials: "DR", score: 290 },
  { name: "Vikram Singh", initials: "VS", score: 760 },
  { name: "Ananya Patel", initials: "AP", score: 450 },
  { name: "Suresh Menon", initials: "SM", score: 340 },
  { name: "Kavitha Das", initials: "KD", score: 620 },
];

const mockComments = [
  [
    { user: "Priya S.", text: "I see this every day! Needs urgent fix.", time: "1h ago" },
    { user: "Rahul N.", text: "Reported to BBMP last week, no response yet.", time: "45m ago" },
  ],
  [
    { user: "Vikram S.", text: "This has been broken for months now.", time: "3h ago" },
  ],
  [
    { user: "Ananya P.", text: "The whole area gets flooded when it rains.", time: "2h ago" },
    { user: "Suresh M.", text: "We need proper drainage infrastructure here.", time: "1h ago" },
    { user: "Deepa R.", text: "Same problem in our area too!", time: "30m ago" },
  ],
];

const CommunityPage = () => {
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiTimings, setAiTimings] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/civic');
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(data);

        if (data.length > 0) {
          fetchAiEstimates(data);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAiEstimates = async (allReports: any[]) => {
      setAiLoading(true);
      try {
        // Only estimate for top 5 to avoid long wait
        const topReports = allReports.slice(0, 5);
        const estimates: Record<string, string> = {};

        for (const report of topReports) {
          const prompt = `Analyze this civic issue description: "${report.description}" (Category: ${report.category}). 
          Based on its severity "${report.severity}", provide a 3-word approximate resolution timeline (e.g., "Fix in 2 days").`;

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: prompt, sessionId: "ai_community_estimation" }),
          });

          if (response.ok) {
            const data = await response.json();
            const rawOutput = data.output.trim();

            // 🔍 SANITIZE AI OUTPUT
            // If it's an error message or too long, fallback
            const isError = rawOutput.toLowerCase().includes("error") ||
              rawOutput.toLowerCase().includes("busy") ||
              rawOutput.length > 50;

            estimates[report._id || report.id] = isError ? "Estimated soon" : rawOutput;
          } else {
            // If response is not OK, set a default value
            estimates[report._id || report.id] = "Estimated soon";
          }
        }
        setAiTimings(estimates);
      } catch (err) {
        console.error("AI Community Error:", err);
      } finally {
        setAiLoading(false);
      }
    };

    fetchReports();
  }, []);

  const communityPosts: CommunityPost[] = reports.map((issue, i) => ({
    issue: {
      ...issue,
      time: issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recently'
    },
    user: mockUsers[i % mockUsers.length],
    likes: Math.floor(Math.random() * 80) + 5,
    comments: mockComments[i % mockComments.length] || [],
    shares: Math.floor(Math.random() * 20) + 1,
  }));

  const toggleLike = (id: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleComments = (id: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const resolvedPercentage = reports.length > 0
    ? Math.round((reports.filter(r => r.status === 'Resolved').length / reports.length) * 100)
    : 0;

  return (
    <div className="pb-24 min-h-screen bg-background">
      {/* Header */}
      <div className="civic-gradient px-5 pt-12 pb-5 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-foreground" />
            <h1 className="text-lg font-bold text-primary-foreground">Community</h1>
          </div>
          <p className="text-primary-foreground/70 text-sm">See what others are reporting</p>
        </div>
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
      </div>

      {/* Stats bar */}
      <div className="mx-4 -mt-3 bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center justify-around">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{reports.length}</p>
          <p className="text-[10px] text-muted-foreground">Reports</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{mockUsers.length + 5}</p>
          <p className="text-[10px] text-muted-foreground">Citizens</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-success" />
            <p className="text-lg font-bold text-success">{resolvedPercentage || 45}%</p>
          </div>
          <p className="text-[10px] text-muted-foreground">Resolved</p>
        </div>
      </div>

      {/* Top contributors */}
      <div className="px-5 mt-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Top Contributors</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {mockUsers
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((user, i) => (
              <motion.div
                key={user.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-1.5 min-w-[64px]"
              >
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-primary">
                    <AvatarFallback className="civic-gradient text-primary-foreground text-xs font-bold">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  {i === 0 && (
                    <span className="absolute -top-1 -right-1 text-xs">🏆</span>
                  )}
                </div>
                <p className="text-[10px] font-semibold text-foreground text-center leading-tight">{user.name.split(" ")[0]}</p>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">{user.score} pts</Badge>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Community feed */}
      <div className="px-5 mt-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Community Feed</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Loading community feed...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {communityPosts.length > 0 ? communityPosts.map((post, i) => {
              const cat = categories[post.issue.category as keyof typeof categories] || categories.pothole;
              const Icon = cat.icon;
              const isLiked = likedPosts.has(post.issue.id);
              const showComments = expandedComments.has(post.issue.id);

              return (
                <motion.div
                  key={post.issue.id || i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
                >
                  {/* Post header */}
                  <div className="flex items-center gap-3 p-4 pb-2">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                        {post.user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{post.user.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {post.issue.time}
                        {aiTimings[post.issue.id || post.issue._id] && (
                          <span className="flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold text-[8px] ml-1">
                            <Clock className="w-2 h-2" /> {aiTimings[post.issue.id || post.issue._id]}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{ borderColor: post.issue.severity === "high" ? "hsl(0,84%,60%)" : post.issue.severity === "medium" ? "hsl(38,95%,55%)" : "hsl(145,65%,42%)" }}
                    >
                      {post.issue.severity}
                    </Badge>
                  </div>

                  {/* Issue content */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cat.bg} ${cat.color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{cat.label}</span>
                    </div>
                    <p className="text-sm text-foreground">{post.issue.description}</p>

                    {post.issue.image && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-border">
                        <img src={post.issue.image} alt="Report attachment" className="w-full h-48 object-cover" />
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {post.issue.location}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center border-t border-border px-4 py-2.5">
                    <button
                      onClick={() => toggleLike(post.issue.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors flex-1 ${isLiked ? "text-destructive" : "text-muted-foreground"
                        }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                      {post.likes + (isLiked ? 1 : 0)}
                    </button>
                    <button
                      onClick={() => toggleComments(post.issue.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground flex-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comments.length}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground flex-1">
                      <Share2 className="w-4 h-4" />
                      {post.shares}
                    </button>
                  </div>

                  {/* Comments section */}
                  {showComments && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="border-t border-border bg-secondary/30"
                    >
                      <div className="p-3 flex flex-col gap-2.5">
                        {post.comments.map((comment, ci) => (
                          <div key={ci} className="flex gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-bold">
                                {comment.user.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-card rounded-xl px-3 py-2">
                              <p className="text-[10px] font-semibold text-foreground">{comment.user}</p>
                              <p className="text-xs text-foreground mt-0.5">{comment.text}</p>
                              <p className="text-[9px] text-muted-foreground mt-1">{comment.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-3 pb-3 flex gap-2">
                        <Input
                          placeholder="Add a comment..."
                          className="text-xs h-8 bg-card"
                          value={commentInputs[post.issue.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.issue.id]: e.target.value }))
                          }
                        />
                        <button className="civic-gradient text-primary-foreground rounded-lg px-3 h-8 flex items-center justify-center">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            }) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No community reports yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;

