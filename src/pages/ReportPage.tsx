import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, Send, ChevronLeft, Upload, AlertTriangle, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CategoryIcon, { type CategoryKey, categories } from "@/components/CategoryIcon";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/context/TranslationContext";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const categoryKeys: CategoryKey[] = [
  "pothole", "drainage", "streetlight", "vegetation",
  "construction", "flooding", "encroachment", "sewage",
];

const severityLevels = [
  { key: "low", label: "Low", color: "bg-muted text-muted-foreground" },
  { key: "medium", label: "Medium", color: "bg-warning/10 text-warning border-warning/30" },
  { key: "high", label: "High", color: "bg-destructive/10 text-destructive border-destructive/30" },
];

const CIVIC_WHITELIST = [
  "person", "bicycle", "car", "motorcycle", "bus", "truck",
  "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "dog"
];

const categoryMessages: Record<CategoryKey, string> = {
  pothole: "🚧 Pothole: A road surface defect has been identified, causing uneven driving conditions and potential safety risks for vehicles and pedestrians. The pothole appears to have developed due to wear, water seepage, or poor maintenance. Immediate inspection is recommended to prevent further road damage. Temporary warning signage may be required until repairs are completed.",
  drainage: "💧 Drainage: A drainage issue has been detected in the area, potentially affecting proper water flow. Blocked or damaged drains may lead to water accumulation during rainfall. This could increase the risk of flooding and road deterioration. Maintenance teams should assess and clear the drainage system promptly.",
  streetlight: "💡 Streetlight: A malfunctioning or non-operational streetlight has been observed at the location. Reduced visibility during nighttime may pose safety concerns for pedestrians and drivers. The issue could be due to electrical faults or bulb failure. Technical inspection and timely replacement are advised.",
  vegetation: "🌿 Vegetation: Overgrown vegetation has been noticed encroaching into public pathways or road areas. This may obstruct visibility and restrict pedestrian or vehicle movement. Uncontrolled plant growth can also affect nearby infrastructure. Trimming and regular maintenance are recommended.",
  construction: "🚧 Construction: Ongoing or incomplete construction activity has been reported in the vicinity. Debris or improper barricading may create hazards for commuters. The site requires proper safety measures and clear signage. Authorities should ensure compliance with safety regulations.",
  flooding: "🌊 Flooding: Signs of water accumulation or flooding have been identified in the area. This may disrupt traffic flow and damage nearby infrastructure. The issue could be linked to heavy rainfall or poor drainage systems. Immediate water clearance and preventive measures are necessary.",
  encroachment: "📌 Encroachment: An unauthorized encroachment has been detected occupying public space. This may obstruct movement and affect planned infrastructure usage. The situation requires verification against municipal regulations. Appropriate legal and administrative action may be needed.",
  sewage: "🚰 Sewage: A possible sewage-related issue has been observed, such as leakage or overflow. This can create unhygienic conditions and health risks for nearby residents. The problem may stem from pipeline blockage or damage. Urgent inspection and repair are recommended to restore sanitation."
};

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

  // TFJS Model State
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Load TFJS Model
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await cocoSsd.load({ base: 'mobilenet_v2' });
        setModel(loadedModel);
        setModelLoading(false);
      } catch (err) {
        console.error("TFJS Load Error:", err);
        setModelLoading(false);
      }
    };
    loadModel();
  }, []);

  const [analyzing, setAnalyzing] = useState(false);
  const [noIssueFound, setNoIssueFound] = useState(false);

  // Helper to draw boxes on image preview
  const drawBoxes = (predictions: any[]) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(p => {
      const [x, y, width, height] = p.bbox;
      const xFactor = canvas.width / img.naturalWidth;
      const yFactor = canvas.height / img.naturalHeight;

      ctx.strokeStyle = "#4f46e5"; // Indigo
      ctx.lineWidth = 3;
      ctx.strokeRect(x * xFactor, y * yFactor, width * xFactor, height * yFactor);

      ctx.fillStyle = "#4f46e5";
      ctx.font = "bold 10px Inter";
      ctx.fillText(`${p.class} ${(p.score * 100).toFixed(0)}%`, x * xFactor, y * yFactor - 5);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImagePreview(base64);

        // --- SIMULATED PROCESSING ---
        setAnalyzing(true);
        setNoIssueFound(false);

        // Wait for exactly 4 seconds as requested
        setTimeout(() => {
          setAnalyzing(false);
          const msg = selectedCategory ? categoryMessages[selectedCategory] : categoryMessages.pothole;
          setDescription(msg);

          toast({
            title: "Processing Complete ✨",
            description: "Evidence successfully archived.",
          });
        }, 4000);
      };
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

      const response = await fetch('/api/civic', {
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
          <div className="flex-1">
            <h1 className="text-lg font-bold text-primary-foreground">{t('report_issue')}</h1>
          </div>
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
                <div className="relative rounded-2xl overflow-hidden min-h-[200px] h-auto">
                  <img
                    ref={imageRef}
                    src={imagePreview}
                    alt="Issue"
                    className="w-full h-full object-contain bg-secondary/20"
                  />
                  <div className="absolute inset-0 bg-foreground/10 flex flex-col items-center justify-center gap-2 pointer-events-none">
                    {analyzing ? (
                      <>
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <span className="text-xs text-white font-bold bg-indigo-600 px-3 py-1 rounded-full shadow-lg">Analyzing the images...</span>
                      </>
                    ) : noIssueFound ? (
                      <>
                        <AlertTriangle className="w-8 h-8 text-white" />
                        <span className="text-xs text-white font-bold bg-destructive px-4 py-1.5 rounded-full shadow-lg animate-bounce">No issue found</span>
                      </>
                    ) : (
                      <div className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white pointer-events-auto">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-48 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-secondary/50 shadow-inner">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Upload className={`w-6 h-6 ${analyzing ? 'animate-bounce' : ''}`} />
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {analyzing ? 'Processing...' : 'Upload Audit Evidence'}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Municipal processing will verify the issue</p>
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
