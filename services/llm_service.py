import os
import json
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GOOGLE_GEMINI_API_KEY is not set. LLM features will fail.")
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.5-flash")
    
    def generate_json(self, prompt: str) -> dict:
        """Helper to prompt Gemini and strictly return JSON."""
        if not self.api_key:
            raise ValueError("Missing GOOGLE_GEMINI_API_KEY")
            
        try:
            # Enforce JSON-like responses using prompt chaining
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Clean possible markdown wrapping
            if text.startswith("```json"):
                text = text[7:-3].strip()
            elif text.startswith("```"):
                text = text[3:-3].strip()
                
            return json.loads(text)
        except Exception as e:
            logger.error(f"LLM JSON generation failed: {e}")
            raise

llm_service = LLMService()
