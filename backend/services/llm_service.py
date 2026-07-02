import math
import random
from openai import OpenAI
import google.generativeai as genai
from anthropic import Anthropic
from groq import Groq
from backend.config import settings
from backend.services.tokenizer_service import tokenizer_service

class LLMService:
    def _get_client(self, provider: str, api_key: str):
        """Returns the appropriate SDK client instance."""
        if not api_key:
            return None
            
        try:
            if provider == "openai":
                return OpenAI(api_key=api_key)
            elif provider == "gemini":
                genai.configure(api_key=api_key)
                return genai
            elif provider == "anthropic":
                return Anthropic(api_key=api_key)
            elif provider == "groq":
                return Groq(api_key=api_key)
        except Exception as e:
            print(f"Error initializing client for {provider}: {e}")
            
        return None

    def generate_text(
        self, 
        prompt: str, 
        system_prompt: str = None, 
        temperature: float = 0.7, 
        top_k: int = None, 
        top_p: float = None, 
        max_tokens: int = 500,
        response_format: str = None
    ) -> str:
        """
        Sends text generation request to the active configured LLM provider.
        """
        provider, api_key = settings.get_active_provider_and_key()
        
        if not api_key:
            return self._get_mock_response(prompt, provider)
            
        client = self._get_client(provider, api_key)
        if not client:
            return f"Error: Failed to initialize client for provider '{provider}'."

        try:
            if provider == "openai":
                model_name = settings.openai_model
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                kwargs = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                if top_p is not None:
                    kwargs["top_p"] = top_p
                if response_format == "json":
                    kwargs["response_format"] = {"type": "json_object"}
                    
                response = client.chat.completions.create(**kwargs)
                return response.choices[0].message.content
                
            elif provider == "gemini":
                model_name = settings.gemini_model
                config = genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )
                if top_p is not None:
                    config.top_p = top_p
                if top_k is not None:
                    config.top_k = top_k
                if response_format == "json":
                    config.response_mime_type = "application/json"
                    
                model = client.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_prompt
                )
                response = model.generate_content(prompt, generation_config=config)
                return response.text
                
            elif provider == "anthropic":
                model_name = settings.anthropic_model
                messages = [{"role": "user", "content": prompt}]
                kwargs = {
                    "model": model_name,
                    "max_tokens": max_tokens,
                    "messages": messages,
                    "temperature": temperature,
                }
                if system_prompt:
                    kwargs["system"] = system_prompt
                if top_p is not None:
                    kwargs["top_p"] = top_p
                    
                response = client.messages.create(**kwargs)
                return response.content[0].text
                
            elif provider == "groq":
                model_name = settings.groq_model
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                kwargs = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                if top_p is not None:
                    kwargs["top_p"] = top_p
                if response_format == "json":
                    kwargs["response_format"] = {"type": "json_object"}
                    
                response = client.chat.completions.create(**kwargs)
                return response.choices[0].message.content
                
        except Exception as e:
            return f"API Error ({provider}): {str(e)}"

        return "Error: Unsupported provider configuration."

    def generate_inference_details(
        self,
        prompt: str,
        temperature: float = 0.7,
        top_k: int = 50,
        top_p: float = 0.9,
        max_tokens: int = 15
    ):
        """
        Runs generation and returns detailed step-by-step next token predictions
        including real logprobs (if OpenAI) or highly realistic simulated logprobs (other providers).
        """
        provider, api_key = settings.get_active_provider_and_key()
        
        # If OpenAI is active and has key, we can pull real logprobs
        if provider == "openai" and api_key:
            try:
                client = self._get_client("openai", api_key)
                response = client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=max_tokens,
                    logprobs=True,
                    top_logprobs=5
                )
                
                generated_text = response.choices[0].message.content
                choice = response.choices[0]
                
                steps = []
                if choice.logprobs and choice.logprobs.content:
                    for i, logprob_item in enumerate(choice.logprobs.content):
                        token = logprob_item.token
                        token_id = tokenizer_service.encoding.encode(token)[0] if tokenizer_service.encoding.encode(token) else 99
                        
                        # Gather alternatives
                        alternatives = []
                        for alt in logprob_item.top_logprobs:
                            # Convert logprob to probability
                            prob = math.exp(alt.logprob)
                            alt_token = alt.token
                            alt_id = tokenizer_service.encoding.encode(alt_token)[0] if tokenizer_service.encoding.encode(alt_token) else 99
                            alternatives.append({
                                "token": alt_token,
                                "id": alt_id,
                                "probability": prob
                            })
                            
                        # Sort by probability descending
                        alternatives = sorted(alternatives, key=lambda x: x["probability"], reverse=True)
                        
                        steps.append({
                            "step": i + 1,
                            "chosen_token": token,
                            "chosen_id": token_id,
                            "top_candidates": alternatives
                        })
                return {
                    "text": generated_text,
                    "steps": steps,
                    "simulated": False
                }
            except Exception as e:
                print(f"Failed to fetch real OpenAI logprobs, falling back to simulation: {e}")
                
        # Simulate logic for all other models (Gemini, Anthropic, Groq, or offline mode)
        # 1. Generate text
        if not api_key:
            generated_text = self._get_mock_response(prompt, provider)
        else:
            generated_text = self.generate_text(
                prompt=prompt,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens
            )
            
        # 2. Tokenize generated text
        tokens = tokenizer_service.tokenize_details(generated_text)
        
        # 3. Simulate step-by-step next token logits
        steps = []
        common_words = [" the", " in", " of", " code", " model", " network", " output", " token", " prompt", " learn"]
        
        for i, tok in enumerate(tokens[:max_tokens]):
            chosen_token = tok["text"]
            chosen_id = tok["id"]
            
            # Create a highly realistic probability distribution where chosen token has high prob
            chosen_prob = random.uniform(0.55, 0.85)
            
            candidates = [{
                "token": chosen_token,
                "id": chosen_id,
                "probability": chosen_prob
            }]
            
            # Select random fallback vocabulary words
            remaining_prob = 1.0 - chosen_prob
            sample_words = random.sample(common_words, min(4, len(common_words)))
            
            # If our chosen word happens to be in sample_words, replace it to avoid duplicates
            if chosen_token in sample_words:
                sample_words.remove(chosen_token)
                
            weights = [0.5, 0.3, 0.15, 0.05]
            for idx, word in enumerate(sample_words[:4]):
                p = remaining_prob * weights[idx]
                word_id = tokenizer_service.encoding.encode(word)[0] if tokenizer_service.encoding.encode(word) else 99
                candidates.append({
                    "token": word,
                    "id": word_id,
                    "probability": p
                })
                
            steps.append({
                "step": i + 1,
                "chosen_token": chosen_token,
                "chosen_id": chosen_id,
                "top_candidates": candidates
            })
            
        return {
            "text": generated_text,
            "steps": steps,
            "simulated": True
        }

    def _get_mock_response(self, prompt: str, provider: str) -> str:
        """Fallback mock responses explaining API key setup."""
        prompt_lower = prompt.lower()
        
        header = "⚠️ [API Key not configured. Showing simulated output]\n\n"
        
        if "attention" in prompt_lower:
            return header + "Attention in Transformers is a mechanism that computes a weight distribution over input sequence tokens to decide which ones are most relevant. Specifically, self-attention uses Query, Key, and Value vectors computed from the inputs: Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V. This allows the network to capture contextual relationships regardless of distance in the text sequence."
        elif "sampling" in prompt_lower or "greedy" in prompt_lower:
            return header + "LLM sampling algorithms determine how tokens are selected from logits. Greedy decoding selects the highest probability token at each step. Temperature scaling scales logits (divided by T) to smooth (T > 1) or sharpen (T < 1) the distribution. Top-K restricts candidate tokens to the top K values, and Top-P (Nucleus) restricts candidates to a subset whose cumulative probability exceeds P."
        elif "rlhf" in prompt_lower:
            return header + "RLHF (Reinforcement Learning from Human Feedback) is a process used to align LLMs with human intent: 1. Pretrain a language model. 2. Collect human comparison data to train a Reward Model. 3. Fine-tune the LLM using Reinforcement Learning (PPO) against the Reward Model to optimize helpfulness and safety."
        
        return header + f"Hello! This is a simulated response from the GenAI Copilot backend because no API key is configured. To connect this app to a live LLM model (such as Gemini, OpenAI, Anthropic, or Groq), click the gear icon in the top right navbar to enter your API keys. Once configured, you can query live models!"

llm_service = LLMService()
