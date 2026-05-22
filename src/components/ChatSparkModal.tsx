import { useState, useRef, useEffect } from "react";
import { LectureNote, ChatMessage } from "../types";
import { Sparkles, Send, X, Bot, User, RefreshCw, AlertCircle, HelpCircle } from "lucide-react";

interface ChatSparkModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeNote: LectureNote | null;
}

export default function ChatSparkModal({ isOpen, onClose, activeNote }: ChatSparkModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  // Initialize welcome prompts on mount or note shift
  useEffect(() => {
    if (isOpen) {
      const initialGreet = activeNote
        ? `Hello study partner! I've loaded your note details on "${activeNote.title}". I am ready to quiz you on definitions, explain complex physiological mechanisms, or answer doubt. What shall we review?`
        : "Hello! I am your ParkNote AI Study Buddy. Select any study material or ask me general scientific questions to build study guides.";

      setMessages([
        {
          id: "welcome-msg",
          role: "model",
          text: initialGreet,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [isOpen, activeNote]);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);
    setErrorStatus(null);

    try {
      // Load custom AI configurations
      const savedConfigStr = localStorage.getItem("parknote_custom_ai_hub_config");
      let customConfig = undefined;
      if (savedConfigStr) {
        try {
          const parsed = JSON.parse(savedConfigStr);
          customConfig = parsed.chat;
        } catch (e) {
          console.warn("Could not read custom chat config", e);
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          activeNoteContext: activeNote,
          config: customConfig,
        }),
      });

      if (!response.ok) {
        throw new Error("Assistant response was not successful. Please check your internet connection.");
      }

      const responseData = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: "assistant-" + Date.now(),
          role: "model",
          text: responseData.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus("Connection timeout. Rendering offline study guide details.");
      
      // Offline fallback help matching active note
      let fallbackText = `I am currently running in offline review mode, but I can tell you that in "${activeNote?.title || "science"}":\n- Practice retrieving concepts regularly.\n- Focus on these key vocabulary words: ${activeNote?.terms?.map(t => t.term).join(", ") || "the main syllabus keywords"}.\nLet me know if you would like me to test your definitions!`;
      
      setMessages((prev) => [
        ...prev,
        {
          id: "fallback-" + Date.now(),
          role: "model",
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const loadHelperPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const SUGGESTED_PROMPTS = activeNote
    ? [
        `Quiz me on "${activeNote.title}" terminology`,
        `Simplify "${activeNote.title}" overview`,
        "Ask me an active recall question"
      ]
    : [
        "Explain a complex concepts simply",
        "How do I structure a cognitive map?",
        "Give me a short active-recall practice quiz"
      ];

  return (
    <div id="chat-spark-panel" className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#141218] border-l border-[#49454F]/30 z-50 flex flex-col justify-between animate-slide-in text-white shadow-2xl">
      
      {/* Visual Header */}
      <div className="p-4 border-b border-[#49454F]/35 bg-[#1C1B1F] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#D0BCFF]/15 border border-[#D0BCFF]/25">
            <Sparkles className="h-4.5 w-4.5 text-[#D0BCFF]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider font-sans text-white">Spark Study Buddy</h2>
            <p className="text-[10px] uppercase font-sans tracking-wider text-[#D0BCFF] font-semibold">
              {activeNote ? `Context // ${activeNote.title}` : "General Study Guide Mode"}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#211F26] text-[#CAC4D0] hover:text-white transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Scrolling Arena */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-hide bg-[#141218]">
        {messages.map((m) => {
          const isModel = m.role === "model";
          return (
            <div key={m.id} className={`flex items-start gap-2.5 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Profile/Bot icon */}
              <div className={`p-2 rounded-full shrink-0 ${isModel ? "bg-[#D0BCFF]/15 text-[#D0BCFF] border border-[#D0BCFF]/25" : "bg-[#A1F000]/10 text-[#A1F000] border border-[#A1F000]/25"}`}>
                {isModel ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              {/* Balloon */}
              <div className="space-y-1 max-w-[80%]">
                <div className={`p-3.5 text-xs leading-relaxed ${
                  isModel
                    ? "bg-[#211F26] text-[#CAC4D0] border border-[#49454F]/25 rounded-3xl rounded-tl-none"
                    : "bg-[#D0BCFF]/10 text-white border border-[#D0BCFF]/20 rounded-3xl rounded-tr-none"
                }`}>
                  <p className="whitespace-pre-wrap font-sans">{m.text}</p>
                </div>
                <span className="block text-[9px] text-[#938F99] font-mono text-right">{m.timestamp}</span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-full bg-[#D0BCFF]/15 text-[#D0BCFF] border border-[#D0BCFF]/25">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-[#211F26] p-3 rounded-3xl rounded-tl-none text-xs text-[#CAC4D0] italic border border-[#49454F]/25 font-sans">
              AI Buddy is contemplating...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Suggested helper triggers, display only if conversation is short */}
      {messages.length < 5 && (
        <div className="px-4 py-3.5 space-y-2 border-t border-[#49454F]/35 bg-[#141218] z-10">
          <p className="text-[9px] text-[#938F99] font-sans uppercase tracking-widest font-bold">// Suggested starters</p>
          <div className="flex flex-col gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => loadHelperPrompt(prompt)}
                className="text-left text-[11px] bg-[#1C1B1F] hover:bg-[#2D2B33] px-3.5 py-2.5 rounded-full border border-[#49454F]/35 hover:border-[#D0BCFF]/50 text-[#D0BCFF] hover:text-[#EADDFF] transition font-sans font-bold cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error status */}
      {errorStatus && (
        <div className="mx-4 p-2 rounded-xl bg-red-950/20 border border-red-900/50 flex items-center gap-1.5 text-[10px] text-red-400 font-sans">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorStatus}</span>
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t border-[#49454F]/30 bg-[#1C1B1F]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={activeNote ? "Ask study assistant about this note..." : "Ask standard study guides..."}
            className="flex-1 rounded-full bg-[#1D1B20] p-3 px-4 text-xs text-white placeholder-zinc-500 border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF]"
          />
          <button
            type="submit"
            className="p-3 rounded-full bg-[#D0BCFF] hover:bg-[#EADDFF] text-[#21005D] font-bold shrink-0 active:scale-95 duration-150 cursor-pointer"
          >
            <Send className="h-4 w-4 text-[#21005D] fill-[#21005D]" />
          </button>
        </form>
      </div>

    </div>
  );
}
