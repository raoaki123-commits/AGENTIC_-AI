import React, { useState } from "react";
import { Bot, Play, RefreshCw, FileText, CheckCircle2, AlertTriangle, Layers, Download } from "lucide-react";
import { api } from "../services/api";
import type { AgentReasoningStep, GroundedSource } from "../services/api";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

interface AgentMode {
  id: string;
  name: string;
  desc: string;
  placeholder: string;
  badge: string;
}

export const AgenticAssistant: React.FC = () => {
  const modes: AgentMode[] = [
    {
      id: "teach_topic",
      name: "Teach Concept",
      desc: "Deep-dives into a topic, explaining with analogies, beginner definitions, math, and advanced frontiers.",
      placeholder: "e.g., Explain Rotary Positional Encodings (RoPE)",
      badge: "Tutor"
    },
    {
      id: "revision_plan",
      name: "Revision Planner",
      desc: "Analyzes notes context to generate a structured, active recall study schedule.",
      placeholder: "e.g., Make a 5-day study plan for Transformer blocks",
      badge: "Coach"
    },
    {
      id: "project_idea",
      name: "Hackathon Projects",
      desc: "Translates syllabus items into a modular, hands-on coding project blueprint.",
      placeholder: "e.g., Design a mini-project about text embeddings similarity search",
      badge: "Mentor"
    },
    {
      id: "presentation_helper",
      name: "Presentation Planner",
      desc: "Structures slide deck outlines with visual suggestions, speaker scripts, and key points.",
      placeholder: "e.g., Outline a 5-slide deck on Attention mechanisms",
      badge: "Consultant"
    }
  ];

  const [activeModeId, setActiveModeId] = useState<string>(modes[0].id);
  const [task, setTask] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reasoningLogs, setReasoningLogs] = useState<AgentReasoningStep[]>([]);
  const [finalOutput, setFinalOutput] = useState<string>("");
  const [sources, setSources] = useState<GroundedSource[]>([]);

  const handleRunAgent = async () => {
    if (!task.trim()) return;

    setIsLoading(true);
    setReasoningLogs([
      {
        title: "Agent Activation",
        status: "pending",
        message: "Booting agentic planner workspace. Decomposing prompt directives..."
      }
    ]);
    setFinalOutput("");
    setSources([]);

    try {
      const data = await api.runAgentTask(activeModeId, task);
      setReasoningLogs(data.steps);
      setFinalOutput(data.output);
      setSources(data.sources);
    } catch (e: any) {
      console.error(e);
      setReasoningLogs(prev => [
        ...prev,
        {
          title: "Agent Fatal Error",
          status: "error",
          message: e.message || "Failed executing study workflow plan."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!finalOutput) return;
    const blob = new Blob([finalOutput], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeModeId}_study_guide.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeMode = modes.find(m => m.id === activeModeId) || modes[0];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. AGENT SELECTOR AND TASK FORM */}
      <div className="glass-panel p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-brand-purple" />
            Agentic Planner Workspace
          </h3>
          <p className="text-xs text-slate-400">
            Select a specialized study workflow mode, enter your goal, and watch the agent retrieve notes context and synthesize custom syllabus materials.
          </p>
        </div>

        {/* Mode cards list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modes.map((m) => {
            const isSelected = activeModeId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => {
                  setActiveModeId(m.id);
                  setTask("");
                  setFinalOutput("");
                  setReasoningLogs([]);
                }}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] select-none
                  ${isSelected 
                    ? "bg-slate-900 border-brand-purple shadow shadow-brand-purple/20 scale-102" 
                    : "bg-slate-950/60 border-slate-900 hover:border-slate-800"
                  }
                `}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded font-mono
                      ${isSelected 
                        ? "bg-brand-purple/25 text-brand-purple border border-brand-purple/30" 
                        : "bg-slate-950 text-slate-500 border border-slate-900"
                      }
                    `}>
                      {m.badge}
                    </span>
                  </div>
                  <h4 className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-350"}`}>
                    {m.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-1">
                    {m.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input box */}
        <div className="space-y-4 border-t border-slate-850 pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder={activeMode.placeholder}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-850 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-brand-purple"
            />
            <button
              onClick={handleRunAgent}
              disabled={isLoading || !task.trim()}
              className="px-6 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-md shadow-brand-purple/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all cursor-pointer min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Agent
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. REASONING CONSOLE AND FINAL OUTPUT */}
      {(reasoningLogs.length > 0 || finalOutput) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel: Reasoning Logs (1 column) */}
          <div className="glass-panel p-6 flex flex-col h-[550px]">
            <div className="border-b border-slate-850 pb-4 mb-4 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">AGENT REASONING CONSOLE</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 font-mono text-[11px] leading-relaxed">
              {reasoningLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border bg-slate-950/45 space-y-1.5
                    ${log.status === "error" 
                      ? "border-rose-900/40 text-rose-350" 
                      : log.status === "warning" 
                        ? "border-amber-900/40 text-amber-300"
                        : "border-slate-850 text-slate-350"
                    }
                  `}
                >
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1">
                    <span className="font-bold text-slate-200">🤖 Step {idx + 1}: {log.title}</span>
                    {log.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {log.status === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    {log.status === "pending" && <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-purple shrink-0" />}
                  </div>
                  <p className="text-slate-400 font-sans text-[10px] leading-relaxed">
                    {log.message}
                  </p>
                </div>
              ))}
              
              {isLoading && (
                <div className="p-3 rounded-lg border border-dashed border-slate-800 text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-purple" />
                  <span>Synthesizing output...</span>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Final study guide output (2 columns) */}
          <div className="lg:col-span-2 glass-panel p-6 flex flex-col h-[550px]">
            <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-4 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">GENERATED ROADMAP</span>
              
              {finalOutput && (
                <button
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save as Markdown
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 select-text">
              {finalOutput ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <MarkdownRenderer content={finalOutput} />
                  
                  {/* Grounded sources footer */}
                  {sources.length > 0 && (
                    <div className="pt-6 mt-6 border-t border-slate-900/80">
                      <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider block mb-2">GGROUNDED SOURCE NOTES CHUNKS:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-mono">
                        {sources.map((src, idx) => (
                          <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-900 text-slate-400">
                            <strong>{idx+1}. {src.metadata.source}</strong> (Page {src.metadata.page})
                            <p className="text-[9px] text-slate-500 truncate mt-1">"{src.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 text-xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-700 animate-pulse" />
                  <span>The final structured study guide will render in this viewport.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 3. AGENTIC SYLLABUS THEORY CARD */}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
          <Layers className="w-5 h-5 text-brand-purple" />
          Syllabus Theory: Inside Agentic Workflows
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-2">
            <span className="text-[10px] font-bold font-mono text-brand-blue uppercase bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-full">
              Phase 1: Intent parsing
            </span>
            <h5 className="text-xs font-bold text-slate-200">Decomposition</h5>
            <p className="text-[11px] text-slate-500 leading-normal">
              Instead of generating an answer instantly, the assistant interprets whether the user requires lecture context, filters syllabus queries, and decides which modular template framework matches the intent.
            </p>
          </div>
          
          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-2">
            <span className="text-[10px] font-bold font-mono text-brand-cyan uppercase bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-full">
              Phase 2: RAG Grounding
            </span>
            <h5 className="text-xs font-bold text-slate-200">Contextual Injection</h5>
            <p className="text-[11px] text-slate-500 leading-normal">
              The agent runs semantic searches against the indexed vector database, retrieves exact slide fragments, ranks relevance scores, and shapes the context payload before invoking the generative models.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-2">
            <span className="text-[10px] font-bold font-mono text-brand-purple uppercase bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-full">
              Phase 3: Aggregation
            </span>
            <h5 className="text-xs font-bold text-slate-200">Synthesis & Validation</h5>
            <p className="text-[11px] text-slate-500 leading-normal">
              The agent formats structural milestones (markdown roadmaps, slides schedules) or parses structured arrays (quizzes) using Pydantic syntax validators, outputting clean, parsed materials.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
