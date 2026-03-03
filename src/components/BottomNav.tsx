import { Home, MapPin, Activity, User, Plus, Users, Clock } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "@/context/TranslationContext";
import { useMemo } from "react";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabs = useMemo(() => [
    { path: "/", icon: Home, label: t('home') },
    { path: "/map", icon: MapPin, label: t('map') },
    { path: "/report", icon: Plus, label: t('report_issue'), fab: true },
    { path: "/progress", icon: Clock, label: t('track_progress') },
    { path: "/community", icon: Users, label: t('community') },
  ], [t]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      <div className="flex items-center h-16 max-w-lg mx-auto px-2 relative">
        {tabs.map((tab, idx) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.fab) {
            return (
              <div key={tab.path} className="flex-1 flex justify-center relative -top-3">
                <motion.button
                  onClick={() => navigate(tab.path)}
                  className="civic-gradient civic-glow-lg rounded-full w-16 h-16 flex items-center justify-center text-primary-foreground border-4 border-background"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Icon className="w-9 h-9" strokeWidth={3} />
                </motion.button>
              </div>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center h-full relative group"
            >
              <div className={`p-1 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10' : 'group-hover:bg-secondary'}`}>
                <Icon
                  className={`w-5 h-5 transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={`text-[9px] font-bold mt-1 transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                {tab.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
