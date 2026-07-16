import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, ChevronDown, Mic, Copy, Check, Volume2, VolumeX, Settings, Zap, Square, RotateCcw, Download, ArrowUpRight, ArrowUp } from "lucide-react";
import { API_URL as BASE_URL } from "../../api/axios";

const API_URL = `${BASE_URL}/api/chatbot`;
//Message d’accueil et quelques questions suggérées affichées quand le chat est vide.
const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Bonjour 👋 Comment puis-je vous aider aujourd'hui ?",
};

const SUGGESTED_QUESTIONS = [
  "Quels sont les modules disponibles ?",
  "Comment fonctionne Elzei Rentabilité ?",
  "Quel est notre projet le plus rentable ?",
  "Comment contacter le support ?",
];
// formatage minimal de texte pour gérer les **gras** et les listes à puces, en utilisant des expressions régulières pour détecter les parties du texte à formater et en les rendant avec des éléments React appropriés (strong pour le gras, li pour les puces)
const renderText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Handle bullet points
    if (part.includes("\n- ")) {
      return part.split("\n").map((line, j) =>
        line.startsWith("- ") ? (
          <li key={j} className="ml-4 list-disc">{line.slice(2)}</li>
        ) : (
          <span key={j}>{line}{"\n"}</span>
        )
      );
    }
    return <span key={i}>{part}</span>;
  });
};

