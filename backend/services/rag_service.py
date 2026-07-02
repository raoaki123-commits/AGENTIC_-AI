import os
import json
import math
import re
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader
from backend.config import settings
import google.generativeai as genai
from openai import OpenAI

class TFIDFVectorizer:
    """A pure-Python TF-IDF vectorizer for offline search fallback."""
    def __init__(self):
        self.idf = {}
        self.vocabulary = {}
        self.doc_count = 0

    def fit_transform(self, documents: List[str]) -> List[List[float]]:
        self.doc_count = len(documents)
        if self.doc_count == 0:
            return []

        # Tokenize documents
        tokenized_docs = [self._tokenize(doc) for doc in documents]
        
        # Build vocabulary
        vocab_set = set()
        for doc in tokenized_docs:
            vocab_set.update(doc)
        self.vocabulary = {word: idx for idx, word in enumerate(sorted(vocab_set))}
        
        # Calculate DF (Document Frequency)
        df = {word: 0 for word in self.vocabulary}
        for doc in tokenized_docs:
            unique_words = set(doc)
            for word in unique_words:
                if word in df:
                    df[word] += 1
                    
        # Calculate IDF
        self.idf = {}
        for word, count in df.items():
            # Standard IDF with smoothing
            self.idf[word] = math.log((1 + self.doc_count) / (1 + count)) + 1
            
        # Transform docs to TF-IDF vectors
        return [self.transform(doc) for doc in documents]

    def transform(self, doc_text: str) -> List[float]:
        tokens = self._tokenize(doc_text)
        vector = [0.0] * len(self.vocabulary)
        
        if not tokens or not self.vocabulary:
            return vector
            
        # Calculate TF (Term Frequency)
        tf = {}
        for token in tokens:
            tf[token] = tf.get(token, 0) + 1
            
        # L1/L2 normalization helper
        for token, count in tf.items():
            if token in self.vocabulary:
                idx = self.vocabulary[token]
                tf_val = count / len(tokens) # norm TF
                vector[idx] = tf_val * self.idf[token]
                
        # L2 Normalize
        sq_sum = sum(x**2 for x in vector)
        if sq_sum > 0:
            norm = math.sqrt(sq_sum)
            vector = [x / norm for x in vector]
            
        return vector

    def _tokenize(self, text: str) -> List[str]:
        # Simple word tokenization
        text = text.lower()
        return re.findall(r'\b[a-z0-9_]+\b', text)


