import os
import shutil
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import settings
from backend.services.tokenizer_service import tokenizer_service
from backend.services.llm_service import llm_service
from backend.services.rag_service import rag_service
from backend.services.agent_service import agent_service

app = FastAPI(
    title="GenAI Copilot Backend",
    description="Educational API server for Generative AI, LLM Internals, and RAG/Agentic workflows.",
    version="1.0.0"
)

# Enable CORS for frontend Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to store uploaded documents temporary
UPLOAD_DIR = "backend/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# --- Request/Response Pydantic Models ---

class SettingsUpdateRequest(BaseModel):
    default_provider: str
    gemini_api_key: Optional[str] = ""
    openai_api_key: Optional[str] = ""
    anthropic_api_key: Optional[str] = ""
    groq_api_key: Optional[str] = ""

class InferenceRequest(BaseModel):
    prompt: str
    temperature: Optional[float] = 0.7
    top_k: Optional[int] = 50
    top_p: Optional[float] = 0.9
    max_tokens: Optional[int] = 20

class SamplingRequest(BaseModel):
    prompt: str
    temperature: Optional[float] = 1.2
    top_k: Optional[int] = 5
    top_p: Optional[float] = 0.4
    max_tokens: Optional[int] = 100

class StructuredOutputRequest(BaseModel):
    text: str
    schema_title: str  # e.g., "student_profile", "task_planner", "custom"
    schema_text: str   # The JSON string representation of the schema

class QueryNotesRequest(BaseModel):
    query: str
    mode: Optional[str] = "simple"  # simple, deep, exam, builder

class AgentTaskRequest(BaseModel):
    mode: str  # teach_topic, revision_plan, project_idea, quiz_generator, presentation_helper
    task: str


# --- API Endpoints ---

@app.get("/api/status")
def get_status():
    """Returns the operational status of the server and active configuration."""
    active_provider, api_key = settings.get_active_provider_and_key()
    has_key = len(api_key) > 0
    rag_stats = rag_service.get_stats()
    
    return {
        "status": "online",
        "active_provider": active_provider,
        "has_key_configured": has_key,
        "rag": {
            "total_chunks": rag_stats["total_chunks"],
            "documents_count": rag_stats["documents_count"],
            "vector_type": rag_stats["vector_type"]
        },
        "configured_providers": {
            "gemini": len(settings.gemini_api_key) > 0,
            "openai": len(settings.openai_api_key) > 0,
            "anthropic": len(settings.anthropic_api_key) > 0,
            "groq": len(settings.groq_api_key) > 0,
        }
    }


@app.post("/api/settings")
def update_settings(req: SettingsUpdateRequest):
    """Updates API keys and default model configurations dynamically."""
    settings.update_keys({
        "default_provider": req.default_provider,
        "gemini_api_key": req.gemini_api_key,
        "openai_api_key": req.openai_api_key,
        "anthropic_api_key": req.anthropic_api_key,
        "groq_api_key": req.groq_api_key,
    })
    
    # Reload vector store if keys changed, to try upgrade from TF-IDF
    rag_service.load_store()
    
    return {"status": "success", "active_provider": settings.default_provider}


