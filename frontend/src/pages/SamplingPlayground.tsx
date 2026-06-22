import React, { useState } from "react";
import { Sliders, Play, RefreshCw, Check } from "lucide-react";
import { api } from "../services/api";
import type { SamplingResponse } from "../services/api";

export const SamplingPlayground: React.FC = () => {
  const [prompt, setPrompt] = useState<string>("In the far future, human scientists discovered a wormhole that led to");
  const [temperature, setTemperature] = useState<number>(1.5); // High by default to show variation
  const [topK, setTopK] = useState<number>(5);
  const [topP, setTopP] = useState<number>(0.3);
  const [maxTokens, setMaxTokens] = useState<number>(80);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<SamplingResponse | null>(null);

  const presetPrompts = [
    "Write a short, highly creative riddle about quantum mechanics",
    "Once upon a time in a cyberpunk metropolis, a robot butler decided to",
    "Define self-attention in a dramatic, poetic style",
  ];

  const handleCompare = async (customPrompt?: string) => {
    const textToRun = customPrompt || prompt;
    if (!textToRun.trim()) return;

    setIsLoading(true);
    setResults(null);
    try {
      const data = await api.runSampling(textToRun, temperature, topK, topP, maxTokens);
      setResults(data);
    } catch (e) {
      console.error(e);
      alert("Error generating sampling outputs. Check backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. CONTROLS PANEL */}
      <div className="glass-panel p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-purple" />
            Decoding Parameters Laboratory
          </h3>
          <p className="text-xs text-slate-400">
            Compare how different sampling strategies choose tokens from the probability distribution.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter starting prompt text..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-brand-purple resize-none"
            />
            <button
              onClick={() => handleCompare()}
              disabled={isLoading || !prompt.trim()}
              className="px-6 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-md shadow-brand-purple/20 flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-50 transition-all cursor-pointer min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Compare Outputs
                </>
              )}
            </button>
          </div>

          {/* Prompt Presets */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">PRESETS:</span>
            {presetPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(p);
                  handleCompare(p);
                }}
                className="text-xs bg-slate-950/65 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                "{p.slice(0, 40)}..."
              </button>
            ))}
          </div>
        </div>

        {/* SLIDERS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-slate-850 pt-4">
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium font-sans">TEMPERATURE (T)</span>
              <span className="text-brand-purple font-bold font-mono">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-purple"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Scales logits before Softmax. T &gt; 1 increases diversity (higher entropy); T &lt; 0.1 approaches greedy choice.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium font-sans">TOP-K</span>
              <span className="text-brand-cyan font-bold font-mono">{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Discards all tokens outside the top K highest-probability items. Helps lock the output into consistent themes.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium font-sans">TOP-P (NUCLEUS)</span>
              <span className="text-brand-blue font-bold font-mono">{topP}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={topP}
              onChange={(e) => setTopP(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-blue"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Keeps only the smallest pool of tokens whose sum probability exceeds P. Dynamic scaling of vocabulary constraints.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium font-sans">MAX TOKENS</span>
              <span className="text-emerald-500 font-bold font-mono">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Caps the length of the generated response sequence. Limits inference costs.
            </p>
          </div>

        </div>
      </div>

      {/* 2. COMPARATIVE SIDE-BY-SIDE OUTLINE */}
      {results && (
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-slate-350 uppercase font-mono tracking-wider">
            Comparative Results Bench
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. GREEDY */}
            <div className="glass-panel p-5 space-y-3 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <span className="absolute top-0 left-0 right-0 h-1 bg-slate-700" />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">1. Greedy Decoding</h5>
                  <span className="text-[9px] bg-slate-950 text-slate-400 border border-slate-900 px-2 py-0.5 rounded-full font-mono">Temp = 0</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans select-text">
                  {results.greedy}
                </p>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-900/60 pt-3 mt-4 flex items-center justify-between">
                <span>Creativity: Low</span>
                <span>Deterministic: 100%</span>
              </div>
            </div>

            {/* 2. TEMPERATURE */}
            <div className="glass-panel p-5 space-y-3 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <span className="absolute top-0 left-0 right-0 h-1 bg-brand-purple" />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-xs font-bold text-brand-purple uppercase tracking-widest font-mono">2. Temperature Scaling</h5>
                  <span className="text-[9px] bg-purple-950/20 text-purple-300 border border-purple-900/30 px-2 py-0.5 rounded-full font-mono">Temp = {temperature}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans select-text">
                  {results.temperature}
                </p>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-900/60 pt-3 mt-4 flex items-center justify-between">
                <span>Creativity: {temperature > 1.2 ? "High (Unstable)" : "Medium"}</span>
                <span>Deterministic: Low</span>
              </div>
            </div>

            {/* 3. TOP-K */}
            <div className="glass-panel p-5 space-y-3 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <span className="absolute top-0 left-0 right-0 h-1 bg-brand-cyan" />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-xs font-bold text-brand-cyan uppercase tracking-widest font-mono">3. Top-K Sampling</h5>
                  <span className="text-[9px] bg-cyan-950/20 text-cyan-300 border border-cyan-900/30 px-2 py-0.5 rounded-full font-mono">K = {topK}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans select-text">
                  {results.top_k}
                </p>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-900/60 pt-3 mt-4 flex items-center justify-between">
                <span>Creativity: Focused</span>
                <span>Deterministic: Medium</span>
              </div>
            </div>

            {/* 4. TOP-P */}
            <div className="glass-panel p-5 space-y-3 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <span className="absolute top-0 left-0 right-0 h-1 bg-brand-blue" />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-xs font-bold text-brand-blue uppercase tracking-widest font-mono">4. Top-P (Nucleus)</h5>
                  <span className="text-[9px] bg-blue-950/20 text-blue-300 border border-blue-900/30 px-2 py-0.5 rounded-full font-mono">P = {topP}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans select-text">
                  {results.top_p}
                </p>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-900/60 pt-3 mt-4 flex items-center justify-between">
                <span>Creativity: Balanced</span>
                <span>Deterministic: Dynamic</span>
              </div>
            </div>

          </div>

          {/* 3. COMPARISON EXPLAINER CHEATSHEET */}
          <div className="glass-panel p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-300 uppercase font-mono">
              Sampling Metrics Matrix
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="py-2.5 font-mono">METHOD</th>
                    <th className="py-2.5 font-mono">MATHEMATICAL RULE</th>
                    <th className="py-2.5 font-mono">PROS</th>
                    <th className="py-2.5 font-mono">CONS / RISK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  <tr>
                    <td className="py-3 font-semibold text-slate-200">Greedy</td>
                    <td className="py-3 font-mono text-[11px]">arg max(P(x))</td>
                    <td className="py-3 text-emerald-400">Fast, factual, consistent</td>
                    <td className="py-3 text-rose-400/90">Repetitive loops, dry syntax</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-brand-purple">Temperature</td>
                    <td className="py-3 font-mono text-[11px]">P'(x) = exp(l_i / T) / sum(exp(l_j / T))</td>
                    <td className="py-3 text-emerald-400">High creative range</td>
                    <td className="py-3 text-rose-400/90">Hallucinations, gibberish (T &gt; 1.5)</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-brand-cyan">Top-K</td>
                    <td className="py-3 font-mono text-[11px]">Keep tokens 1..K by score</td>
                    <td className="py-3 text-emerald-400">Locks generation into logic</td>
                    <td className="py-3 text-rose-400/90">Excludes rare contextually valid words</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-brand-blue">Top-P (Nucleus)</td>
                    <td className="py-3 font-mono text-[11px]">sum(P(x)) &gt;= threshold</td>
                    <td className="py-3 text-emerald-400">Dynamic vocabulary sizing</td>
                    <td className="py-3 text-rose-400/90">Mildly higher latency</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. EDUCATIONAL INFO CARDS */}
      {!results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-950/30 border border-slate-900 space-y-2">
            <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Greedy vs. Temperature
            </h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Greedy decoding is like taking the path of least resistance at every crossroad. It always picks the word with the highest logit. By adding Temperature scaling, we divide raw logits by \(T\) before running Softmax. A high temperature flatlines the distribution curve, allowing weaker tokens to have a fighting chance of being picked.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-950/30 border border-slate-900 space-y-2">
            <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-brand-cyan" />
              Top-K vs. Top-P (Nucleus)
            </h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Top-K uses a static count constraint (e.g. only choose from the top 5 words). Top-P dynamically grows or shrinks the candidate count depending on confidence. If the model is 99% confident in a single word, the candidate pool contains just that 1 word. If it is highly uncertain, the pool expands to include 20+ words to cover the P threshold.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
