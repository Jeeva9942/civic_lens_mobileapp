import { motion } from "framer-motion";
import {
  Award,
  Globe,
  EyeOff,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  Star,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ProfilePage = () => {
  const [anonymous, setAnonymous] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const civicScore = 780;
  const maxScore = 1000;

  return (
    <div className="pb-24 min-h-screen bg-background">
      {/* Header */}
      <div className="civic-gradient px-5 pt-12 pb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl civic-gradient-dark flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">
            CR
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">Civic Reporter</h1>
            <p className="text-primary-foreground/70 text-sm">Active Citizen</p>
          </div>
        </div>
      </div>

      {/* Civic Score */}
      <div className="px-5 -mt-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border shadow-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Civic Score</h2>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-extrabold text-gradient">{civicScore}</span>
            <span className="text-sm text-muted-foreground mb-1">/ {maxScore}</span>
          </div>
          <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(civicScore / maxScore) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full civic-gradient rounded-full"
            />
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-warning" />
              <span className="text-xs font-medium text-foreground">12 Reports</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-xs font-medium text-foreground">8 Resolved</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Settings */}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Settings</h2>
        <div className="flex flex-col gap-1">
          {/* Language */}
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Language</span>
            </div>
            <Select defaultValue="en">
              <SelectTrigger className="w-28 h-8 text-xs border-border rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
                <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                <SelectItem value="ta">தமிழ்</SelectItem>
                <SelectItem value="te">తెలుగు</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Anonymous */}
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <EyeOff className="w-5 h-5 text-primary" />
              <div>
                <span className="text-sm font-medium text-foreground">Anonymous Mode</span>
                <p className="text-[10px] text-muted-foreground">Hide your identity from reports</p>
              </div>
            </div>
            <Switch checked={anonymous} onCheckedChange={setAnonymous} />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Notifications</span>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          {/* Logout */}
          <button className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border mt-2">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">Logout</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
