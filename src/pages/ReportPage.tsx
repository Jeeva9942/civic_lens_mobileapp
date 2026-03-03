import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, Send, ChevronLeft, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CategoryIcon, { type CategoryKey, categories } from "@/components/CategoryIcon";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/context/TranslationContext";

const categoryKeys: CategoryKey[] = [
  "pothole", "drainage", "streetlight", "vegetation",
  "construction", "flooding", "encroachment", "sewage",
];

const severityLevels = [
  { key: "low", label: "Low", color: "bg-muted text-muted-foreground" },
  { key: "medium", label: "Medium", color: "bg-warning/10 text-warning border-warning/30" },
  { key: "high", label: "High", color: "bg-destructive/10 text-destructive border-destructive/30" },
];

const ReportPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [severity, setSeverity] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocating(false);
          toast({
            title: "Location Access Denied",
            description: "Using default city center for now. You can still report!",
          });
        }
      );
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      const reportData = {
        title: selectedCategory ? categories[selectedCategory].label : 'Civic Issue',
        description,
        category: selectedCategory,
        severity,
        location: `Region around ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        lat: coords.lat,
        lng: coords.lng,
        status: "Reported",
        createdAt: new Date().toISOString(),
        image: imagePreview
      };

      const response = await fetch('http://localhost:5000/api/civic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) throw new Error('Failed to submit report');

      toast({
        title: "Report Submitted! ✅",
        description: "Your civic issue has been reported. Track it in Activity.",
      });
      navigate("/activity");
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission Failed",
        description: "Please check your backend connection.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-background">
      {/* Header */}
      <div className="civic-gradient px-5 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => (step > 0 ? setStep(step - 1) : navigate("/"))} className="text-primary-foreground">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">{t('report_issue')}</h1>
        </div>
        {/* Progress */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-primary-foreground" : "bg-primary-foreground/30"
                }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="px-5 mt-6"
          >
            <h2 className="font-bold text-foreground text-lg mb-1">Select Category</h2>
            <p className="text-sm text-muted-foreground mb-5">What type of issue are you reporting?</p>
            <div className="grid grid-cols-4 gap-5">
              {categoryKeys.map((key) => (
                <CategoryIcon
                  key={key}
                  category={key}
                  selected={selectedCategory === key}
                  onClick={() => setSelectedCategory(key)}
                />
              ))}
            </div>
            <Button
              className="w-full mt-8 h-12 rounded-xl civic-gradient text-primary-foreground civic-glow font-semibold"
              disabled={!selectedCategory}
              onClick={() => setStep(1)}
            >
              Continue
            </Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="px-5 mt-6"
          >
            <h2 className="font-bold text-foreground text-lg mb-1">Add Details</h2>
            <p className="text-sm text-muted-foreground mb-5">Upload a photo and describe the issue</p>

            {/* Image Upload */}
            <label className="block mb-5 cursor-pointer">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden h-48">
                  <img src={imagePreview} alt="Issue" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>
              ) : (
                <div className="h-48 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-secondary/50">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">Tap to upload photo</span>
                </div>
              )}
            </label>

            {/* GPS */}
            <div className={`flex items-center gap-2 mb-5 px-3 py-3 rounded-xl border transition-all ${locating ? 'bg-secondary/30 border-muted animate-pulse' : 'bg-secondary/50 border-border'}`}>
              <MapPin className={`w-5 h-5 ${locating ? 'text-muted-foreground' : 'text-primary'}`} />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {locating ? 'Fetching GPS...' : 'GPS Auto-captured'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {coords.lat.toFixed(6)}° N, {coords.lng.toFixed(6)}° E
                </p>
              </div>
            </div>

            {/* Description */}
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue briefly..."
              className="rounded-xl border-border bg-secondary/50 min-h-[100px] resize-none"
            />

            <Button
              className="w-full mt-6 h-12 rounded-xl civic-gradient text-primary-foreground civic-glow font-semibold"
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="px-5 mt-6"
          >
            <h2 className="font-bold text-foreground text-lg mb-1">{t('severity')}</h2>
            <p className="text-sm text-muted-foreground mb-5">How severe is this issue?</p>

            <div className="flex flex-col gap-3">
              {severityLevels.map((level) => (
                <button
                  key={level.key}
                  onClick={() => setSeverity(level.key)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${severity === level.key
                    ? "border-primary civic-glow bg-primary/5"
                    : "border-border bg-card"
                    }`}
                >
                  <AlertTriangle className={`w-5 h-5 ${severity === level.key ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-semibold text-sm ${severity === level.key ? "text-primary" : "text-foreground"}`}>
                    {t(level.key)}
                  </span>
                </button>
              ))}
            </div>

            {/* Summary */}
            {selectedCategory && (
              <div className="mt-6 p-4 rounded-2xl bg-secondary/50 border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Summary</p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span className="font-medium">Category:</span>
                  <span>{t(selectedCategory)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground mt-1">
                  <span className="font-medium">Severity:</span>
                  <span className="capitalize">{t(severity)}</span>
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{description}</p>
                )}
              </div>
            )}

            <Button
              className="w-full mt-6 h-12 rounded-xl civic-gradient text-primary-foreground civic-glow font-semibold"
              onClick={handleSubmit}
            >
              <Send className="w-4 h-4 mr-2" />
              {t('report_issue')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportPage;
