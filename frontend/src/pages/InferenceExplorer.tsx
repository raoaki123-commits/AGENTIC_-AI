import React, { useState, useEffect, useRef } from "react";
import { Cpu, Play, Square, RefreshCw, Layers, Sparkles, HelpCircle } from "lucide-react";
import { api } from "../services/api";
import type { InferenceResponse, GenerationStep, TokenDetails } from "../services/api";
import { FlowDiagram } from "../components/FlowDiagram";

interface InferenceExplorerProps {
  backendStatus: any;
}

export const InferenceExplorer: React.FC<InferenceExplorerProps> = () => {
  const [prompt, setPrompt] = useState<string>("Generative Artificial Intelligence is a core technology");
  const [maxTokens, setMaxTokens] = useState<number>(15);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<InferenceResponse | null>(null);
  
  // Autoregressive Animation State
  const [animatedTokens, setAnimatedTokens] = useState<string[]>([]);
  const [animatedSteps, setAnimatedSteps] = useState<GenerationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(300); // ms per token
  
  const timerRef = useRef<any>(null);

  // Selected token highlight state
  const [hoveredPromptToken, setHoveredPromptToken] = useState<TokenDetails | null>(null);

  // Pre-made prompts for students
  const presetPrompts = [
    "Attention mechanism works by calculating",
    "Reinforcement learning from human feedback is used to",
    "Transformer neural networks process language using",
  ];

  const handleRunInference = async (customPrompt?: string) => {
    const textToRun = customPrompt || prompt;
    if (!textToRun.trim()) return;

    setIsLoading(true);
    setResponse(null);
    setAnimatedTokens([]);
    setAnimatedSteps([]);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const data = await api.runInference(textToRun, temperature, 50, 0.9, maxTokens);
      setResponse(data);
      
      // Start autoregressive animation playback
      if (data.steps && data.steps.length > 0) {
        setIsPlaying(true);
        let currentIdx = 0;
        
        timerRef.current = setInterval(() => {
          setAnimatedSteps(prev => [...prev, data.steps[currentIdx]]);
          setAnimatedTokens(prev => [...prev, data.steps[currentIdx].chosen_token]);
          setCurrentStepIndex(currentIdx);
          
          currentIdx++;
          if (currentIdx >= data.steps.length) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
          }
        }, playbackSpeed);
      }
    } catch (e) {
      console.error(e);
      alert("Failed running inference. Ensure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  // Adjust playback speed on the fly
  useEffect(() => {
    if (isPlaying && response && timerRef.current) {
      clearInterval(timerRef.current);
      
      let currentIdx = animatedSteps.length;
      if (currentIdx >= response.steps.length) {
        setIsPlaying(false);
        return;
      }
      
      timerRef.current = setInterval(() => {
        setAnimatedSteps(prev => [...prev, response.steps[currentIdx]]);
        setAnimatedTokens(prev => [...prev, response.steps[currentIdx].chosen_token]);
        setCurrentStepIndex(currentIdx);
        
        currentIdx++;
        if (currentIdx >= response.steps.length) {
          setIsPlaying(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, playbackSpeed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playbackSpeed, isPlaying, response, animatedSteps]);

  const handleStopAnimation = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleResetAnimation = () => {
    setAnimatedTokens([]);
    setAnimatedSteps([]);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Instantly fill all
    if (response) {
      setAnimatedSteps(response.steps);
      setAnimatedTokens(response.steps.map(s => s.chosen_token));
      setCurrentStepIndex(response.steps.length - 1);
    }
  };

  const selectedStepDetails = response?.steps[currentStepIndex];

  // Helper to color token chips dynamically
  const getTokenColorClass = (index: number) => {
    return `token-chip-${index % 8}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. INPUT FORM */}
      <div className="glass-panel p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-blue" />
            Query Encoder Context
          </h3>
          <p className="text-xs text-slate-400">
            Enter a prompt sequence to trigger the autoregressive next-token calculation pipeline.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter starting prompt text..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-brand-blue"
            />
            <button
              onClick={() => handleRunInference()}
              disabled={isLoading || !prompt.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-md shadow-brand-blue/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Inference
                </>
              )}
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Demo Prompts:</span>
            {presetPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(p);
                  handleRunInference(p);
                }}
                className="text-xs bg-slate-950/65 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                "{p}..."
              </button>
            ))}
          </div>
        </div>

        {/* Hyperparameters slider row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-850 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">MAX GENERATED TOKENS</span>
              <span className="text-brand-cyan font-bold font-mono">{maxTokens}</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="40" 
              value={maxTokens} 
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-cyan" 
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium font-sans">TEMPERATURE</span>
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
          </div>
        </div>
      </div>

      {/* 2. RESULTS CONTAINER */}
      {response && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT/MID MAIN PANEL: Tokenization and Text growth */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Input Tokenizer Panel */}
            <div className="glass-panel p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono">
                <Layers className="w-4 h-4 text-brand-cyan" />
                Step 1: Input Subword Tokenization
              </h4>
              
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {response.prompt_tokens.map((tok, idx) => {
                    const isHovered = hoveredPromptToken?.id === tok.id;
                    return (
                      <span
                        key={idx}
                        onMouseEnter={() => setHoveredPromptToken(tok)}
                        onMouseLeave={() => setHoveredPromptToken(null)}
                        className={`px-2 py-1 rounded-md text-xs font-mono font-medium transition-all duration-150 cursor-help ${getTokenColorClass(idx)}
                          ${isHovered ? "ring-2 ring-brand-cyan scale-105" : ""}
                        `}
                      >
                        {tok.text}
                      </span>
                    );
                  })}
                </div>

                {/* Token stats info */}
                <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-900 pt-3">
                  <span>Vocabulary Model: <strong className="text-slate-350">tiktoken (cl100k_base)</strong></span>
                  <span>Encoded Count: <strong className="text-brand-cyan">{response.prompt_token_count} Tokens</strong></span>
                </div>
              </div>

              {hoveredPromptToken && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-xs font-mono flex justify-between animate-fade-in">
                  <div>
                    <span className="text-slate-500 mr-2">Token String:</span>
                    <span className="text-brand-cyan font-bold">"{hoveredPromptToken.text}"</span>
                  </div>
                  <div>
                    <span className="text-slate-500 mr-2">Integer ID:</span>
                    <span className="text-brand-purple font-bold">{hoveredPromptToken.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 mr-2">Char Index:</span>
                    <span className="text-slate-300">{hoveredPromptToken.start}–{hoveredPromptToken.end}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Next Token Step Visual Flow SVG */}
            <div className="glass-panel p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono">
                <Sparkles className="w-4 h-4 text-brand-purple" />
                Step 2: Transformer Inference Pipeline
              </h4>
              <FlowDiagram />
            </div>

            {/* Autoregressive Console Output */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-300 uppercase font-mono">
                  Step 3: Autoregressive Next-Token Loop
                </h4>
                
                {/* Playback Controls */}
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-xl border border-slate-850">
                  <button
                    onClick={isPlaying ? handleStopAnimation : () => handleRunInference()}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title={isPlaying ? "Pause playback" : "Re-run inference"}
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleResetAnimation}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Skip to end"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono border-l border-slate-800 pl-2">
                    SPEED:
                  </span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="bg-transparent text-[10px] text-brand-cyan font-mono focus:outline-none cursor-pointer"
                  >
                    <option value="600">0.5x</option>
                    <option value="300">1.0x</option>
                    <option value="100">3.0x</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Console window */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-900 font-mono text-sm leading-relaxed min-h-[140px] flex flex-col justify-between select-text">
                <div>
                  {/* Prompt segment */}
                  <span className="text-slate-500">{prompt}</span>
                  
                  {/* Generated segment */}
                  <span className="text-slate-100 font-bold border-l-2 border-brand-cyan/40 pl-1">
                    {animatedTokens.map((token, index) => (
                      <span 
                        key={index}
                        onClick={() => setCurrentStepIndex(index)}
                        className={`inline-block mx-0.5 rounded px-0.5 border cursor-pointer transition-all duration-200
                          ${currentStepIndex === index 
                            ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-sm shadow-brand-cyan/20" 
                            : "bg-slate-900/50 hover:bg-slate-900 border-slate-900 hover:border-slate-850"
                          }
                        `}
                      >
                        {token}
                      </span>
                    ))}
                  </span>
                  {/* Blinking cursor */}
                  {isPlaying && <span className="inline-block w-1.5 h-4 bg-brand-cyan ml-0.5 animate-pulse" />}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900/80 pt-4 mt-6">
                  <span>Generating: {animatedTokens.length} / {response.steps.length} Tokens</span>
                  {response.simulated && (
                    <span className="text-amber-500 font-semibold bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/30">
                      Simulated probability details (No API key found)
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE PANEL: Probabilities distribution list */}
          <div className="glass-panel p-6 space-y-6 flex flex-col">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-300 uppercase font-mono">
                Logits Probability Distribution
              </h4>
              <p className="text-xs text-slate-500">
                Shows the Softmax probability scores of candidates at generated index: <strong className="text-brand-purple">Step {currentStepIndex + 1}</strong>.
              </p>
            </div>

            {selectedStepDetails ? (
              <div className="flex-1 space-y-4">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Chosen token:</span>
                  <span className="text-brand-cyan font-bold bg-slate-900 px-2.5 py-1 rounded border border-slate-850">
                    "{selectedStepDetails.chosen_token}" (ID: {selectedStepDetails.chosen_id})
                  </span>
                </div>

                {/* Candidate list bars */}
                <div className="space-y-3.5">
                  {selectedStepDetails.top_candidates.map((cand, idx) => {
                    const isChosen = cand.token === selectedStepDetails.chosen_token;
                    const percent = Math.round(cand.probability * 100);
                    
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className={isChosen ? "text-brand-cyan font-bold" : "text-slate-400"}>
                            {idx + 1}. "{cand.token}"
                            <span className="text-[10px] text-slate-500 font-normal ml-1">(ID: {cand.id})</span>
                          </span>
                          <span className={isChosen ? "text-brand-cyan font-bold" : "text-slate-300"}>
                            {(cand.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        {/* Custom horizontal slider bar */}
                        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full transition-all duration-500 
                              ${isChosen 
                                ? "bg-gradient-to-r from-brand-blue to-brand-cyan shadow shadow-brand-cyan/20" 
                                : "bg-slate-700/60"
                              }
                            `}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Step indicator bubbles selector */}
                <div className="pt-4 border-t border-slate-900/80">
                  <span className="text-[10px] text-slate-500 font-mono block mb-2">GENERATED TIMELINE:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {response.steps.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleStopAnimation();
                          setCurrentStepIndex(idx);
                        }}
                        className={`w-6 h-6 rounded-md font-mono text-[10px] font-bold transition-all duration-150 active:scale-90 flex items-center justify-center border cursor-pointer
                          ${currentStepIndex === idx 
                            ? "bg-brand-purple text-white border-brand-purple" 
                            : "bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-400"
                          }
                        `}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs">
                <HelpCircle className="w-8 h-8 text-slate-700 mb-2" />
                Select a step on the timeline or click Run Inference to check logit scores.
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. SYLLABUS CONCEPT CARDS */}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
          <Layers className="w-5 h-5 text-brand-purple" />
          Syllabus Notes: Understanding the Next-Token Flow
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-2">
            <span className="text-[10px] font-bold font-mono text-brand-blue uppercase bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-full">
              Syllabus Core 01
            </span>
            <h5 className="text-xs font-bold text-slate-200">Byte-Pair encoding (BPE)</h5>
            <p className="text-[11px] text-slate-500 leading-normal">
              Instead of tokenizing entire words (too sparse) or characters (too granular), models merge frequent byte patterns to compile subwords. This maps spelling variations cleanly and resolves Out-of-Vocabulary (OOV) errors.
            </p>
          </div>
          
          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-2">
            <span className="text-[10px] font-bold font-mono text-brand-cyan uppercase bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-full">
              Syllabus Core 02
            </span>
            <h5 className="text-xs font-bold text-slate-200">High-Dim Embeddings</h5>
            <p className="text-[11px] text-slate-500 leading-normal">
              Representing words in coordinate vectors, e.g. 1536 dimensions. Multi-layer perceptrons adjust coordinate coordinates, placing semantic duplicates (e.g. "king" and "queen") adjacent in distance measurements.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-2">
            <span className="text-[10px] font-bold font-mono text-brand-purple uppercase bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-full">
              Syllabus Core 03
            </span>
            <h5 className="text-xs font-bold text-slate-200">Attention Matrices</h5>
            <p className="text-[11px] text-slate-500 leading-normal">
              Self-attention maps context relevance. For a query token, it calculates alignment dot products with all other sequence tokens (keys), then outputs a weighted summation of value representations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-2">
            <span className="text-[10px] font-bold font-mono text-rose-500 uppercase bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-full">
              Syllabus Core 04
            </span>
            <h5 className="text-xs font-bold text-slate-200">Autoregressive Loop</h5>
            <p className="text-[11px] text-slate-500 leading-normal">
              An LLM has no memory of the paragraph structure it is outputting; it only ever predicts *one single token* at a time. The newly predicted token is added to the tail of the prompt, feeding the subsequent generation loop.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
