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
                "http://localhost:5000/api/chat",
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
        <>
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: isOpen ? 0 : 1 }}
                onClick={() => setIsOpen(true)}
                className="absolute bottom-20 right-4 w-14 h-14 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] civic-gradient flex items-center justify-center z-[99999] text-white hover:shadow-[0_0_20px_rgba(0,0,0,0.4)]"
            >
                <MessageSquare className="w-6 h-6" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-20 right-4 w-[320px] h-[400px] bg-card border rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.4)] z-[99999] flex flex-col overflow-hidden"
                    >
                        <div className="civic-gradient px-4 py-3 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5" />
                                <h3 className="font-semibold text-sm">CivicAssistant</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/10">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.sender === "user"
                                            ? "bg-primary text-white"
                                            : "bg-white border shadow-sm"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 border-t">
                            <div className="flex gap-2">
                                <input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && handleSend()
                                    }
                                    className="flex-1 border rounded-full px-4 text-sm"
                                    placeholder="Type a message..."
                                />
                                <button
                                    onClick={handleSend}
                                    className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Chatbot;