import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split content by paragraphs/blocks
  const blocks = content.split("\n");

  const formatText = (text: string) => {
    // Simple state-based parser for inline formatting (**bold**, `code`, citations)
    let textStr = text;

    // Split by citation, bold, and code
    const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\.pdf,\s*Page\s*\d+\])/g;
    const tokens = textStr.split(tokenRegex);

    if (tokens.length <= 1) {
      // Just do standard inline bold/code replacements if regex split didn't find tokens
      return parseSimpleInline(textStr);
    }

    return tokens.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="text-brand-cyan font-semibold">{part.slice(2, -2)}</strong>;
      } else if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={index} className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
      } else if (part.startsWith("[") && part.endsWith("]") && part.includes(".pdf")) {
        const citationText = part.slice(1, -1);
        return (
          <span 
            key={index} 
            className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 cursor-help"
            title="Fact grounded from uploaded source notes"
          >
            📚 {citationText}
          </span>
        );
      }
      return part;
    });
  };

  // Helper for simple text segment formatting
  const parseSimpleInline = (text: string): React.ReactNode[] => {
    const parts = [];
    let currentText = text;
    let index = 0;

    while (currentText.length > 0) {
      const boldIdx = currentText.indexOf("**");
      const codeIdx = currentText.indexOf("`");

      if (boldIdx === -1 && codeIdx === -1) {
        parts.push(currentText);
        break;
      }

      // Find which comes first
      const firstIdx = (boldIdx !== -1 && (codeIdx === -1 || boldIdx < codeIdx)) ? "bold" : "code";

      if (firstIdx === "bold") {
        if (boldIdx > 0) {
          parts.push(currentText.substring(0, boldIdx));
        }
        const nextBold = currentText.indexOf("**", boldIdx + 2);
        if (nextBold !== -1) {
          const boldText = currentText.substring(boldIdx + 2, nextBold);
          parts.push(<strong key={index++} className="text-brand-blue font-semibold">{boldText}</strong>);
          currentText = currentText.substring(nextBold + 2);
        } else {
          parts.push(currentText.substring(boldIdx));
          break;
        }
      } else {
        if (codeIdx > 0) {
          parts.push(currentText.substring(0, codeIdx));
        }
        const nextCode = currentText.indexOf("`", codeIdx + 1);
        if (nextCode !== -1) {
          const codeText = currentText.substring(codeIdx + 1, nextCode);
          parts.push(<code key={index++} className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">{codeText}</code>);
          currentText = currentText.substring(nextCode + 1);
        } else {
          parts.push(currentText.substring(codeIdx));
          break;
        }
      }
    }
    return parts;
  };

  let inList = false;
  const listItems: React.ReactNode[] = [];

  const renderedBlocks = [];

  for (let i = 0; i < blocks.length; i++) {
    const line = blocks[i].trim();

    if (!line) {
      if (inList) {
        inList = false;
        renderedBlocks.push(
          <ul key={`list-${i}`} className="list-disc pl-6 mb-4 space-y-1.5 text-slate-300">
            {[...listItems]}
          </ul>
        );
        listItems.length = 0; // clear
      }
      continue;
    }

    // Headers
    if (line.startsWith("# ")) {
      renderedBlocks.push(<h1 key={i} className="text-2xl md:text-3xl font-bold text-slate-100 mt-6 mb-4 border-b border-slate-800 pb-2">{formatText(line.slice(2))}</h1>);
    } else if (line.startsWith("## ")) {
      renderedBlocks.push(<h2 key={i} className="text-xl md:text-2xl font-semibold text-brand-blue mt-5 mb-3">{formatText(line.slice(3))}</h2>);
    } else if (line.startsWith("### ")) {
      renderedBlocks.push(<h3 key={i} className="text-lg md:text-xl font-medium text-brand-cyan mt-4 mb-2">{formatText(line.slice(4))}</h3>);
    } 
    // Horizontal Rule
    else if (line === "---") {
      renderedBlocks.push(<hr key={i} className="border-slate-800 my-6" />);
    }
    // Lists
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      inList = true;
      listItems.push(<li key={`li-${i}`}>{formatText(line.slice(2))}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      // Ordered list
      const contentStr = line.replace(/^\d+\.\s/, "");
      inList = true;
      listItems.push(<li key={`li-${i}`} className="list-decimal">{formatText(contentStr)}</li>);
    }
    // Standard paragraphs
    else {
      if (inList) {
        inList = false;
        renderedBlocks.push(
          <ul key={`list-${i}`} className="list-disc pl-6 mb-4 space-y-1.5 text-slate-300">
            {[...listItems]}
          </ul>
        );
        listItems.length = 0; // clear
      }
      renderedBlocks.push(<p key={i} className="mb-4 leading-relaxed text-slate-300">{formatText(line)}</p>);
    }
  }

  // Flush remaining lists
  if (inList) {
    renderedBlocks.push(
      <ul key={`list-flush`} className="list-disc pl-6 mb-4 space-y-1.5 text-slate-300">
        {[...listItems]}
      </ul>
    );
  }

  return <div className="markdown-body space-y-1">{renderedBlocks}</div>;
};
