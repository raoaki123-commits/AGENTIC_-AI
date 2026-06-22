# GenAI Copilot — LLM Internals & Agentic Study Assistant

A premium, interactive educational dashboard and portfolio-grade project that visualizes Large Language Model (LLM) internals, sampling algorithms, schema-validated structured JSON outputs, and implements a local PDF notes RAG tutor and agentic study planners.

Designed with a futuristic, glassmorphic dark-mode interface (*"Jarvis meets Perplexity"*), this application acts as a serious educational playground based on a college Generative AI syllabus.

---

## 🚀 Key Modules & Capabilities

### 1. LLM Inference Explorer
*   **Subword Tokenizer Map**: Visualizes character-to-token BPE splits with direct token ID mapping.
*   **SVG Pipeline Flow**: Illustrates data routing through Embedding, Positional Encoding, Multi-Head Attention, Feed-Forward layers, and logit Softmax.
*   **Step-by-Step Probability Charts**: Analyzes candidate token logits and Softmax probabilities at each autoregressive generation step.

### 2. Sampling Playground
*   **Hyperparameter Controls**: Slide controls for Temperature (\(T\)), Top-K, and Top-P (Nucleus) thresholds.
*   **Side-by-Side Completions**: Generates and displays four text outputs simultaneously (Greedy, Temperature-based, Top-K, Top-P) using parallel threads.

### 3. Structured JSON Engine
*   **Schema Schema Selector**: Includes presets for Student Profiles, Research Note Summaries, Task Planners, and Entity Extractors.
*   **Dynamic JSON Validator**: Runs low-entropy extraction queries on unstructured texts, matches schemas, validates syntax, and displays structured trees.

### 4. Notes Tutor & PDF RAG Assistant
*   **Lightweight Vector Storage**: Chunks and indexes uploaded note PDFs locally using cosine similarity neural embeddings (with an offline TF-IDF keyword vector store fallback if no API keys are entered).
*   **Multi-Mode Chats**: Grounded question-answering with clickable PDF page-number citations, operating in Simple, Deep, Exam, or Software Builder modes.
*   **Interactive MCQ Quizzes**: Compiles self-grading tests from PDF notes, providing detailed conceptual explanation loops.

### 5. Agentic Study Assistant
*   **Multi-Step Planning Console**: Displays sequential planning logs of agent actions in real-time.
*   **Study Materials Generator**: Synthesizes custom textbooks, day-by-day revision schedules, slide outline speaker guides, and coding project blueprints.

---

## 🛠️ Architecture & Tech Stack

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS (v3.4), Lucide Icons, Canvas-Confetti.
*   **Backend**: FastAPI, Uvicorn, Pydantic, Python-dotenv, PyPDF (note parsing), Tiktoken (GPT-4 subword mapping), Numpy.
*   **LLM Provider Wrapper**: Custom factory adapter supporting Google Gemini, OpenAI, Anthropic Claude, and Groq APIs.

---

## 🏁 Quick Start Setup

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)

### 1. Backend Server Setup
1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Install Python packages:
    ```bash
    pip install -r requirements.txt
    ```
3.  Create your local configuration: Copy `.env.example` from the root directory into a new file named `backend/.env` (or project root `.env`) and add your LLM API keys:
    ```env
    # backend/.env
    GEMINI_API_KEY=AIzaSy...
    OPENAI_API_KEY=sk-...
    DEFAULT_PROVIDER=gemini
    ```
    *(Note: If no API keys are configured, the application runs in a simulated mode with static/offline fallbacks, allowing offline exploration).*
4.  Launch the FastAPI server:
    ```bash
    python main.py
    ```
    The server will startup on [http://127.0.0.1:8000](http://127.0.0.1:8000).

### 2. Frontend client Setup
1.  Navigate to the `frontend/` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the Vite development environment:
    ```bash
    npm run dev
    ```
    Open your browser to [http://localhost:5173](http://localhost:5173) to load the GenAI Copilot dashboard.

---

## 🎓 Sample Prompts to Try

*   **Inference Visualizer**:
    *   `"Attention mechanism works by calculating"`
    *   `"Transformer neural networks process language using"`
*   **Sampling Laboratory**:
    *   `"Once upon a time in a cyberpunk metropolis, a robot butler decided to"`
    *   *Set T = 1.8 to observe high entropy chaos, and T = 0.1 to check strict facts.*
*   **Structured Output Engine**:
    *   *Select "Student Profile Extractor" and click "Extract JSON Data" to map unstructured biographical text into schema properties.*
*   **Notes Tutor & Agent planners**:
    *   Upload any class lecture slide PDF, select "Quiz Me" to generate an interactive exam, or ask:
    *   `"Explain self-attention from my notes"`
    *   `"Make a 5-day study plan for this syllabus"`
