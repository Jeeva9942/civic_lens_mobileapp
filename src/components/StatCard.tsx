import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  variant?: "primary" | "success" | "warning";
}

const variantClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

const StatCard = ({ icon: Icon, label, value, variant = "primary" }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-2xl p-4 flex items-center gap-3 border border-border shadow-sm flex-1"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variantClasses[variant]}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  </motion.div>
);

export default StatCard;
