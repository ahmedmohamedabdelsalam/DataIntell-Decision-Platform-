import time
import logging
from agent.parser import parse_task
from agent.planner import create_execution_plan
from tools.data_tools import load_data_tool, summary_tool, correlation_tool, anomaly_tool
from tools.advanced_tools import advanced_analytics_tool
from tools.llm_tools import generate_insights_tool

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def execute_plan(plan: list, initial_context: dict) -> tuple:
    """Executes the execution plan step-by-step and handles tools logic."""
    context = initial_context
    executed_steps = []
    
    for step in plan:
        action = step["action"]
        logger.info(f"Executing step: {action}")
        
        try:
            if action == "load_data_tool":
                # Already executed before parsing in V2 to provide context
                pass
            elif action == "summary_tool":
                if "df" not in context:
                    raise ValueError("Dataframe not found in context.")
                if "analysis" not in context: context["analysis"] = {}
                context["analysis"]["summary"] = summary_tool(context["df"])
                
            elif action == "correlation_tool":
                if "df" not in context:
                    raise ValueError("Dataframe not found in context.")
                if "analysis" not in context: context["analysis"] = {}
                context["analysis"]["correlations"] = correlation_tool(context["df"])
                
            elif action == "anomaly_tool":
                if "df" not in context:
                    raise ValueError("Dataframe not found in context.")
                if "analysis" not in context: context["analysis"] = {}
                context["analysis"]["anomalies"] = anomaly_tool(context["df"])
                
            elif action == "advanced_analytics_tool":
                if "df" not in context:
                    raise ValueError("Dataframe not found in context.")
                if "analysis" not in context: context["analysis"] = {}
                context["analysis"]["advanced_analytics"] = advanced_analytics_tool(context["df"])
                
            elif action == "generate_insights_tool":
                if "analysis" not in context:
                    raise ValueError("Cannot generate insights without prior analysis.")
                if "df" not in context:
                    raise ValueError("Cannot generate deterministic insights without dataframe.")
                context["insights"] = generate_insights_tool(context["df"], context["analysis"])
                
            elif action == "report_tool":
                # Legacy fallback
                pass
            else:
                logger.warning(f"Unknown tool requested: {action}. Skipping.")
                continue
                
            step["status"] = "success"
            executed_steps.append({"action": action, "status": "success"})
        except Exception as e:
            logger.error(f"Tool failure in {action}: {e}")
            step["status"] = "failed"
            step["error"] = str(e)
            executed_steps.append({"action": action, "status": "failed", "error": str(e)})
            raise RuntimeError(f"Execution stopped due to failure at step '{action}': {e}")
            
    return context, executed_steps

def run_agent(task_instruction: str, file_id: str | None = None) -> dict:
    """
    Main V2 agent pipeline:
    1. Pre-load data to get profile for LLM.
    2. Build prompt context & parse via LLM into execution plan.
    3. Execute advanced analytics and insights explicitly.
    4. Compile strictly into SaaS standardized format.
    """
    start_time = time.time()
    logger.info(f"Starting V2 agent flow for task: {task_instruction}")
    
    try:
        context = {"file_id": file_id}
        
        # Step 0: Pre-load data to feed context to the LLM Profile logic
        if file_id:
            context["df"] = load_data_tool(file_id)
            context["profile"] = context["df"].attrs.get("profile", {})
            
        # Step 1: Parse Task Instruction Dynamically
        parsed_task = parse_task(task_instruction, context=context)
        
        if parsed_task.get("intent") == "unknown" or not parsed_task.get("steps"):
            raise ValueError("Invalid task handling: Parser failed to generate executable steps.")
            
        # Step 2: Plan
        plan = create_execution_plan(parsed_task)
        
        # Step 3: Execute
        context, steps_executed = execute_plan(plan, context)
        
        execution_time = time.time() - start_time
        logger.info(f"Task completed in {execution_time:.2f} seconds.")
        
        # Step 4: Standardize Output
        insights = context.get("insights", {})
        analysis = context.get("analysis", {})
        
        return {
            "task": task_instruction,
            "intent": parsed_task.get("intent", "unknown"),
            "plan": [step["action"] for step in plan],
            "steps_executed": steps_executed,
            "result": {
                "executive_summary": insights.get("executive_summary", "No summary generated."),
                "key_insights": insights.get("key_insights", []),
                "recommendations": insights.get("recommendations", []),
                "data_quality_issues": insights.get("data_quality_issues", []),
                "advanced_analysis": insights.get("advanced_analysis", {}),
                "anomalies": analysis.get("anomalies", {}),
                "visualizations": {
                    "summary": analysis.get("summary", {}),
                    "advanced_analytics": analysis.get("advanced_analytics", {})
                },
                "raw_data": analysis
            },
            "execution_time_seconds": round(execution_time, 2),
            "status": "success"
        }
        
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"Agent flow interrupted: {e}")
        
        return {
            "task": task_instruction,
            "intent": "unknown",
            "plan": [],
            "steps_executed": [],
            "result": {"error": str(e)},
            "execution_time_seconds": round(execution_time, 2),
            "status": "error"
        }
