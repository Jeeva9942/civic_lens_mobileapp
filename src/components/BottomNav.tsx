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
    { path: "/profile", icon: User, label: t('profile') },
  ], [t]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.fab) {
            return (
              <motion.button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="civic-gradient civic-glow-lg rounded-full w-14 h-14 flex items-center justify-center -mt-6 text-primary-foreground"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <Icon className="w-7 h-7" strokeWidth={2.5} />
              </motion.button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 civic-gradient rounded-full"
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
