import os
from dotenv import load_dotenv

# Load env variables from .env file if it exists
load_dotenv()

class Settings:
    def __init__(self):
        self.port = int(os.getenv("PORT", "8000"))
        self.host = os.getenv("HOST", "127.0.0.1")
        
        # LLM Provider API Keys
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        
        # Default Provider and Models
        self.default_provider = os.getenv("DEFAULT_PROVIDER", "gemini")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.anthropic_model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620")
        self.groq_model = os.getenv("GROQ_MODEL", "llama3-8b-8192")

    def update_keys(self, data: dict):
        """Update settings dynamically from UI settings requests."""
        if "gemini_api_key" in data:
            self.gemini_api_key = data["gemini_api_key"]
        if "openai_api_key" in data:
            self.openai_api_key = data["openai_api_key"]
        if "anthropic_api_key" in data:
            self.anthropic_api_key = data["anthropic_api_key"]
        if "groq_api_key" in data:
            self.groq_api_key = data["groq_api_key"]
        if "default_provider" in data:
            self.default_provider = data["default_provider"]
            
    def get_active_provider_and_key(self):
        """Returns the active provider and its corresponding API key."""
        prov = self.default_provider.lower()
        if prov == "gemini":
            return "gemini", self.gemini_api_key
        elif prov == "openai":
            return "openai", self.openai_api_key
        elif prov == "anthropic":
            return "anthropic", self.anthropic_api_key
        elif prov == "groq":
            return "groq", self.groq_api_key
        
        # Fallback to whatever has a key
        if self.gemini_api_key: return "gemini", self.gemini_api_key
        if self.openai_api_key: return "openai", self.openai_api_key
        if self.anthropic_api_key: return "anthropic", self.anthropic_api_key
        if self.groq_api_key: return "groq", self.groq_api_key
        
        return "none", ""

settings = Settings()
