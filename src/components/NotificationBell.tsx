import { Bell, ArrowRight, BellOff, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import { formatDistanceToNow } from "date-fns";

interface Notification {
    id: string;
    report_id: string;
    message: string;
    type: string;
    created_at: string;
    read?: boolean;
}

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAlertsOn, setIsAlertsOn] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const toggleAlerts = async () => {
        const nextState = !isAlertsOn;
        setIsAlertsOn(nextState);

        if (nextState) {
            try {
                await fetch('/api/trigger-alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber: '+919942373735' })
                });
                toast({
                    title: "Alerts Enabled 🔔",
                    description: "Priority status call alerts are now active.",
                });
            } catch (err) {
                console.error(err);
                toast({
                    title: "Alerts Active",
                    description: "You will receive calls for critical updates.",
                });
            }
        } else {
            toast({
                title: "Alerts Disabled",
                description: "Critical status calls have been paused.",
            });
        }
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('/api/notifications');
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                // Add a local 'read' state since it's not in DB yet
                const mappedData = data.map((n: any) => ({ ...n, read: false }));
                setNotifications(mappedData);
            } catch (err) {
                console.error("Fetch Notifications Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
        // Refresh every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <>
            <button
                onClick={() => {
                    setIsOpen(true);
                    markAllRead();
                }}
                className="relative p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                )}
            </button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="right" className="w-[300px] sm:w-[380px] p-0 rounded-l-3xl border-l-0">
                    <div className="flex flex-col h-full bg-background">
                        <div className="civic-gradient px-6 py-8 text-white rounded-bl-3xl flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Bell className="w-5 h-5" />
                                    Notifications
                                </h2>
                                <p className="text-white/70 text-xs mt-1">Updates from Civic Lens Admin</p>
                            </div>
                            <button
                                onClick={toggleAlerts}
                                className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1 border ${isAlertsOn ? 'bg-white text-primary border-white' : 'bg-white/10 text-white border-white/20'}`}
                            >
                                {isAlertsOn ? <Bell className="w-4 h-4 animate-bounce" /> : <BellOff className="w-4 h-4" />}
                                <span className="text-[8px] font-bold uppercase tracking-tighter">{isAlertsOn ? 'Live' : 'Off'}</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Account Card */}
                            <div className="bg-secondary/10 border border-border/50 rounded-[32px] p-5 relative overflow-hidden group">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-foreground capitalize">jeeva</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <p className="text-[10px] text-muted-foreground font-semibold">Connect Mob No: +91 99423 73735</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            toast({ title: "Logging out...", description: "See you soon!" });
                                            setTimeout(() => navigate('/'), 1000);
                                        }}
                                        className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                            </div>

                            <div className="h-px bg-border/50 mx-2" />
                            {loading ? (
                                <div className="text-center py-20 flex flex-col items-center">
                                    <Bell className="w-8 h-8 animate-pulse text-primary/20 mb-3" />
                                    <p className="text-xs text-muted-foreground">Checking for updates...</p>
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            if (n.report_id) {
                                                navigate(`/progress?id=${n.report_id}&tab=activity`);
                                                setIsOpen(false);
                                            }
                                        }}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${n.read ? 'bg-secondary/5 border-border' : 'bg-primary/5 border-primary/20 shadow-sm'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-bold text-foreground capitalize flex items-center gap-2">
                                                {n.type === 'admin_reply' ? 'Official Reply' : n.type.replace('_', ' ')}
                                                {!n.read && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3 py-1 my-2 bg-white/40 rounded-r-lg">
                                            "{n.message}"
                                        </p>
                                        <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                                View in Feed <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-secondary/5">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full py-3 rounded-xl bg-card border border-border text-sm font-bold text-foreground hover:bg-secondary/10 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default NotificationBell;
