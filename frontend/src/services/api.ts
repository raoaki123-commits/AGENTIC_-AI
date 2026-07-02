export interface ProviderStatus {
  status: string;
  active_provider: string;
  has_key_configured: boolean;
  rag: {
    total_chunks: number;
    documents_count: number;
    vector_type: string;
  };
  configured_providers: {
    gemini: boolean;
    openai: boolean;
    anthropic: boolean;
    groq: boolean;
  };
}

export interface SettingsData {
  default_provider: string;
  gemini_api_key?: string;
  openai_api_key?: string;
  anthropic_api_key?: string;
  groq_api_key?: string;
}

export interface TokenDetails {
  id: number;
  text: string;
  start: number;
  end: number;
}

export interface CandidateToken {
  token: string;
  id: number;
  probability: number;
}

export interface GenerationStep {
  step: number;
  chosen_token: string;
  chosen_id: number;
  top_candidates: CandidateToken[];
}

export interface InferenceResponse {
  prompt_tokens: TokenDetails[];
  prompt_token_count: number;
  generated_text: string;
  steps: GenerationStep[];
  simulated: boolean;
}

export interface SamplingResponse {
  greedy: string;
  temperature: string;
  top_k: string;
  top_p: string;
}

export interface StructuredOutputResponse {
  raw_text: string;
  json: Record<string, any>;
  valid: boolean;
  error: string | null;
}

export interface GroundedSource {
  id: string;
  text: string;
  score?: number;
  metadata: {
    source: string;
    page: number;
    char_count: number;
  };
}

export interface QueryNotesResponse {
  answer: string;
  sources: GroundedSource[];
}

export interface AgentReasoningStep {
  title: string;
  status: "completed" | "warning" | "error" | "pending";
  message: string;
}

export interface AgentTaskResponse {
  steps: AgentReasoningStep[];
  output: string;
  quiz_questions?: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }>;
  sources: GroundedSource[];
}

const API_BASE = "http://127.0.0.1:8000/api";

export const api = {
  async getStatus(): Promise<ProviderStatus> {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error("Failed to connect to backend server.");
    return res.json();
  },

  async updateSettings(data: SettingsData): Promise<{ status: string; active_provider: string }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update API settings.");
    return res.json();
  },

  async runInference(
    prompt: string, 
    temperature = 0.7, 
    top_k = 50, 
    top_p = 0.9, 
    max_tokens = 20
  ): Promise<InferenceResponse> {
    const res = await fetch(`${API_BASE}/inference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, temperature, top_k, top_p, max_tokens }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed running inference.");
    }
    return res.json();
  },

  async runSampling(
    prompt: string,
    temperature = 1.2,
    top_k = 5,
    top_p = 0.4,
    max_tokens = 100
  ): Promise<SamplingResponse> {
    const res = await fetch(`${API_BASE}/sampling`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, temperature, top_k, top_p, max_tokens }),
    });
    if (!res.ok) throw new Error("Failed running sampling models comparison.");
    return res.json();
  },

  async runStructuredOutput(
    text: string,
    schemaTitle: string,
    schemaJson: string
  ): Promise<StructuredOutputResponse> {
    const res = await fetch(`${API_BASE}/structured-output`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, schema_title: schemaTitle, schema_text: schemaJson }),
    });
    if (!res.ok) throw new Error("Failed to generate structured JSON schema.");
    return res.json();
  },

  async uploadNotes(file: File): Promise<{ status: string; filename: string; chunks_count: number; message: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/upload-notes`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed uploading PDF.");
    }
    return res.json();
  },

  async queryNotes(query: string, mode = "simple"): Promise<QueryNotesResponse> {
    const res = await fetch(`${API_BASE}/query-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, mode }),
    });
    if (!res.ok) throw new Error("Failed querying notes repository.");
    return res.json();
  },

  async runAgentTask(mode: string, task: string): Promise<AgentTaskResponse> {
    const res = await fetch(`${API_BASE}/agent-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, task }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Agent workflow execution failed.");
    }
    return res.json();
  },

  async clearNotes(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/clear-notes`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed clearing database store.");
    return res.json();
  }
};