class RAGService:
    def __init__(self):
        self.data_dir = "backend/data"
        self.store_path = os.path.join(self.data_dir, "vector_store.json")
        os.makedirs(self.data_dir, exist_ok=True)
        
        self.chunks: List[Dict[str, Any]] = []
        self.vectors: List[List[float]] = []
        self.vector_type = "tfidf" # 'openai', 'gemini', or 'tfidf'
        self.tfidf_vectorizer = TFIDFVectorizer()
        
        # Load vector store if it exists
        self.load_store()

    def load_store(self):
        """Loads index and metadata from disk."""
        if os.path.exists(self.store_path):
            try:
                with open(self.store_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.chunks = data.get("chunks", [])
                    self.vectors = data.get("vectors", [])
                    self.vector_type = data.get("vector_type", "tfidf")
                    
                    # If loaded index is TF-IDF, fit vectorizer on current chunks
                    if self.vector_type == "tfidf" and self.chunks:
                        texts = [c["text"] for c in self.chunks]
                        self.vectors = self.tfidf_vectorizer.fit_transform(texts)
                print(f"Loaded vector store: {len(self.chunks)} chunks indexed.")
            except Exception as e:
                print(f"Error loading vector store: {e}")
                self.chunks = []
                self.vectors = []

    def save_store(self):
        """Saves current state to file."""
        try:
            with open(self.store_path, "w", encoding="utf-8") as f:
                json.dump({
                    "chunks": self.chunks,
                    "vectors": self.vectors,
                    "vector_type": self.vector_type
                }, f, indent=2)
        except Exception as e:
            print(f"Error saving vector store: {e}")

    def clear_store(self):
        """Clears all indexed documents."""
        self.chunks = []
        self.vectors = []
        self.vector_type = "tfidf"
        self.tfidf_vectorizer = TFIDFVectorizer()
        if os.path.exists(self.store_path):
            os.remove(self.store_path)

    def extract_and_index_pdf(self, file_path: str, filename: str) -> int:
        """Parses a PDF, creates sliding window chunks, generates vectors, and saves."""
        # 1. Extract text page by page
        reader = PdfReader(file_path)
        raw_pages = []
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                raw_pages.append((idx + 1, page_text))
                
        if not raw_pages:
            raise ValueError("No extractable text found in PDF.")

        # 2. Extract chunks (chunk size: ~800 chars, overlap: ~150 chars)
        new_chunks = []
        chunk_size = 800
        overlap = 150
        
        for page_num, page_content in raw_pages:
            # Clean text formatting a bit
            cleaned_text = re.sub(r'\s+', ' ', page_content).strip()
            
            start = 0
            while start < len(cleaned_text):
                end = start + chunk_size
                # Adjust end to avoid splitting words
                if end < len(cleaned_text):
                    last_space = cleaned_text.rfind(' ', start, end)
                    if last_space != -1 and last_space > start + 300:
                        end = last_space
                        
                chunk_text = cleaned_text[start:end].strip()
                if len(chunk_text) > 50: # Skip empty/tiny chunks
                    new_chunks.append({
                        "id": f"{filename}_p{page_num}_c{len(new_chunks)}",
                        "text": chunk_text,
                        "metadata": {
                            "source": filename,
                            "page": page_num,
                            "char_count": len(chunk_text)
                        }
                    })
                start += (chunk_size - overlap)

        if not new_chunks:
            return 0
            
        # Determine embedding type based on available keys
        provider, api_key = settings.get_active_provider_and_key()
        
        # We try to use API neural embeddings first
        active_vector_type = "tfidf"
        generated_vectors = []
        
        if settings.gemini_api_key:
            try:
                genai.configure(api_key=settings.gemini_api_key)
                texts = [c["text"] for c in new_chunks]
                # API Call in chunks of 50 to avoid limits
                batch_size = 50
                for idx in range(0, len(texts), batch_size):
                    batch = texts[idx:idx+batch_size]
                    response = genai.embed_content(
                        model="models/text-embedding-004",
                        content=batch,
                        task_type="retrieval_document"
                    )
                    generated_vectors.extend(response["embedding"])
                active_vector_type = "gemini"
            except Exception as e:
                print(f"Gemini embedding failed, falling back to TF-IDF: {e}")
                
        elif settings.openai_api_key:
            try:
                client = OpenAI(api_key=settings.openai_api_key)
                texts = [c["text"] for c in new_chunks]
                batch_size = 50
                for idx in range(0, len(texts), batch_size):
                    batch = texts[idx:idx+batch_size]
                    response = client.embeddings.create(
                        input=batch,
                        model="text-embedding-3-small"
                    )
                    generated_vectors.extend([item.embedding for item in response.data])
                active_vector_type = "openai"
            except Exception as e:
                print(f"OpenAI embedding failed, falling back to TF-IDF: {e}")

        # Fallback to TF-IDF if API keys missing/failed
        if active_vector_type == "tfidf":
            # Add new chunks to our index list first
            all_chunks = self.chunks + new_chunks
            texts = [c["text"] for c in all_chunks]
            # Refit TF-IDF on all document texts
            self.vectors = self.tfidf_vectorizer.fit_transform(texts)
            self.chunks = all_chunks
            self.vector_type = "tfidf"
        else:
            # If switching embedding methods, clear old indices to avoid mismatch in dimension
            if self.vector_type != active_vector_type:
                self.chunks = []
                self.vectors = []
                
            self.chunks.extend(new_chunks)
            self.vectors.extend(generated_vectors)
            self.vector_type = active_vector_type

        self.save_store()
        return len(new_chunks)

    def retrieve_chunks(self, query: str, top_n: int = 4) -> List[Dict[str, Any]]:
        """Finds the top_n most semantically relevant chunks for a user query."""
        if not self.chunks or not self.vectors:
            return []

        # 1. Generate query vector
        query_vector = []
        if self.vector_type == "gemini":
            try:
                genai.configure(api_key=settings.gemini_api_key)
                response = genai.embed_content(
                    model="models/text-embedding-004",
                    content=query,
                    task_type="retrieval_query"
                )
                query_vector = response["embedding"]
            except Exception as e:
                print(f"Gemini Query Embed failed: {e}. Falling back to keyword fallback.")
                
        elif self.vector_type == "openai":
            try:
                client = OpenAI(api_key=settings.openai_api_key)
                response = client.embeddings.create(
                    input=query,
                    model="text-embedding-3-small"
                )
                query_vector = response.data[0].embedding
            except Exception as e:
                print(f"OpenAI Query Embed failed: {e}. Falling back to keyword fallback.")

        # If TF-IDF or if API call failed
        if not query_vector:
            # If the stored vector type is API but we couldn't embed, fit a temp TF-IDF
            if self.vector_type != "tfidf":
                texts = [c["text"] for c in self.chunks]
                self.tfidf_vectorizer.fit_transform(texts)
            query_vector = self.tfidf_vectorizer.transform(query)

        # 2. Compute Cosine Similarities
        scores = []
        for idx, doc_vector in enumerate(self.vectors):
            similarity = self._cosine_similarity(query_vector, doc_vector)
            scores.append((similarity, self.chunks[idx]))

        # Sort by similarity score descending
        scores = sorted(scores, key=lambda x: x[0], reverse=True)
        
        # Return top N chunks, attaching the similarity score to metadata
        retrieved = []
        for score, chunk in scores[:top_n]:
            chunk_copy = dict(chunk)
            chunk_copy["score"] = score
            retrieved.append(chunk_copy)
            
        return retrieved

    def _cosine_similarity(self, vecA: List[float], vecB: List[float]) -> float:
        """Computes cosine similarity between two float vectors."""
        if len(vecA) != len(vecB) or len(vecA) == 0:
            return 0.0
            
        dot_product = sum(a * b for a, b in zip(vecA, vecB))
        normA = math.sqrt(sum(a * a for a in vecA))
        normB = math.sqrt(sum(b * b for b in vecB))
        
        if normA == 0.0 or normB == 0.0:
            return 0.0
            
        return dot_product / (normA * normB)

    def get_stats(self) -> dict:
        """Returns structural stats about indexed document library."""
        unique_docs = set(c["metadata"]["source"] for c in self.chunks)
        total_chars = sum(len(c["text"]) for c in self.chunks)
        return {
            "total_chunks": len(self.chunks),
            "documents_count": len(unique_docs),
            "documents_list": list(unique_docs),
            "total_characters": total_chars,
            "vector_type": self.vector_type
        }

rag_service = RAGService()
