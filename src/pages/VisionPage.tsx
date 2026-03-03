import { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    Camera,
    Download,
    Settings,
    History,
    Zap,
    FileJson,
    Loader2,
    CheckCircle2,
    ShieldCheck,
    X,
    ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Detection {
    class: string;
    score: number;
    bbox: [number, number, number, number];
}

const VisionPage = () => {
    const navigate = useNavigate();
    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
    const [loading, setLoading] = useState(true);
    const [image, setImage] = useState<string | null>(null);
    const [detections, setDetections] = useState<Detection[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [latency, setLatency] = useState<number | null>(null);
    const [threshold, setThreshold] = useState([0.6]);

    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 1. Load Model Only Once
    useEffect(() => {
        const loadModel = async () => {
            try {
                setLoading(true);
                // Ensure tf is ready (uses WebGL by default if available)
                await tf.ready();
                const loadedModel = await cocoSsd.load({
                    base: 'lite_mobilenet_v2' // Faster for mobile
                });
                setModel(loadedModel);
                setLoading(false);
                toast.success("AI Model Loaded Locally", {
                    description: "Offline edge intelligence is ready."
                });
            } catch (err) {
                console.error("Model Loading Error:", err);
                setLoading(false);
                toast.error("Failed to load AI Model");
            }
        };
        loadModel();
    }, []);

    // 2. Handle Image Upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
                setDetections([]);
                setLatency(null);
            };
            reader.readAsDataURL(file);
        }
    };

    // 3. Perform Inference
    const detectImage = async () => {
        if (!model || !imageRef.current) return;

        setAnalyzing(true);
        const start = performance.now();

        try {
            const predictions = await model.detect(imageRef.current);

            // Filter by threshold
            const filtered = predictions.filter(p => p.score >= threshold[0]);

            setDetections(filtered as Detection[]);
            setLatency(Math.round(performance.now() - start));

            // Draw boxes
            drawBoundingBoxes(filtered as Detection[]);

            toast.success(`Analysis Complete: ${filtered.length} objects found`);
        } catch (err) {
            console.error("Detection Error:", err);
            toast.error("Analysis Failed");
        } finally {
            setAnalyzing(false);
        }
    };

    // 4. Draw Canvas Overlay
    const drawBoundingBoxes = (predictions: Detection[]) => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Reset canvas size to match displayed image exactly
        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        predictions.forEach(p => {
            const [x, y, width, height] = p.bbox;

            // Scaling factors (image processing size -> displayed size)
            const xFactor = canvas.width / img.naturalWidth;
            const yFactor = canvas.height / img.naturalHeight;

            const scaledX = x * xFactor;
            const scaledY = y * yFactor;
            const scaledW = width * xFactor;
            const scaledH = height * yFactor;

            // Box styling
            ctx.strokeStyle = "#3b82f6"; // primary/blue
            ctx.lineWidth = 3;
            ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);

            // Label background
            ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
            const labelText = `${p.class} ${(p.score * 100).toFixed(0)}%`;
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillRect(scaledX, scaledY - 25, textWidth + 10, 25);

            // Label text
            ctx.fillStyle = "white";
            ctx.font = "bold 12px Inter";
            ctx.fillText(labelText, scaledX + 5, scaledY - 7);
        });
    };

    const downloadJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(detections, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "civic_vision_audit.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="pb-24 min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="civic-gradient px-5 pt-12 pb-8 flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => navigate("/")} className="text-white/80"><ChevronLeft className="w-5 h-5" /></button>
                        <Badge variant="outline" className="bg-success/20 text-success border-success/30 text-[10px] animate-pulse">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Runs Locally – Edge AI
                        </Badge>
                    </div>
                    <h1 className="text-xl font-bold text-primary-foreground">Vision Audit AI</h1>
                    <p className="text-primary-foreground/70 text-sm mt-1">Smart Infrastructure Inspection</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" className="rounded-full w-10 h-10 p-0 bg-white/10 text-white">
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="px-5 -mt-6">
                {/* Main Action Area */}
                <div className="bg-card rounded-3xl border border-border shadow-xl p-4 min-h-[400px] flex flex-col gap-4">

                    {/* Status Banner */}
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-xs font-bold">Loading Model...</span></>
                            ) : analyzing ? (
                                <><Loader2 className="w-4 h-4 animate-spin text-warning" /><span className="text-xs font-bold">Edge Inference Running...</span></>
                            ) : detections.length > 0 ? (
                                <><CheckCircle2 className="w-4 h-4 text-success" /><span className="text-xs font-bold text-success font-mono uppercase tracking-widest">Audited</span></>
                            ) : (
                                <><Zap className="w-4 h-4 text-primary" /><span className="text-xs font-bold">Ready for Scan</span></>
                            )}
                        </div>
                        {latency && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/30 rounded-full">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Latency</span>
                                <span className="text-[10px] font-mono font-bold text-primary">{latency}ms</span>
                            </div>
                        )}
                    </div>

                    {/* Image Preview / Work Area */}
                    <div className="relative rounded-2xl overflow-hidden bg-secondary/20 border border-border flex items-center justify-center flex-1 min-h-[300px]">
                        {!image ? (
                            <label className="cursor-pointer flex flex-col items-center gap-3">
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Camera className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold">Upload Audit Photo</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                                </div>
                            </label>
                        ) : (
                            <>
                                <img
                                    ref={imageRef}
                                    src={image}
                                    alt="Audit"
                                    className="w-full h-auto max-h-[500px] object-contain"
                                    onLoad={() => {
                                        if (detections.length > 0) drawBoundingBoxes(detections);
                                    }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                />
                                <button
                                    onClick={() => setImage(null)}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Controls Footer */}
                    <div className="flex gap-2">
                        {!detections.length && image ? (
                            <Button
                                className="flex-1 civic-gradient text-white h-12 rounded-xl"
                                onClick={detectImage}
                                disabled={analyzing}
                            >
                                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Intelligent Scan"}
                            </Button>
                        ) : detections.length > 0 ? (
                            <>
                                <Button
                                    variant="secondary"
                                    className="flex-1 h-12 rounded-xl bg-secondary/50"
                                    onClick={() => {
                                        setImage(null);
                                        setDetections([]);
                                        setLatency(null);
                                    }}
                                >
                                    Reset
                                </Button>
                                <Button
                                    className="flex-1 civic-gradient text-white h-12 rounded-xl"
                                    onClick={downloadJson}
                                >
                                    <Download className="w-4 h-4 mr-2" /> Export JSON
                                </Button>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Settings & Stats Panel */}
                <div className="mt-6 flex flex-col gap-4">
                    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                                <Settings className="w-3.5 h-3.5 text-primary" /> Detection Threshold
                            </h3>
                            <Badge variant="secondary" className="text-[10px] font-mono">
                                {(threshold[0] * 100).toFixed(0)}%
                            </Badge>
                        </div>
                        <Slider
                            value={threshold}
                            onValueChange={setThreshold}
                            max={1}
                            step={0.05}
                            min={0.1}
                            className="py-2"
                        />
                    </div>

                    {/* JSON Results Viewer */}
                    <AnimatePresence>
                        {detections.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[#0f1115] rounded-2xl p-5 border border-white/5 overflow-hidden"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <FileJson className="w-4 h-4 text-warning" />
                                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Metadata Output</h3>
                                    </div>
                                    <History className="w-4 h-4 text-white/30" />
                                </div>
                                <div className="bg-black/40 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar">
                                    <pre className="text-[10px] text-emerald-400 font-mono">
                                        {JSON.stringify(detections.map(d => ({
                                            label: d.class,
                                            confidence: parseFloat(d.score.toFixed(3)),
                                            bbox: d.bbox.map(v => Math.round(v))
                                        })), null, 2)}
                                    </pre>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default VisionPage;
