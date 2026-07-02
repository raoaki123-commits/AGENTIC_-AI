import React, { useState } from "react";
import { Braces, Play, RefreshCw, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { api } from "../services/api";
import type { StructuredOutputResponse } from "../services/api";
import { CodeViewer } from "../components/CodeViewer";

interface SchemaPreset {
  id: string;
  name: string;
  schema: string;
  sampleText: string;
}

export const StructuredOutput: React.FC = () => {
  const presets: SchemaPreset[] = [
    {
      id: "student_profile",
      name: "1. Student Profile Extractor",
      schema: `{
  "title": "StudentProfile",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" },
    "college": { "type": "string" },
    "skills": { 
      "type": "array", 
      "items": { "type": "string" } 
    },
    "goals": { 
      "type": "array", 
      "items": { "type": "string" } 
    }
  },
  "required": ["name", "age", "college", "skills", "goals"]
}`,
      sampleText: "Hello, my name is Alex Carter. I'm a 21-year-old student studying Computer Science at Stanford University. I have experience with Python, TypeScript, and React. My main career goals are to work on deep learning models and build autonomous developer agents."
    },
    {
      id: "note_summary",
      name: "2. Research Note Summary",
      schema: `{
  "title": "ResearchNoteSummary",
  "type": "object",
  "properties": {
    "topic": { "type": "string" },
    "summary": { "type": "string" },
    "key_points": {
      "type": "array",
      "items": { "type": "string" }
    },
    "examples": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["topic", "summary", "key_points", "examples"]
}`,
      sampleText: "The paper discusses Rotary Position Embeddings (RoPE) which is a method for adding positional information to transformers. RoPE encodes relative positions by multiplying key and query representations with a rotation matrix. Unlike absolute positional encodings, RoPE generalises better to long sequence lengths. Examples include its widespread use in LLaMA, Mistral, and Gemma models."
    },
    {
      id: "task_planner",
      name: "3. Task Planner & Scheduler",
      schema: `{
  "title": "TaskPlanner",
  "type": "object",
  "properties": {
    "goal": { "type": "string" },
    "subtasks": {
      "type": "array",
      "items": { "type": "string" }
    },
    "deadline": { "type": "string" },
    "priority": { 
      "type": "string", 
      "enum": ["high", "medium", "low"] 
    }
  },
  "required": ["goal", "subtasks", "deadline", "priority"]
}`,
      sampleText: "I need to prepare for my upcoming GenAI midterms. First, I have to revise subword tokenization models. Then, I need to solve the attention dot-product equations. Finally, I will build a simple chatbot. I need to get this done by Friday. This is a very high priority task."
    },
    {
      id: "company_info",
      name: "4. Company & Role Extractor",
      schema: `{
  "title": "CompanyInfo",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "role": { "type": "string" },
    "organization": { "type": "string" },
    "location": { "type": "string" }
  },
  "required": ["name", "role", "organization", "location"]
}`,
      sampleText: "Yesterday, Sarah Jenkins was promoted to Lead AI Scientist at Anthropic. She will be moving from San Francisco to their London office to head the new alignment research division."
    }
  ];

  const [activePresetId, setActivePresetId] = useState<string>(presets[0].id);
  const [unstructuredText, setUnstructuredText] = useState<string>(presets[0].sampleText);
  const [customSchema, setCustomSchema] = useState<string>(presets[0].schema);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<StructuredOutputResponse | null>(null);

  // Sync schema and sample text when preset selection changes
  const handlePresetChange = (presetId: string) => {
    setActivePresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setUnstructuredText(preset.sampleText);
      setCustomSchema(preset.schema);
      setResult(null);
    }
  };

  const handleGenerateJSON = async () => {
    if (!unstructuredText.trim() || !customSchema.trim()) return;

    // Validate if schema JSON is structurally correct first
    try {
      JSON.parse(customSchema);
    } catch (e: any) {
      alert(`Invalid JSON Schema syntax: ${e.message}`);
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const data = await api.runStructuredOutput(unstructuredText, activePresetId, customSchema);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Error generating structured JSON output. Check backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.json) return;
    const blob = new Blob([JSON.stringify(result.json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extracted_${activePresetId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. SCHEMA SELECTOR & INPUT COLUMN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Unstructured inputs and settings */}
        <div className="glass-panel p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Braces className="w-5 h-5 text-brand-cyan" />
              JSON Schema Extractor
            </h3>
            <p className="text-xs text-slate-400">
              Input raw unstructured paragraphs and define a schema to force the LLM to output clean, structured API data.
            </p>
          </div>

          {/* Preset dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 font-mono">CHOOSE EXTRACTION PRESET</label>
            <select
              value={activePresetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 focus:outline-none focus:border-brand-cyan"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Input Unstructured Text Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 font-mono">UNSTRUCTURED INPUT TEXT</label>
            <textarea
              rows={6}
              value={unstructuredText}
              onChange={(e) => setUnstructuredText(e.target.value)}
              placeholder="Paste unstructured paragraph text here..."
              className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-brand-cyan leading-relaxed resize-y"
            />
          </div>

          <button
            onClick={handleGenerateJSON}
            disabled={isLoading || !unstructuredText.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-md shadow-brand-cyan/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Synthesizing Structured Output...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Extract JSON Data
              </>
            )}
          </button>
        </div>

        {/* Right Side: Interactive Schema Editor */}
        <div className="glass-panel p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
              Target JSON Schema Definition
            </h4>
            <p className="text-[11px] text-slate-500">
              Customize the property validation types or add required parameters directly in the schema editor block.
            </p>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-850 bg-slate-950 font-mono text-sm leading-relaxed">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-850 text-slate-400 text-xs">
              SCHEMA_SCHEMA.JSON
            </div>
            <textarea
              rows={11}
              value={customSchema}
              onChange={(e) => setCustomSchema(e.target.value)}
              className="w-full p-4 bg-transparent text-slate-350 focus:outline-none resize-none font-mono text-xs leading-normal focus:text-slate-100"
            />
          </div>
        </div>

      </div>

      {/* 2. RESULTS CONTAINER */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
          
          {/* Main Pretty JSON block (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-300 uppercase font-mono tracking-wider">
                Pretty JSON Output
              </h4>
              
              <div className="flex items-center gap-2">
                {/* Validation Status Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
                  ${result.valid 
                    ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/40" 
                    : "bg-rose-950/50 text-rose-300 border-rose-800/40"
                  }
                `}>
                  {result.valid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Valid JSON Compliant</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>Syntax Validation Failed</span>
                    </>
                  )}
                </div>

                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Download JSON file"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {result.error && (
              <div className="p-3 rounded-lg bg-rose-950/30 text-rose-350 text-xs font-mono border border-rose-900/30">
                {result.error}
              </div>
            )}

            <CodeViewer code={result.json} language="json" />
          </div>

          {/* Extracted key-values parsed dashboard (1 column) */}
          <div className="glass-panel p-6 space-y-4 h-fit">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-300 uppercase font-mono">
                Extracted Fields Node Tree
              </h4>
              <p className="text-[11px] text-slate-500">
                Parsed property values converted into key-value data nodes.
              </p>
            </div>

            <div className="divide-y divide-slate-900 text-xs leading-relaxed space-y-3.5">
              {Object.entries(result.json).map(([key, val]) => (
                <div key={key} className="pt-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 font-mono block uppercase">
                    {key.replace("_", " ")}
                  </span>
                  
                  {Array.isArray(val) ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {val.map((item, idx) => (
                        <span key={idx} className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[10px] text-brand-cyan font-mono">
                          {String(item)}
                        </span>
                      ))}
                    </div>
                  ) : typeof val === "object" && val !== null ? (
                    <pre className="text-[10px] bg-slate-950 p-2 rounded border border-slate-850 text-slate-300 font-mono">
                      {JSON.stringify(val)}
                    </pre>
                  ) : (
                    <span className="font-semibold text-slate-200">
                      {String(val)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
