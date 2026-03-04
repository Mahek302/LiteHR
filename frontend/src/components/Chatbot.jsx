import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, UserRound, Headset, Minimize2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { useTheme } from "../contexts/ThemeContext";

const Chatbot = ({
    endpoint = "/api/chatbot/ask",
    welcomeMessage = "Hello! I am WORKFORCEDGE's AI Assistant. How can I help you today?",
    title = "HR Assistant",
    subtitle = "Powered by WORKFORCEDGE AI",
    autoOpen = false,
    teaserMessage = "",
    openSignal = 0,
    onTeaserVisibilityChange = () => {},
}) => {
    const resolveStoredTheme = () => {
        if (typeof window === "undefined") return false;
        const adminTheme = localStorage.getItem("litehr-theme");
        if (adminTheme) return adminTheme === "dark";
        const homepageTheme = localStorage.getItem("theme");
        if (homepageTheme) return homepageTheme === "dark";
        return (
            document.documentElement.classList.contains("dark-mode") ||
            document.documentElement.classList.contains("dark") ||
            document.body.classList.contains("dark")
        );
    };

    const themeValue = useTheme();
    const [fallbackDarkMode, setFallbackDarkMode] = useState(() => resolveStoredTheme());
    const darkMode = themeValue === true || fallbackDarkMode;
    const [isOpen, setIsOpen] = useState(false);
    const [showWelcomeBubble, setShowWelcomeBubble] = useState(autoOpen);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const welcomePreview =
        teaserMessage?.trim() || welcomeMessage?.split("\n")[0] || welcomeMessage;

    // Initialize/Reset messages when welcomeMessage changes
    useEffect(() => {
        setMessages([
            {
                text: welcomeMessage,
                isUser: false,
            },
        ]);
    }, [welcomeMessage]);

    useEffect(() => {
        if (autoOpen) {
            setShowWelcomeBubble(true);
        }
    }, [autoOpen]);

    useEffect(() => {
        if (openSignal > 0) {
            setIsOpen(true);
            setShowWelcomeBubble(false);
        }
    }, [openSignal]);

    useEffect(() => {
        onTeaserVisibilityChange(!isOpen && showWelcomeBubble);
    }, [isOpen, showWelcomeBubble, onTeaserVisibilityChange]);

    // Fallback dark mode tracking for contexts where ThemeWrapper is not mounted.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const syncFallbackTheme = () => setFallbackDarkMode(resolveStoredTheme());

        syncFallbackTheme();
        window.addEventListener("storage", syncFallbackTheme);

        const observer = new MutationObserver(syncFallbackTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        return () => {
            window.removeEventListener("storage", syncFallbackTheme);
            observer.disconnect();
        };
    }, [themeValue]);

    const toggleChat = () => {
        if (!isOpen) {
            setIsOpen(true);
            setShowWelcomeBubble(false);
            return;
        }
        setIsOpen(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
        setInput("");
        setIsLoading(true);

        try {
            
            let url = endpoint;
            if (!url.startsWith("http")) {
                url = `http://localhost:5000${endpoint}`;
            }

            const response = await axios.post(url, {
                message: userMessage,
            });

            if (response.data && response.data.message) {
                setMessages((prev) => [
                    ...prev,
                    { text: response.data.message, isUser: false },
                ]);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error("Chatbot Error:", error);
            toast.error("Failed to get response");
            setMessages((prev) => [
                ...prev,
                {
                    text: "Sorry, I encountered an error. Please try again later.",
                    isUser: false,
                    isError: true,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`mb-4 w-[350px] md:w-[400px] h-[500px] max-h-[80vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 ${
                        darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                    }`}
                    style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)" }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2 text-white">
                            <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                                <div className="relative">
                                    <UserRound size={18} />
                                    <Headset size={11} className="absolute -top-1 -right-1" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm leading-tight">{title}</h3>
                                <p className="text-[10px] text-indigo-100 opacity-90">{subtitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <Minimize2 size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-transparent ${
                        darkMode
                            ? "bg-slate-950/70 scrollbar-thumb-slate-600"
                            : "bg-slate-50 scrollbar-thumb-slate-300"
                    }`}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex w-full ${msg.isUser ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.isUser
                                        ? "bg-indigo-600 text-white rounded-br-none"
                                        : darkMode
                                            ? "bg-slate-900 text-slate-100 border border-slate-700 rounded-bl-none"
                                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                                        } ${msg.isError ? "border-red-500 text-red-600 bg-red-50" : ""}`}
                                >
                                    {/* Basic markdown-like parsing could go here, but keeping it simple text for now */}
                                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                        <ReactMarkdown
                                            components={{
                                                strong: ({ node, ...props }) => <span className="font-bold" {...props} />,
                                                b: ({ node, ...props }) => <span className="font-bold" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className={`rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1.5 items-center border ${
                                    darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                                }`}>
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSend}
                        className={`p-3 border-t shrink-0 ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
                    >
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className={`w-full pl-4 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm ${
                                    darkMode
                                        ? "bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500"
                                        : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                                }`}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!isOpen && showWelcomeBubble && (
                <div className="relative mb-3 mr-1 max-w-[280px] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`rounded-2xl border px-4 pr-9 py-2.5 text-xs leading-relaxed shadow-lg ${
                        darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-700"
                    }`}>
                        <button
                            type="button"
                            aria-label="Close welcome message"
                            onClick={() => setShowWelcomeBubble(false)}
                            className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                                darkMode ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            }`}
                        >
                            <X size={14} />
                        </button>
                        {welcomePreview}
                    </div>
                    <div className={`absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r ${
                        darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                    }`} />
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={toggleChat}
                className={`group p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center ${isOpen
                    ? "bg-gray-800 text-white rotate-90"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30"
                    }`}
            >
                {isOpen ? <X size={24} /> : <Headset size={28} />}
            </button>
        </div>
    );
};

export default Chatbot;
