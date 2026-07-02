import React, { useState, useRef } from "react";
import { 
  BookOpen, 
  Upload, 
  Trash2, 
  Send, 
  BookOpenCheck,
  FileText,
  Layers,
  RefreshCw,
  Trophy,
  ArrowRight
} from "lucide-react";
import confetti from "canvas-confetti";

import { api } from "../services/api";
import type { ProviderStatus, GroundedSource } from "../services/api";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

interface NotesTutorProps {
  backendStatus: ProviderStatus | null;
  onUpdateStatus: () => Promise<void>;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: GroundedSource[];
  mode?: string;
}

export const NotesTutor: React.FC<NotesTutorProps> = ({ backendStatus, onUpdateStatus }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Chat States
  const [query, setQuery] = useState<string>("");
  const [chatMode, setChatMode] = useState<string>("simple");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  
  // Selected Source display detail
  const [selectedSource, setSelectedSource] = useState<GroundedSource | null>(null);
  const [activeSources, setActiveSources] = useState<GroundedSource[]>([]);

  // Quiz States
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [quizExplanation, setQuizExplanation] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. PDF File Upload Handler
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const res = await api.uploadNotes(file);
      setUploadMessage({ type: "success", text: res.message });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Update parent status stats
      await onUpdateStatus();
    } catch (err: any) {
      setUploadMessage({ type: "error", text: err.message || "Failed parsing PDF slide set." });
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Wipe Database Library
  const handleClearLibrary = async () => {
    if (!confirm("Are you sure you want to delete all uploaded notes and clear the vector database?")) return;
    try {
      await api.clearNotes();
      setChatHistory([]);
      setActiveSources([]);
      setSelectedSource(null);
      setQuizQuestions([]);
      setIsQuizActive(false);
      await onUpdateStatus();
    } catch (e) {
      alert("Error clearing vector database.");
    }
  };

  // 3. Grounded Chat Query Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setQuery("");
    
    // Add user message to history
    setChatHistory(prev => [...prev, { role: "user", text: userMessage }]);
    setIsQuerying(true);

    try {
      const res = await api.queryNotes(userMessage, chatMode);
      
      // Append assistant grounded response
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        text: res.answer, 
        sources: res.sources,
        mode: chatMode
      }]);

      // Set active source side panel references
      setActiveSources(res.sources);
      if (res.sources.length > 0) {
        setSelectedSource(res.sources[0]);
      }
    } catch (err: any) {
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        text: `Error: ${err.message || "Could not retrieve answer context."}` 
      }]);
    } finally {
      setIsQuerying(false);
    }
  };

  // 4. MCQ Quiz Generator
  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setQuizQuestions([]);
    setIsQuizActive(false);
    setQuizScore(0);
    setQuizIndex(0);
    setHasSubmittedAnswer(false);

    try {
      const res = await api.runAgentTask("quiz_generator", "Generate a 5-question multiple choice quiz testing core terms from the uploaded lecture documents.");
      if (res.quiz_questions && res.quiz_questions.length > 0) {
        setQuizQuestions(res.quiz_questions);
        setIsQuizActive(true);
      } else {
        alert("Could not extract structured quiz. Try uploading more notes or configure active API keys.");
      }
    } catch (err: any) {
      alert(`Quiz generation failed: ${err.message}`);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // 5. Submit quiz option answer
  const handleSubmitAnswer = () => {
    if (!selectedOption) return;
    
    const currentQ = quizQuestions[quizIndex];
    const isCorrect = selectedOption === currentQ.answer;

    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      // Run tiny celebration confetti
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 }
      });
    }

    setQuizExplanation(currentQ.explanation);
    setHasSubmittedAnswer(true);
  };

  // 6. Navigate next quiz item
  const handleNextQuizQuestion = () => {
    setSelectedOption("");
    setHasSubmittedAnswer(false);
    setQuizExplanation("");

    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      // Finished! Celebrate if 100% score
      if (quizScore === quizQuestions.length) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
      // Keep quiz in index = questions count to trigger result card
      setQuizIndex(quizQuestions.length);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. DOCUMENT LOADER GATE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Upload drag container */}
        <div className="glass-panel p-6 space-y-4 lg:col-span-2">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-blue" />
              Syllabus PDF Notes Uploader
            </h3>
            <p className="text-xs text-slate-400">
              Drop lecture slideshows, syllabus guides, or class note PDF documents. Text is indexed instantly.
            </p>
          </div>

          <form onSubmit={handleUpload} className="flex gap-4 items-center">
            <div className="flex-1 relative border border-dashed border-slate-800 hover:border-slate-600 bg-slate-950/40 rounded-xl px-4 py-3 flex items-center gap-2 transition-colors cursor-pointer group">
              <FileText className="w-5 h-5 text-slate-500 group-hover:text-brand-cyan" />
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="text-xs text-slate-400 font-medium">
                {file ? file.name : "Select PDF Document (Max 15MB)..."}
              </span>
            </div>

            <button
              type="submit"
              disabled={isUploading || !file}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-md shadow-brand-blue/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all cursor-pointer h-full"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Indexing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Index PDF
                </>
              )}
            </button>
          </form>

          {uploadMessage && (
            <div className={`p-3 rounded-lg text-xs font-semibold
              ${uploadMessage.type === "success" 
                ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" 
                : "bg-rose-950/40 text-rose-400 border border-rose-900/40"
              }
            `}>
              {uploadMessage.text}
            </div>
          )}
        </div>

        {/* Right Side: Document list index metrics */}
        <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">INDEXED LIBRARY</span>
              {backendStatus && backendStatus.rag.total_chunks > 0 && (
                <button
                  onClick={handleClearLibrary}
                  className="text-xs text-rose-400 hover:text-rose-350 flex items-center gap-1 font-semibold active:scale-95 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Wipe Index
                </button>
              )}
            </div>

            {backendStatus && backendStatus.rag.documents_count > 0 ? (
              <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                {backendStatus.rag.total_chunks > 0 && (
                  <div className="flex items-center justify-between text-xs p-2 rounded bg-slate-950 border border-slate-900 font-mono">
                    <span className="text-slate-400">Database Engine:</span>
                    <span className="text-brand-purple uppercase font-bold">
                      {backendStatus.rag.vector_type} vectors
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-850 rounded-xl">
                Library is currently empty. Upload a class note PDF to start.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs pt-4 border-t border-slate-900/80">
            <span className="text-slate-400 font-mono">CHUNKS: <strong className="text-brand-cyan">{backendStatus?.rag.total_chunks ?? 0}</strong></span>
            <span className="text-slate-400 font-mono">DOCUMENTS: <strong className="text-brand-purple">{backendStatus?.rag.documents_count ?? 0}</strong></span>
          </div>
        </div>

      </div>

      {/* INTERACTIVE STUDY QUIZ PANEL OVERLAY (If activated) */}
      {isQuizActive && quizQuestions.length > 0 && (
        <div className="glass-panel p-6 border-glow-purple bg-slate-900/50 space-y-6 animate-slide-in">
          
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-brand-purple" />
              Syllabus Practice Quiz
            </h4>
            
            {quizIndex < quizQuestions.length ? (
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                Question {quizIndex + 1} of {quizQuestions.length}
              </span>
            ) : (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/20">
                Exam Completed
              </span>
            )}
          </div>

          {quizIndex < quizQuestions.length ? (
            /* Quiz Solving State */
            <div className="space-y-6">
              <h5 className="text-base font-bold text-slate-100 font-sans leading-relaxed">
                {quizQuestions[quizIndex].question}
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizQuestions[quizIndex].options.map((opt: string, idx: number) => {
                  const isSelected = selectedOption === opt;
                  const isAnswer = opt === quizQuestions[quizIndex].answer;
                  
                  let optionStyles = "border-slate-850 bg-slate-950/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300";
                  if (isSelected && !hasSubmittedAnswer) {
                    optionStyles = "border-brand-purple bg-brand-purple/10 text-white";
                  } else if (hasSubmittedAnswer) {
                    if (isAnswer) {
                      optionStyles = "border-emerald-500 bg-emerald-950/30 text-emerald-300 font-semibold";
                    } else if (isSelected) {
                      optionStyles = "border-rose-500 bg-rose-950/30 text-rose-350";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => !hasSubmittedAnswer && setSelectedOption(opt)}
                      disabled={hasSubmittedAnswer}
                      className={`p-4 rounded-xl border text-left text-xs transition-all duration-200 leading-normal flex items-start gap-2 active:scale-99 cursor-pointer ${optionStyles}`}
                    >
                      <span className="font-mono text-slate-500 uppercase font-bold shrink-0">{String.fromCharCode(65 + idx)}.</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action buttons and explanation */}
              {hasSubmittedAnswer ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs text-slate-400 leading-relaxed font-sans border-l-4 border-brand-purple">
                    <strong className="text-brand-purple font-bold block mb-1">Concept Explanation:</strong>
                    {quizExplanation}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleNextQuizQuestion}
                      className="px-5 py-2 rounded-xl bg-brand-purple hover:brightness-110 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-brand-purple/20 transition-all active:scale-95 cursor-pointer"
                    >
                      {quizIndex === quizQuestions.length - 1 ? "Check Final Grade" : "Next Question"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue hover:brightness-110 text-white font-bold text-xs shadow-md shadow-brand-purple/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
                  >
                    Submit Answer
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* Quiz Score Results State */
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Trophy className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h5 className="text-lg font-bold text-slate-100">Quiz Completed!</h5>
                <p className="text-sm text-slate-400 max-w-sm">
                  You scored <strong className="text-emerald-400 text-base">{quizScore}</strong> out of <strong className="text-slate-200">{quizQuestions.length}</strong> questions correct.
                </p>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleGenerateQuiz}
                  className="px-5 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-350 hover:text-white transition-all text-xs font-semibold"
                >
                  Retake Test
                </button>
                <button
                  onClick={() => setIsQuizActive(false)}
                  className="px-5 py-2 rounded-xl bg-brand-purple hover:brightness-110 text-white font-bold text-xs shadow-md shadow-brand-purple/20 transition-all"
                >
                  Return to Chat
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 2. CHAT AND CITATIONS COLUMN MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grounded Chat Panel (2 columns) */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col h-[550px]">
          
          {/* Header & Modes */}
          <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-cyan" />
              <h4 className="text-sm font-bold text-slate-200 uppercase font-mono">Grounded Notes Tutor</h4>
            </div>

            <div className="flex items-center gap-3">
              {/* Generate Quiz Action */}
              {backendStatus && backendStatus.rag.total_chunks > 0 && !isQuizActive && (
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz}
                  className="px-3.5 py-1.5 rounded-lg border border-brand-purple/40 bg-brand-purple/15 hover:bg-brand-purple/25 text-brand-purple text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isGeneratingQuiz ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Creating quiz...
                    </>
                  ) : (
                    <>
                      <BookOpenCheck className="w-3.5 h-3.5" />
                      Quiz Me
                    </>
                  )}
                </button>
              )}

              {/* Chat Mode Selector */}
              <select
                value={chatMode}
                onChange={(e) => setChatMode(e.target.value)}
                className="bg-slate-950 border border-slate-850 text-xs text-slate-400 px-3 py-1.5 rounded-lg focus:outline-none focus:border-brand-cyan cursor-pointer"
              >
                <option value="simple">Simple Tutor</option>
                <option value="deep">Deep Research</option>
                <option value="exam">Exam Prep</option>
                <option value="builder">Builder Mode</option>
              </select>
            </div>
          </div>

          {/* Chat message logs scroll body */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scroll-smooth">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-700 animate-pulse" />
                <h5 className="text-sm font-bold text-slate-350">Classroom Grounded Assistant</h5>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Ask a question from your lecture slides! The assistant will search the notes context and cite source slides in the answers.
                </p>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 text-[10px] text-slate-500 font-mono">
                  Example: "Explain the attention mechanism equation from my notes"
                </div>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed border
                    ${msg.role === "user" 
                      ? "ml-auto bg-slate-900 border-slate-800 text-slate-100" 
                      : "bg-slate-950 border-slate-900/60 text-slate-200"
                    }
                  `}
                >
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 font-mono tracking-wider mb-2 border-b border-slate-900 pb-1 shrink-0">
                    <span>{msg.role === "user" ? "STUDENT" : "GENAI TUTOR"}</span>
                    {msg.mode && <span className="uppercase text-[8px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">{msg.mode} MODE</span>}
                  </div>
                  
                  <div className="font-sans select-text">
                    <MarkdownRenderer content={msg.text} />
                  </div>

                  {/* Clickable inline citations list at the bottom of assistant message */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3 mt-3 border-t border-slate-900/60">
                      <span className="text-[9px] text-slate-500 font-bold font-mono tracking-wide flex items-center gap-0.5">CITATIONS:</span>
                      {msg.sources.map((src, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => {
                            setSelectedSource(src);
                            setActiveSources(msg.sources || []);
                          }}
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all active:scale-95 cursor-pointer
                            ${selectedSource?.id === src.id 
                              ? "bg-brand-cyan/20 text-brand-cyan border-brand-cyan font-bold" 
                              : "bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-350 border-slate-850"
                            }
                          `}
                        >
                          {src.metadata.source} [p.{src.metadata.page}]
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isQuerying && (
              <div className="bg-slate-950 border border-slate-900/65 rounded-2xl p-4 max-w-[85%] text-xs font-semibold text-slate-500 flex items-center gap-2 font-mono">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-cyan" />
                Retrieving semantic contexts & synthesizing answer...
              </div>
            )}
          </div>

          {/* Prompt Entry Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-slate-850 mt-4 shrink-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask notes: 'Explain transformer blocks'..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-850 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-brand-cyan"
            />
            <button
              type="submit"
              disabled={isQuerying || !query.trim()}
              className="px-5 rounded-xl bg-brand-cyan hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-md shadow-brand-cyan/20 flex items-center justify-center active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Retrieved Citations Panel (1 column) */}
        <div className="glass-panel p-6 flex flex-col h-[550px]">
          <div className="space-y-1 border-b border-slate-850 pb-4 mb-4 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">RETRIEVED SOURCE DETAILS</span>
              {selectedSource && (
                <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-900 px-2 py-0.5 rounded font-mono">
                  Score: {Math.round((selectedSource.score ?? 1) * 100)}%
                </span>
              )}
            </div>
          </div>

          {selectedSource ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                {/* Meta details */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">File Name:</span>
                    <strong className="text-brand-blue truncate max-w-[150px]">{selectedSource.metadata.source}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PDF page index:</span>
                    <strong className="text-brand-purple">Page {selectedSource.metadata.page}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Snippet Length:</span>
                    <strong className="text-slate-450">{selectedSource.metadata.char_count} chars</strong>
                  </div>
                </div>

                {/* Snippet body */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 text-xs text-slate-350 leading-relaxed font-sans select-text min-h-[200px] border-t-2 border-brand-cyan max-h-[300px] overflow-y-auto">
                  "{selectedSource.text}"
                </div>
              </div>

              {/* Quick scroll selectors through active citations */}
              {activeSources.length > 1 && (
                <div className="pt-4 border-t border-slate-900/80 mt-4 shrink-0">
                  <span className="text-[9px] text-slate-500 font-mono block mb-2">OTHER SNIPPETS IN THIS ANSWER:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSources.map((src, idx) => (
                      <button
                        key={src.id}
                        onClick={() => setSelectedSource(src)}
                        className={`text-[9px] font-mono w-6 h-6 rounded border transition-all active:scale-95 flex items-center justify-center cursor-pointer
                          ${selectedSource.id === src.id 
                            ? "bg-brand-cyan border-brand-cyan text-white font-bold" 
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900"
                          }
                        `}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs">
              <Layers className="w-8 h-8 text-slate-700 mb-2" />
              Ask a question in grounded tutor chat to retrieve and view raw PDF textbook fragments here.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
