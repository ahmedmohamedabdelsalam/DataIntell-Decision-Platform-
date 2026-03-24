import os
import json
import logging
from services.llm_service import llm_service

logger = logging.getLogger(__name__)

def parse_task(instruction: str, context: dict = None) -> dict:
    """Uses LLM to parse a task into an execution plan dynamically based on dataset specifics."""
    logger.info(f"Parsing task: {instruction}")
    
    # Profile string to inform the LLM about the data
    profile_str = ""
    if context and "profile" in context:
        p = context["profile"]
        profile_str = f"""
        Dataset Context:
        - Type: {p.get('dataset_type')}
        - Rows: {p.get('row_count')}
        - Missing Values Summary: {json.dumps(p.get('missing_values', {}))}
        """
        
    prompt = f"""
    You are an AI data architect. Formulate an execution plan for this request.
    {profile_str}
    
    Available tools: 
    'summary_tool' (statistics), 'correlation_tool', 'anomaly_tool', 'advanced_analytics_tool' (RF feature importance, trend detection), 'generate_insights_tool' (LLM Executive Summary & Recommendations).

    Rules:
    1. NEVER include 'load_data_tool'. It runs automatically before you.
    2. If the user asks for a 'full analysis', 'comprehensive report', or 'insights', ensure you include ['summary_tool', 'correlation_tool', 'anomaly_tool', 'advanced_analytics_tool', 'generate_insights_tool'].
    3. If they specifically ask for anomalies only, just output ['anomaly_tool'].
    
    Return pure JSON:
    {{
       "intent": "full_analysis",
       "steps": ["summary_tool", "anomaly_tool", "advanced_analytics_tool", "generate_insights_tool"]
    }}
    
    Input task: "{instruction}"
    """
    
    try:
        parsed_json = llm_service.generate_json(prompt)
        # Force load_data_tool to ALWAYS be the first step in the pipeline wrapper
        steps = parsed_json.get("steps", [])
        if "load_data_tool" in steps:
            steps.remove("load_data_tool")
        steps.insert(0, "load_data_tool")
        
        parsed_json["steps"] = steps
        logger.info(f"Parsed Intent: {parsed_json.get('intent')} | Plan: {steps}")
        return parsed_json
    except Exception as e:
        logger.error(f"Failed to parse task via LLM: {e}")
        # Keyword Fallback Logic
        instruction_lower = instruction.lower()
        steps = ["load_data_tool"]
        if "summary" in instruction_lower: steps.append("summary_tool")
        if "correlation" in instruction_lower: steps.append("correlation_tool")
        if "anomal" in instruction_lower: steps.append("anomaly_tool")
        
        if len(steps) == 1:
            steps.extend(["summary_tool", "correlation_tool", "anomaly_tool", "advanced_analytics_tool", "generate_insights_tool"])
            intent = "full_analysis"
        else:
            intent = "custom_analysis"

        logger.info(f"Fallback Parsed Intent: {intent} | Plan: {steps}")
        return {
            "intent": intent,
            "steps": steps
        }