@app.post("/api/inference")
def run_inference(req: InferenceRequest):
    """
    Exposes tokenization mappings and token-by-token generation logs.
    """
    try:
        # Tokenize prompt for the visualizer
        prompt_tokens = tokenizer_service.tokenize_details(req.prompt)
        
        # Run step-by-step next token generation
        generation_details = llm_service.generate_inference_details(
            prompt=req.prompt,
            temperature=req.temperature,
            top_k=req.top_k,
            top_p=req.top_p,
            max_tokens=req.max_tokens
        )
        
        return {
            "prompt_tokens": prompt_tokens,
            "prompt_token_count": len(prompt_tokens),
            "generated_text": generation_details["text"],
            "steps": generation_details["steps"],
            "simulated": generation_details["simulated"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sampling")
async def run_sampling(req: SamplingRequest):
    """
    Executes text generation in parallel across 4 different sampling schemes.
    """
    prompt = req.prompt
    max_tokens = req.max_tokens

    # Helper to run generation in a thread pool executor since SDKs are blocking
    def run_gen(temp, k, p, label):
        try:
            prov, api_key = settings.get_active_provider_and_key()
            if not api_key:
                # Add tiny delays to mock realistic server lags side-by-side
                import time
                time.sleep(0.5)
                
            out = llm_service.generate_text(
                prompt=prompt,
                temperature=temp,
                top_k=k,
                top_p=p,
                max_tokens=max_tokens
            )
            return out
        except Exception as e:
            return f"Error: {e}"

    loop = asyncio.get_event_loop()
    
    # Define tasks
    # 1. Greedy: Temp = 0.0, top_k = None, top_p = None
    t1 = loop.run_in_executor(None, run_gen, 0.0, None, None, "Greedy")
    # 2. Temperature: Temp = req.temperature, top_k = None, top_p = None
    t2 = loop.run_in_executor(None, run_gen, req.temperature, None, None, "Temperature")
    # 3. Top-K: Temp = 0.9, top_k = req.top_k, top_p = None
    t3 = loop.run_in_executor(None, run_gen, 0.9, req.top_k, None, "Top-K")
    # 4. Top-P: Temp = 0.9, top_k = None, top_p = req.top_p
    t4 = loop.run_in_executor(None, run_gen, 0.9, None, req.top_p, "Top-P")
    
    # Await all parallel execution tasks
    results = await asyncio.gather(t1, t2, t3, t4)
    
    return {
        "greedy": results[0],
        "temperature": results[1],
        "top_k": results[2],
        "top_p": results[3]
    }


@app.post("/api/structured-output")
def run_structured_output(req: StructuredOutputRequest):
    """
    Extracts structured JSON matching the provided schema instructions from unstructured text.
    """
    system_prompt = f"""
    You are a precise JSON extractor. Parse the user's unstructured input text and map the details to match the following JSON Schema instructions.
    
    Target JSON Schema:
    {req.schema_text}
    
    RULES:
    1. Respond with a single valid JSON block ONLY. Do not wrap in markdown or include preambles.
    2. Populate every field based on the text. If information for a field is missing, use null, empty array, or default empty value appropriate to the type.
    3. Ensure data types match (e.g. lists must be lists, integers must be integers).
    """
    
    raw_response = llm_service.generate_text(
        prompt=req.text,
        system_prompt=system_prompt,
        temperature=0.1, # Keep it low for determinism and extraction accuracy
        max_tokens=600,
        response_format="json"
    )
    
    # Strip markdown wrapper if present
    cleaned_json = raw_response.strip()
    if cleaned_json.startswith("```"):
        lines = cleaned_json.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned_json = "\n".join(lines).strip()
        
    import json
    parsed = {}
    valid = False
    error_msg = None
    
    try:
        parsed = json.loads(cleaned_json)
        valid = True
    except Exception as e:
        error_msg = f"JSON Validation Error: {e}"
        # Try to parse anything from the text using regex if standard load fails
        valid = False
        
    return {
        "raw_text": raw_response,
        "json": parsed,
        "valid": valid,
        "error": error_msg
    }


@app.post("/api/upload-notes")
def upload_notes(file: UploadFile = File(...)):
    """
    Handles PDF uploads, extracts text, chunks, and updates vector store index.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        # Save file locally
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse and Index PDF notes
        chunks_count = rag_service.extract_and_index_pdf(file_path, file.filename)
        
        return {
            "status": "success",
            "filename": file.filename,
            "chunks_count": chunks_count,
            "message": f"Successfully parsed '{file.filename}' and generated {chunks_count} searchable fragments."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the saved file to save disk space, metadata is saved in store
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass


@app.post("/api/query-notes")
def query_notes(req: QueryNotesRequest):
    """
    Answers user queries grounded in the context of uploaded PDF notes.
    """
    # 1. Retrieve chunks
    chunks = rag_service.retrieve_chunks(req.query, top_n=4)
    
    if not chunks:
        return {
            "answer": "No documents uploaded. Please upload a PDF in the 'Notes Tutor' panel to query details from your notes.",
            "sources": []
        }
        
    # Assemble context
    context_str = "\n\n".join([
        f"[Source: {c['metadata']['source']}, Page {c['metadata']['page']}]\n{c['text']}"
        for c in chunks
    ])
    
    # 2. Modify system prompt depending on mode
    mode = req.mode.lower()
    if mode == "deep":
        system_instruction = "You are a deep research tutor. Answer the user query in comprehensive detail, discussing core mathematics, implementation trade-offs, and conceptual backgrounds. Cite the source files directly."
    elif mode == "exam":
        system_instruction = "You are an exam evaluator. Answer the question directly and outline exactly how to phrase it for maximum marks, highlighting keyword definitions and typical grading checkpoints."
    elif mode == "builder":
        system_instruction = "You are a software engineer instructor. Break down the concept into code snippets, API implementations, and step-by-step algorithms. Provide clean Python or JS syntax."
    else: # simple
        system_instruction = "You are a helpful college tutor. Explain the concepts using bullet points, short paragraphs, and simple analogies based on the notes context provided."
        
    prompt = f"""
    Answer the following question from the student based ONLY on the grounded lecture notes context provided below.
    If the context does not contain enough information to fully answer, complete it with your general knowledge but make sure to flag what was explicitly retrieved and what is general background info.
    Always cite which file and page number the information came from (e.g. "[Lecture1.pdf, Page 4]").
    
    Question: {req.query}
    
    Grounded Notes Context:
    {context_str}
    """
    
    answer = llm_service.generate_text(prompt, system_prompt=system_instruction)
    
    return {
        "answer": answer,
        "sources": chunks
    }


@app.post("/api/agent-task")
def run_agent_task(req: AgentTaskRequest):
    """
    Executes a structured study agent task (Quiz, Study guide, slide deck planning).
    """
    try:
        result = agent_service.run_study_workflow(mode=req.mode, task=req.task)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/clear-notes")
def clear_notes():
    """Deletes all chunks and vector databases."""
    rag_service.clear_store()
    return {"status": "success", "message": "Indexed local library wiped successfully."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.host, port=settings.port, reload=True)
