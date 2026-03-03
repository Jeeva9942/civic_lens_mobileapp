import { motion } from "framer-motion";
import { useTranslation } from "@/context/TranslationContext";
import {
  AlertTriangle,
  Droplets,
  Lightbulb,
  TreePine,
  Construction,
  Waves,
  Route,
  Building2,
  type LucideIcon,
} from "lucide-react";

export type CategoryKey =
  | "pothole"
  | "drainage"
  | "streetlight"
  | "vegetation"
  | "construction"
  | "flooding"
  | "encroachment"
  | "sewage";

interface CategoryDef {
  icon: LucideIcon;
  label: string;
  color: string;
  bg: string;
}

export const categories: Record<CategoryKey, CategoryDef> = {
  pothole: { icon: AlertTriangle, label: "Pothole", color: "text-warning", bg: "bg-warning/10" },
  drainage: { icon: Droplets, label: "Drainage", color: "text-info", bg: "bg-info/10" },
  streetlight: { icon: Lightbulb, label: "Streetlight", color: "text-warning", bg: "bg-warning/10" },
  vegetation: { icon: TreePine, label: "Vegetation", color: "text-success", bg: "bg-success/10" },
  construction: { icon: Construction, label: "Construction", color: "text-destructive", bg: "bg-destructive/10" },
  flooding: { icon: Waves, label: "Flooding", color: "text-info", bg: "bg-info/10" },
  encroachment: { icon: Route, label: "Encroachment", color: "text-primary", bg: "bg-primary/10" },
  sewage: { icon: Building2, label: "Sewage", color: "text-destructive", bg: "bg-destructive/10" },
};

interface CategoryIconProps {
  category: CategoryKey;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

const CategoryIcon = ({ category, selected, onClick, size = "md" }: CategoryIconProps) => {
  const { t } = useTranslation();
  const cat = categories[category];
  const Icon = cat.icon;
  const isSmall = size === "sm";

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className={`flex flex-col items-center gap-1.5 ${onClick ? "cursor-pointer" : ""}`}
    >
      <div
        className={`${isSmall ? "w-10 h-10" : "w-14 h-14"} rounded-2xl flex items-center justify-center transition-all ${selected
          ? "civic-gradient civic-glow text-primary-foreground"
          : `${cat.bg} ${cat.color}`
          }`}
      >
        <Icon className={isSmall ? "w-5 h-5" : "w-6 h-6"} />
      </div>
      <span className={`${isSmall ? "text-[10px]" : "text-xs"} font-medium text-foreground`}>
        {t(category)}
      </span>
    </motion.button>
  );
};

export default CategoryIcon;
