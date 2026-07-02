import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeViewerProps {
  code: Record<string, any> | string;
  language?: "json" | "markdown" | "python";
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language = "json" }) => {
  const [copied, setCopied] = useState(false);

  const rawString = typeof code === "string" ? code : JSON.stringify(code, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightJson = (jsonStr: string) => {
    // Escape HTML characters
    let html = jsonStr
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Regular expressions for highlighting JSON elements
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

    return html.replace(regex, (match) => {
      let cls = "text-amber-300"; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-brand-blue font-medium"; // key
        } else {
          cls = "text-emerald-300"; // string value
        }
      } else if (/true|false/.test(match)) {
        cls = "text-purple-400"; // boolean
      } else if (/null/.test(match)) {
        cls = "text-slate-500 italic"; // null
      }
      return `<span class="${cls}">${match}</span>`;
    });
  };

  return (
    <div className="relative group rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800 font-mono text-sm">
      {/* Top bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-850 text-slate-400 text-xs">
        <span>{language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="p-4 overflow-x-auto max-h-[500px] leading-relaxed select-text">
        {language === "json" ? (
          <pre className="whitespace-pre">
            <code
              dangerouslySetInnerHTML={{
                __html: highlightJson(rawString),
              }}
            />
          </pre>
        ) : (
          <pre className="whitespace-pre-wrap text-slate-300">
            <code>{rawString}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
