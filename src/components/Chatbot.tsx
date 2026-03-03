import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot } from "lucide-react";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
}

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Hello! I am your CivicAssistant. How can I help you today?",
            sender: "bot",
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue;

        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), text: userText, sender: "user" },
        ]);

        setInputValue("");

        try {
            const response = await fetch(
                "/api/chat",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: userText,
                        sessionId: "user123",
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Server not responding");
            }

            const data = await response.json();
            const botText = data.output || "No response from AI.";

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    text: botText,
                    sender: "bot",
                },
            ]);
        } catch (error) {
            console.error("Chatbot Error:", error);

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    text: "Unable to connect to AI server. Check webhook or CORS.",
                    sender: "bot",
                },
            ]);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[99999] pointer-events-none">
            <div className="max-w-lg mx-auto relative h-[80px] pointer-events-auto">
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: isOpen ? 0 : 1 }}
                    onClick={() => setIsOpen(true)}
                    className="absolute bottom-20 right-4 w-14 h-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] civic-gradient flex items-center justify-center text-white hover:shadow-[0_4px_25px_rgba(0,0,0,0.4)] transition-shadow"
                >
                    <MessageSquare className="w-6 h-6" />
                </motion.button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="absolute bottom-20 right-4 w-[320px] h-[480px] bg-card border border-border rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden pointer-events-auto backdrop-blur-md"
                        >
                            <div className="civic-gradient px-4 py-3.5 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <div className="bg-white/20 p-1 rounded-lg">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm leading-none">CivicAssistant</h3>
                                        <p className="text-[10px] text-white/70 mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="hover:bg-white/10 p-1 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/5 scrollbar-thin">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${msg.sender === "user"
                                                ? "bg-primary text-primary-foreground rounded-tr-none shadow-md"
                                                : "bg-white border text-foreground rounded-tl-none shadow-sm"
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-card border-t">
                                <div className="flex gap-2">
                                    <input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        className="flex-1 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-secondary/10"
                                        placeholder="Type a message..."
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!inputValue.trim()}
                                        className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all flex-shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[9px] text-muted-foreground text-center mt-3 opacity-60">
                                    AI-powered assistant for civic inquiries.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Chatbot;