// Composant principal du widget de chatbot
export default function ChatbotWidget() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAutoVocal, setIsAutoVocal] = useState(false);
  const [isAutoSubmit, setIsAutoSubmit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Remet la conversation à zéro : un seul message d’accueil, arrête la lecture vocale, vide l’input, cache les paramètres.
  const resetChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setIsLoading(false);
    stopSpeaking();
    setInput("");
    setShowSettings(false);
  };
  // demande l’accès au micro, crée un MediaRecorder, enregistre l’audio par morceaux.
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      alert("Erreur accès micro : " + err.message);
    }
  };
  // Arrête l'enregistrement vocal en arrêtant le MediaRecorder et en mettant à jour l'état d'écoute
  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }; 
  // Arrête toute synthèse vocale en cours et met à jour l'état de parole
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  // Utilise l'API Web Speech pour vocaliser le texte de la réponse de l'assistant, en gérant les événements de début, fin et erreur pour mettre à jour l'état de parole et en nettoyant le texte des marqueurs de formatage pour une meilleure expérience vocale
  const speakText = (text) => {
    if (!isAutoVocal) return;
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Remove markdown-like bold markers for cleaner speech
    const cleanText = text.replace(/\*\*/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "fr-FR"; // Default to French
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };
  // envoie le blob audio au serveur pour transcription, gère la réponse en ajoutant le texte transcrit à l'entrée ou en l'envoyant directement selon les paramètres d'auto-envoi, et gère les erreurs de transcription en affichant un message d'erreur dans le chat
  const handleTranscription = async (blob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", blob, "voice.webm");

    try {
      const res = await fetch(`${API_URL}/transcribe`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.text) {
        if (isAutoSubmit) {
          // If auto-submit, we send immediately
          setMessages(prev => [...prev, { role: "user", text: data.text }]);
          triggerSendMessage(data.text);
        } else {
          setInput((prev) => prev + (prev ? " " : "") + data.text);
        }
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setMessages(prev => [...prev, { role: "assistant", text: "Erreur de transcription. Vérifiez votre micro." }]);
    } finally {
      setIsLoading(false);
    }
  };
  // envoie un message au serveur en utilisant le texte fourni, en construisant l'historique des messages pour le contexte, en gérant
  const triggerSendMessage = async (text) => {
    setIsLoading(true);
    try {
      const history = messages.slice(1).map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        text: m.text,
      }));

      const token = localStorage.getItem("token");
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      speakText(data.reply);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `❌ Erreur: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };
// Copie le texte dans le presse-papiers et affiche une icône Check pendant 2 secondes.
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  // Scroll automatique vers le bas à chaque nouveau message, et focus sur l'input quand le chat s'ouvre ou se restaure.
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  // Focus sur l'input quand le chat s'ouvre ou se restaure, pour une meilleure expérience utilisateur et un accès rapide à la saisie de message.
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user", text: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // On construit l'historique à envoyer au serveur en excluant le message d'accueil et en formatant les rôles pour correspondre à ce que le backend attend, afin de fournir un contexte complet pour la génération de
      const history = newMessages.slice(1, -1).map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        text: m.text,
      }));

      const token = localStorage.getItem("token");
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur serveur");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      speakText(data.reply);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `❌ Erreur : ${err.message}. Veuillez vérifier que le serveur est démarré et que la clé API Groq est configurée.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  // Permet d'envoyer le message en appuyant sur "Entrée" (sans Shift), pour une expérience de chat fluide et rapide, tout en permettant les sauts de ligne avec Shift+Enter.
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Toggle Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-br from-[#7ED957] to-[#4fa82a] text-black font-black shadow-2xl shadow-[#7ED957]/30 hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Ouvrir le chatbot IA"
        >
          <Sparkles size={20} className="animate-pulse" />
          <span className="text-sm tracking-tight">Assistant IA</span>
          <MessageCircle size={18} />
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-[2.5rem] shadow-2xl border transition-all duration-300 ${
            isMinimized ? "h-[60px]" : "h-[560px]"
          } w-[360px] overflow-hidden backdrop-blur-xl ${
            isDark
              ? "bg-gray-900/80 border-white/10 text-white"
              : "bg-white/70 border-white/40 text-slate-900 shadow-[#7ED957]/10"
          }`}
          style={{ 
            boxShadow: isDark 
              ? "0 25px 60px -15px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)" 
              : "0 25px 60px -15px rgba(126,217,87,0.15), inset 0 1px 0 rgba(255,255,255,0.6)"
          }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 flex-shrink-0 border-b ${isDark ? "bg-gray-900/50 border-white/5" : "bg-white border-gray-100"}`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                <Bot size={18} className={isDark ? "text-white" : "text-gray-600"} />
              </div>
              <div>
                <p className={`font-bold text-[14px] leading-tight tracking-tight ${isDark ? "text-white" : "text-gray-800"}`}>Elzei IA</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized((v) => !v)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-400"}`}
                aria-label="Minimiser"
              >
                <ChevronDown size={16} className={`transition-transform ${isMinimized ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={resetChat}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-400"}`}
                title="Nouvelle conversation"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-400"}`}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Voice Settings Panel */}
          {!isMinimized && showSettings && (
            <div className={`px-4 py-3 border-b flex items-center justify-between gap-4 ${isDark ? "bg-gray-800/50 border-white/5" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsAutoVocal(!isAutoVocal)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${isAutoVocal ? "bg-[#7ED957] text-black" : "bg-gray-700/30 text-gray-400"}`}
                >
                  {isAutoVocal ? <Volume2 size={12} /> : <VolumeX size={12} />}
                  Voix {isAutoVocal ? "ON" : "OFF"}
                </button>
                <button 
                  onClick={() => setIsAutoSubmit(!isAutoSubmit)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${isAutoSubmit ? "bg-[#7ED957] text-black" : "bg-gray-700/30 text-gray-400"}`}
                >
                  <Zap size={12} />
                  Auto-Envoi {isAutoSubmit ? "ON" : "OFF"}
                </button>
                {isSpeaking && (
                  <button 
                    onClick={stopSpeaking}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold bg-red-500 text-white animate-pulse"
                  >
                    <Square size={12} fill="currentColor" />
                    STOP
                  </button>
                )}
              </div>
              <p className="text-[10px] opacity-40 italic">Paramètres voix</p>
            </div>
          )}

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {/* Welcome & Suggested Questions (Hostinger/Kodee Style) */}
                {messages.length === 1 && (
                  <div className="flex flex-col items-center py-6">
                    <h1 className="text-2xl font-bold mb-1">Bonjour 👋</h1>
                    <p className="text-gray-500 mb-6 text-center px-4 text-sm">Comment puis-je vous aider aujourd'hui ?</p>
                    
                    <div className="w-full space-y-1">
                      {SUGGESTED_QUESTIONS.map((question, idx) => (
                        <div key={idx} className="group/q">
                          {idx > 0 && <div className={`mx-4 border-t ${isDark ? "border-gray-800" : "border-gray-100"}`}></div>}
                          <button
                            onClick={() => {
                              setInput(question);
                              setTimeout(() => sendMessage(), 50);
                            }}
                            className={`w-full flex items-center gap-3 px-5 py-3 transition-all text-left ${
                              isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg transition-transform group-hover/q:scale-110 ${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                              <ArrowUpRight size={16} />
                            </div>
                            <span className={`text-[14px] font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                              {question}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Normal Message History (if more than welcome) */}
                {messages.length > 1 && messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        msg.role === "user"
                          ? "bg-[#7ED957] text-black"
                          : isDark
                          ? "bg-gray-700 text-gray-300"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    {/* Bubble */}
                    <div className="flex flex-col max-w-[80%] gap-1">
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed relative group/msg ${
                          msg.role === "user"
                            ? "bg-[#7ED957] text-black font-medium rounded-tr-sm"
                            : isDark
                            ? "bg-gray-800 text-gray-100 rounded-tl-sm"
                            : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm"
                        }`}
                      >
                        {renderText(msg.text)}
                        
                        {msg.role === "assistant" && (
                          <button
                            onClick={() => copyToClipboard(msg.text, i)}
                            className={`absolute -right-8 top-0 p-1.5 rounded-lg opacity-0 group-hover/msg:opacity-100 transition-all ${
                              isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-slate-100 text-slate-400"
                            }`}
                            title="Copier la réponse"
                          >
                            {copiedIndex === i ? <Check size={14} className="text-[#7ED957]" /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading bubble (Typing Animation) */}
                {isLoading && (
                  <div className="flex gap-2.5 items-end">
                    <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${isDark ? "bg-gray-800" : "bg-white shadow-sm border border-slate-100"}`}>
                      <Bot size={16} className={isDark ? "text-gray-400" : "text-slate-500"} />
                    </div>
                    <div className={`px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center ${isDark ? "bg-gray-800" : "bg-white border border-slate-100 shadow-sm"}`}>
                      <div className="w-1.5 h-1.5 bg-[#7ED957] rounded-full animate-[bounce_1s_infinite_100ms]"></div>
                      <div className="w-1.5 h-1.5 bg-[#7ED957] rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                      <div className="w-1.5 h-1.5 bg-[#7ED957] rounded-full animate-[bounce_1s_infinite_300ms]"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area (Hostinger Style) */}
              <div className={`px-4 pb-4 pt-1 flex-shrink-0 ${isDark ? "bg-gray-900" : "bg-white"}`}>
                <div 
                  className={`flex flex-col gap-0.5 rounded-[2rem] border transition-all duration-200 focus-within:ring-2 p-1 ${
                    isDark 
                    ? "bg-gray-800 border-gray-700 focus-within:ring-white/10" 
                    : "bg-white border-gray-200 focus-within:ring-gray-100 shadow-lg shadow-gray-100/50"
                  }`}
                >
                  <textarea
                    ref={inputRef}
                    rows={1}
                    className="flex-1 bg-transparent outline-none resize-none text-[14px] p-3 placeholder:text-gray-400 leading-tight"
                    placeholder="Posez votre question à Elzei IA..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  
                  <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-transparent">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-full transition-all ${
                          showSettings 
                          ? "bg-[#7ED957] text-black" 
                          : isDark ? "hover:bg-gray-700 text-gray-500" : "hover:bg-slate-100 text-slate-400"
                        }`}
                        title="Paramètres"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={startListening}
                        onMouseUp={stopListening}
                        className={`p-2 rounded-full transition-all ${
                          isListening 
                          ? "bg-red-500 text-white animate-pulse" 
                          : isDark ? "hover:bg-gray-700 text-gray-500" : "hover:bg-slate-100 text-slate-400"
                        }`}
                        title="Micro"
                      >
                        <Mic size={16} />
                      </button>
                    </div>

                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className={`p-3 rounded-full transition-all flex items-center justify-center ${
                        !input.trim() || isLoading
                        ? (isDark ? "bg-gray-700 text-gray-500" : "bg-gray-100 text-gray-300")
                        : "bg-[#7ED957] text-black hover:scale-105 active:scale-95 shadow-md"
                      }`}
                      aria-label="Envoyer"
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={20} />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">Elzei IA peut faire des erreurs. Vérifiez les réponses.</p>
              </div>
              
            </>
          )}
          
        </div>
      )}
    </>
  );
}
