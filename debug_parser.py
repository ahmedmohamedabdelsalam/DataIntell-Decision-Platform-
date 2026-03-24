import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-pro-latest")
instruction = "Please analyze the sample_data.csv file and generate a report"
prompt = f"""
    You are an AI planner. Convert the following input task into a structured JSON format.
    The response MUST be valid JSON with 'intent' (string) and 'steps' (list of strings).
    Available tools are: ['load_data', 'analyze_data', 'generate_report'].
    If the task involves data analysis, the steps should typically follow: load_data, analyze_data, generate_report.
    
    Example output format:
    {{
       "intent": "data_analysis",
       "steps": ["load_data", "analyze_data", "generate_report"]
    }}
    
    Input task: "{instruction}"
"""
response = model.generate_content(prompt)
print("RAW RESPONSE:")
print(repr(response.text))
