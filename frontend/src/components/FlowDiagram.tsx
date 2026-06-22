import React, { useState } from "react";
import { ArrowRight, Info } from "lucide-react";

interface Node {
  id: string;
  label: string;
  title: string;
  color: string;
  description: string;
  math?: string;
}

export const FlowDiagram: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<Node | null>({
    id: "tokenizer",
    label: "Tokenizer",
    title: "1. Tokenizer & Vocabulary Mapping",
    color: "from-blue-600 to-cyan-500",
    description: "Splits raw string characters into subword chunks (tokens) based on a pre-trained vocabulary (like Byte-Pair Encoding). For example, 'attention' might be a single token, whereas 'unattentive' could split into 'un', 'attent', 'ive'.",
    math: "Text string -> list of Token IDs (integers)"
  });

  const nodes: Node[] = [
    {
      id: "prompt",
      label: "Prompt Text",
      title: "Input Prompt",
      color: "from-slate-700 to-slate-800",
      description: "The raw text string entered by the user. The starting context for generating new content.",
    },
    {
      id: "tokenizer",
      label: "Tokenizer",
      title: "1. Tokenizer & Vocabulary Mapping",
      color: "from-blue-650 to-cyan-500",
      description: "Splits raw string characters into subword chunks (tokens) based on a pre-trained vocabulary (like Byte-Pair Encoding). Each unique token maps directly to a unique integer ID.",
      math: "f(text) = [id_1, id_2, ..., id_n]"
    },
    {
      id: "embeddings",
      label: "Embeddings",
      title: "2. Vector Embeddings",
      color: "from-cyan-550 to-indigo-500",
      description: "Translates token integer IDs into high-dimensional float vectors (e.g., 4096 dimensions). Tokens with similar semantic meanings are mapped to vectors that sit close together in this vector space.",
      math: "E = Token_Embeddings[ID]"
    },
    {
      id: "positional",
      label: "Positional Enc",
      title: "3. Positional Encoding",
      color: "from-indigo-650 to-purple-500",
      description: "Since transformers process all tokens simultaneously (unlike sequential RNNs), they have no native concept of order. We add a positional vector (sine/cosine curves or rotary positional embedding RoPE) to the token embedding so the model knows a token's index position.",
      math: "E_final = E + Positional_Vector(pos)"
    },
    {
      id: "transformer",
      label: "Transformer Blocks",
      title: "4. Self-Attention & Feed-Forward Layers",
      color: "from-purple-650 to-pink-500",
      description: "The core computation. Multiple stacked blocks. Each block has a Self-Attention layer (which lets tokens look at other tokens to calculate context relationships) and a Feed-Forward network (which applies non-linear changes).",
      math: "Attention(Q,K,V) = Softmax(Q K^T / sqrt(d_k)) V"
    },
    {
      id: "logits",
      label: "Logits Vector",
      title: "5. Logits Matrix",
      color: "from-pink-650 to-rose-500",
      description: "The raw unnormalized prediction scores outputted by the final linear projection layer. The size of the logits vector matches the exact size of the model's vocabulary (e.g. 50,000+ words).",
      math: "Logits = LayerNorm(x) * W_vocab"
    },
    {
      id: "softmax",
      label: "Softmax",
      title: "6. Softmax Probabilities",
      color: "from-rose-650 to-amber-500",
      description: "Normalizes logits scores into a probability distribution. Every value is squashed between 0 and 1, and the entire vocabulary distribution sums up to exactly 1.0.",
      math: "P(Token_i) = exp(Logits_i) / Sum_j(exp(Logits_j))"
    },
    {
      id: "sampling",
      label: "Sampling Selector",
      title: "7. Sampling / Decoding Strategy",
      color: "from-amber-650 to-emerald-500",
      description: "Chooses the final token from the probability distribution. Uses Greedy decoding (highest score), Temperature scaling, Top-K, or Top-P (nucleus) thresholds to control creativity and avoid repetitions.",
    },
    {
      id: "next_token",
      label: "Next Token",
      title: "Predicted Output Token",
      color: "from-emerald-600 to-green-500",
      description: "The selected next token is appended back to the input prompt sequence. The entire process runs again (autoregressive loop) to predict the subsequent token.",
      math: "Prompt_new = Prompt_old + Token_new"
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* SVG Canvas Flow */}
      <div className="relative overflow-x-auto py-6 px-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
        <div className="min-w-[950px] flex items-center justify-between relative h-20">
          
          {/* Animated data flow background paths */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 -z-10 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-20"></div>

          {nodes.map((node, index) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <button
                  onClick={() => setSelectedNode(node)}
                  className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border text-center transition-all duration-300 active:scale-95 cursor-pointer max-w-[125px] min-w-[95px] relative group
                    ${isSelected 
                      ? "bg-slate-900 border-brand-cyan shadow-lg shadow-brand-cyan/20 scale-105" 
                      : "bg-slate-900/80 border-slate-850 hover:border-slate-700 hover:scale-102"
                    }
                  `}
                >
                  {/* Decorative glow header */}
                  <span className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${node.color}`} />
                  
                  <span className="text-xs font-semibold tracking-wide text-slate-100 group-hover:text-white mt-1">
                    {node.label}
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase font-mono mt-0.5">
                    {node.id === "prompt" || node.id === "next_token" ? "I/O Step" : `Step ${index}`}
                  </span>
                </button>

                {/* Connection Arrows */}
                {index < nodes.length - 1 && (
                  <div className="flex items-center justify-center flex-1">
                    <ArrowRight className={`w-4 h-4 transition-colors ${isSelected ? "text-brand-cyan animate-pulse" : "text-slate-700"}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Explanatory Context Details */}
      {selectedNode && (
        <div className="relative p-5 rounded-2xl glass-panel border-glow-cyan bg-slate-900/80 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${selectedNode.color} text-white`}>
              <Info className="w-5 h-5" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-semibold text-slate-100">
                  {selectedNode.title}
                </h4>
                {selectedNode.math && (
                  <code className="text-xs text-brand-purple font-mono bg-purple-950/30 px-2 py-1 rounded border border-purple-900/30">
                    {selectedNode.math}
                  </code>
                )}
              </div>
              
              <p className="text-sm text-slate-400 leading-relaxed">
                {selectedNode.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
