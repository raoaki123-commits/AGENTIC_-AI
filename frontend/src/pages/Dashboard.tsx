import React from "react";
import { 
  Cpu, 
  Sliders, 
  Braces, 
  BookOpen, 
  Bot, 
  ArrowRight,
  BookOpenCheck,
  Award,
  BookMarked
} from "lucide-react";
import type { ProviderStatus } from "../services/api";

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  backendStatus: ProviderStatus | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, backendStatus }) => {
  const stats = [
    { 
      label: "Notes Uploaded", 
      value: backendStatus?.rag.documents_count ?? 0, 
      desc: "Source PDF documents",
      color: "text-brand-blue border-brand-blue/30" 
    },
    { 
      label: "Indexed Chunks", 
      value: backendStatus?.rag.total_chunks ?? 0, 
      desc: "Semantic text fragments",
      color: "text-brand-cyan border-brand-cyan/30" 
    },
    { 
      label: "RAG Retrieval Math", 
      value: backendStatus?.rag.vector_type === "tfidf" ? "TF-IDF (Local)" : "Cosine Neural", 
      desc: "Active vector metric",
      color: "text-brand-purple border-brand-purple/30" 
    },
  ];

  const modules = [
    {
      id: "inference",
      title: "LLM Inference Explorer",
      desc: "Visualize how text turns into tokens, positional embeddings, and how the model computes next-token logits autoregressively.",
      icon: Cpu,
      color: "border-brand-blue/20 hover:border-brand-blue/50",
      accent: "bg-brand-blue",
      badge: "Module 1"
    },
    {
      id: "sampling",
      title: "Sampling Playground",
      desc: "Compare Greedy, Temperature, Top-K, and Top-P decoding side-by-side to learn how randomness and creativity are mathematical values.",
      icon: Sliders,
      color: "border-brand-purple/20 hover:border-brand-purple/50",
      accent: "bg-brand-purple",
      badge: "Module 2"
    },
    {
      id: "structured",
      title: "Structured JSON Lab",
      desc: "Test how unstructured data is extracted into schema-validated JSON outputs, ready for software system APIs.",
      icon: Braces,
      color: "border-brand-cyan/20 hover:border-brand-cyan/50",
      accent: "bg-brand-cyan",
      badge: "Module 3"
    },
    {
      id: "notes",
      title: "Notes Tutor (PDF RAG)",
      desc: "Upload lecture slides or syllabus PDFs, parse them locally, and test queries grounded by semantic similarity source citations.",
      icon: BookMarked,
      color: "border-emerald-500/20 hover:border-emerald-500/50",
      accent: "bg-emerald-500",
      badge: "Module 4"
    },
    {
      id: "agent",
      title: "Agentic Study Assistant",
      desc: "Orchestrate multi-step workflows to automatically generate quizzes, 7-day revision plans, slide outline helpers, and mini hackathon projects.",
      icon: Bot,
      color: "border-rose-500/20 hover:border-rose-500/50",
      accent: "bg-rose-500",
      badge: "Module 5"
    }
  ];

  const syllabusTopics = [
    { title: "Subword Tokenization", desc: "How raw strings are mapped to subwords using byte pairs (BPE) and encoded as IDs.", status: "Core 01" },
    { title: "Query, Key, Value Vectors", desc: "The projection of embeddings into Query, Key, and Value vectors to compute attention scores.", status: "Core 02" },
    { title: "Autoregressive Loop", desc: "The concept of appending predicted tokens back into inputs to forecast the subsequent word.", status: "Core 03" },
    { title: "Decoding Hyperparameters", desc: "Controlling probability distribution entropy via temperature and token exclusions.", status: "Core 04" },
    { title: "Grounded Prompting", desc: "Preventing model hallucination by embedding source-retrieved facts into systemic contexts.", status: "Core 05" },
    { title: "Agentic Decompositions", desc: "How LLM tasks are broken down into plans, lookups, and structured aggregates.", status: "Core 06" },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* 1. HERO SECTION */}
      <div className="relative p-8 rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/40">
        {/* Background glow meshes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-purple/10 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20">
            <Award className="w-3.5 h-3.5" />
            <span>Interactive GenAI & LLM Syllabus Sandbox</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Explore the Internals of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple text-glow-cyan">
              Generative & Agentic AI
            </span>
          </h1>
          
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Welcome to GenAI Copilot. This dashboard is built to visualize token-by-token text generation, compare sampling hyperparameters, validate JSON schemas, parse lecture notes, and orchestrate multi-step study agent workflows.
          </p>

          <div className="pt-2 flex gap-4">
            <button
              onClick={() => setActiveTab("inference")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-lg shadow-brand-blue/20 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              Start LLM Visualizer
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-all flex items-center gap-1.5"
            >
              Upload Study Notes
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900 flex flex-col justify-between h-32 relative overflow-hidden group">
            {/* Soft decorative hover line */}
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800 transition-all duration-300 group-hover:bg-brand-cyan" />
            <span className="text-xs text-slate-500 font-mono tracking-wider">{stat.label.toUpperCase()}</span>
            <span className="text-3xl font-extrabold text-white my-1">{stat.value}</span>
            <span className="text-[10px] text-slate-500 font-mono">{stat.desc}</span>
          </div>
        ))}
      </div>

      {/* 3. APP MODULES LINKS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="w-5 h-5 text-brand-purple" />
          <h3 className="text-lg font-bold text-slate-100">Interactive Laboratories</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div 
                key={mod.id}
                onClick={() => setActiveTab(mod.id)}
                className={`p-6 rounded-2xl glass-panel border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] group ${mod.color}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl ${mod.accent} text-white shadow-md shadow-black/30`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded-full border border-slate-900">
                      {mod.badge}
                    </span>
                  </div>
                  
                  <h4 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">
                    {mod.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    {mod.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-white font-semibold pt-4">
                  Open Workspace
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SYLLABUS TOPICS SYNOPSIS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-cyan" />
          <h3 className="text-lg font-bold text-slate-100">GenAI / Agentic Syllabus Mapping</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {syllabusTopics.map((topic, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-950/20 border border-slate-900/60 flex items-start gap-4">
              <span className="text-[9px] font-bold font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-brand-cyan">
                {topic.status}
              </span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-200">{topic.title}</h4>
                <p className="text-[11px] text-slate-500 leading-normal">{topic.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
