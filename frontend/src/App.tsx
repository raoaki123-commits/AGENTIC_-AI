import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Cpu, 
  Sliders, 
  Braces, 
  BookOpen, 
  Bot, 
  Settings as SettingsIcon,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  Key
} from "lucide-react";

// API service
import { api } from "./services/api";
import type { ProviderStatus, SettingsData } from "./services/api";

// Pages
import { Dashboard } from "./pages/Dashboard";
import { InferenceExplorer } from "./pages/InferenceExplorer";
import { SamplingPlayground } from "./pages/SamplingPlayground";
import { StructuredOutput } from "./pages/StructuredOutput";
import { NotesTutor } from "./pages/NotesTutor";
import { AgenticAssistant } from "./pages/AgenticAssistant";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<ProviderStatus | null>(null);
  
  // API Keys States
  const [defaultProvider, setDefaultProvider] = useState<string>("gemini");
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [anthropicKey, setAnthropicKey] = useState<string>("");
  const [groqKey, setGroqKey] = useState<string>("");

  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Fetch backend status on mount
  const fetchStatus = async () => {
    try {
      const status = await api.getStatus();
      setBackendStatus(status);
    } catch (e) {
      console.error("Backend status check failed", e);
      setBackendStatus(null);
    }
  };

  useEffect(() => {
    // Read cached keys from LocalStorage
    const cachedProvider = localStorage.getItem("copilot_provider") || "gemini";
    const cachedGemini = localStorage.getItem("copilot_gemini_key") || "";
    const cachedOpenai = localStorage.getItem("copilot_openai_key") || "";
    const cachedAnthropic = localStorage.getItem("copilot_anthropic_key") || "";
    const cachedGroq = localStorage.getItem("copilot_groq_key") || "";

    setDefaultProvider(cachedProvider);
    setGeminiKey(cachedGemini);
    setOpenaiKey(cachedOpenai);
    setAnthropicKey(cachedAnthropic);
    setGroqKey(cachedGroq);

    // Sync cached credentials with FastAPI backend on load
    const syncSettings = async () => {
      try {
        await api.updateSettings({
          default_provider: cachedProvider,
          gemini_api_key: cachedGemini,
          openai_api_key: cachedOpenai,
          anthropic_api_key: cachedAnthropic,
          groq_api_key: cachedGroq
        });
        await fetchStatus();
      } catch (err) {
        console.error("Error syncing keys on mount:", err);
      }
    };
    syncSettings();

    // Set polling for backend status every 15s to keep document counts synced
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // 2. Handle settings saving
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsMessage(null);

    const data: SettingsData = {
      default_provider: defaultProvider,
      gemini_api_key: geminiKey,
      openai_api_key: openaiKey,
      anthropic_api_key: anthropicKey,
      groq_api_key: groqKey
    };

    try {
      await api.updateSettings(data);
      
      // Save keys in localStorage for persistence
      localStorage.setItem("copilot_provider", defaultProvider);
      localStorage.setItem("copilot_gemini_key", geminiKey);
      localStorage.setItem("copilot_openai_key", openaiKey);
      localStorage.setItem("copilot_anthropic_key", anthropicKey);
      localStorage.setItem("copilot_groq_key", groqKey);

      await fetchStatus();
      setSettingsMessage({ type: "success", text: "Configuration updated successfully!" });
      setTimeout(() => {
        setIsSettingsOpen(false);
        setSettingsMessage(null);
      }, 1200);
    } catch (err: any) {
      setSettingsMessage({ type: "error", text: err.message || "Failed to update settings." });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inference", label: "Inference Explorer", icon: Cpu },
    { id: "sampling", label: "Sampling Playground", icon: Sliders },
    { id: "structured", label: "Structured JSON Lab", icon: Braces },
    { id: "notes", label: "Notes Tutor", icon: BookOpen },
    { id: "agent", label: "Agentic Assistant", icon: Bot },
  ];

  return (
    <div className="flex min-h-screen bg-brand-dark overflow-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-950/80 border-r border-slate-900 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Logo Header */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-900 bg-slate-950/40">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue via-brand-cyan to-brand-purple flex items-center justify-center shadow-md shadow-brand-blue/20 animate-pulse-glow">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white uppercase">GenAI Copilot</h1>
              <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Jarvis v1.0</span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 active:scale-98
                    ${isActive 
                      ? "bg-gradient-to-r from-brand-blue/15 to-brand-purple/10 text-white border-l-2 border-brand-cyan shadow-md shadow-brand-blue/5" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    }
                  `}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-brand-cyan" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User / Settings Footer info */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/20 space-y-3">
          {backendStatus && (
            <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-900/40 border border-slate-850">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">PROVIDER:</span>
                <span className="text-brand-cyan font-bold uppercase">{backendStatus.active_provider}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">STATUS:</span>
                <span className={`font-semibold flex items-center gap-1 ${backendStatus.has_key_configured ? "text-emerald-400" : "text-amber-500"}`}>
                  <Activity className="w-3 h-3 animate-pulse" />
                  {backendStatus.has_key_configured ? "Online" : "Simulated"}
                </span>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-300 hover:text-white transition-all text-xs font-semibold"
          >
            <SettingsIcon className="w-4 h-4" />
            Configure Providers
          </button>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar Header */}
        <header className="h-16 border-b border-slate-900/80 bg-slate-950/60 backdrop-blur-md px-8 flex justify-between items-center z-10 shrink-0">
          <div>
            <span className="text-xs text-slate-500 font-mono tracking-wider">WORKSPACE // GENAI TUTOR</span>
            <h2 className="text-base font-bold text-slate-200 capitalize">
              {activeTab.replace("-", " ")} Workspace
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* API Status Badge */}
            {backendStatus ? (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border
                ${backendStatus.has_key_configured 
                  ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/40" 
                  : "bg-amber-950/50 text-amber-300 border-amber-800/40"
                }
              `}>
                {backendStatus.has_key_configured ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live API Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Simulated Mode (No Keys)</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-800/40">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                <span>Backend Offline</span>
              </div>
            )}
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-slate-100 transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} backendStatus={backendStatus} />}
          {activeTab === "inference" && <InferenceExplorer backendStatus={backendStatus} />}
          {activeTab === "sampling" && <SamplingPlayground />}
          {activeTab === "structured" && <StructuredOutput />}
          {activeTab === "notes" && <NotesTutor backendStatus={backendStatus} onUpdateStatus={fetchStatus} />}
          {activeTab === "agent" && <AgenticAssistant />}
        </main>
      </div>

      {/* 3. SETTINGS MODAL POPUP */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-950/60 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-cyan" />
                <h3 className="text-base font-bold text-white">LLM Provider Configuration</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              {/* Default Provider Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 font-mono">DEFAULT ACTIVE PROVIDER</label>
                <select
                  value={defaultProvider}
                  onChange={(e) => setDefaultProvider(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 focus:outline-none focus:border-brand-blue"
                >
                  <option value="gemini">Google Gemini (Recommended - Free Tier)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="groq">Groq (Llama 3)</option>
                </select>
              </div>

              <div className="border-t border-slate-850 my-2 pt-2">
                <span className="text-xs text-slate-500 font-mono block mb-3">API KEY CREDENTIALS</span>
                
                <div className="space-y-3">
                  {/* Gemini Key */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400 flex justify-between">
                      <span>Gemini API Key</span>
                      <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-cyan hover:underline">Get key (Free)</a>
                    </label>
                    <input
                      type="password"
                      placeholder="Paste Gemini key..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-850 bg-slate-950 text-slate-200 text-sm font-mono focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  {/* OpenAI Key */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400 flex justify-between">
                      <span>OpenAI API Key</span>
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-cyan hover:underline">Get key</a>
                    </label>
                    <input
                      type="password"
                      placeholder="Paste OpenAI key..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-850 bg-slate-950 text-slate-200 text-sm font-mono focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  {/* Anthropic Key */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Anthropic API Key</label>
                    <input
                      type="password"
                      placeholder="Paste Anthropic key..."
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-850 bg-slate-950 text-slate-200 text-sm font-mono focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  {/* Groq Key */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Groq API Key</label>
                    <input
                      type="password"
                      placeholder="Paste Groq key..."
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-850 bg-slate-950 text-slate-200 text-sm font-mono focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              {settingsMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold
                  ${settingsMessage.type === "success" 
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" 
                    : "bg-rose-950/40 text-rose-400 border border-rose-900/40"
                  }
                `}>
                  {settingsMessage.text}
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-slate-850 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple hover:brightness-110 text-white transition-all text-xs font-bold shadow-md shadow-brand-blue/20 flex items-center gap-1.5 active:scale-95"
                >
                  {isSavingSettings ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
