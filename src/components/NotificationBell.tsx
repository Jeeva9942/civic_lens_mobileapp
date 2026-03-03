import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "1",
            title: "Issue Verified",
            message: "Your reported pothole at MG Road has been verified by the admin.",
            time: "2 mins ago",
            read: false,
        },
        {
            id: "2",
            title: "Work Assigned",
            message: "A technician has been assigned to fix the drainage issue at Indiranagar.",
            time: "1 hour ago",
            read: false,
        },
        {
            id: "3",
            title: "Issue Resolved",
            message: "The streetlight issue you reported has been marked as resolved.",
            time: "Yesterday",
            read: true,
        }
    ]);

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
                        <div className="civic-gradient px-6 py-8 text-white rounded-bl-3xl">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notifications
                            </h2>
                            <p className="text-white/70 text-xs mt-1">Updates from Civic Lens Admin</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-4 rounded-2xl border transition-all ${n.read ? 'bg-secondary/5 border-border' : 'bg-primary/5 border-primary/20 shadow-sm'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-bold text-foreground">{n.title}</h4>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
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
