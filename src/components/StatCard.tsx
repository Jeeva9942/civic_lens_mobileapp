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
    className="bg-card rounded-[20px] p-2 flex flex-col items-center justify-center gap-1 border border-border shadow-sm flex-1 min-w-0"
  >
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${variantClasses[variant]}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="text-center">
      <p className="text-lg font-bold text-foreground leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground font-bold mt-1 uppercase tracking-tight whitespace-nowrap">{label}</p>
    </div>
  </motion.div>
);

export default StatCard;
