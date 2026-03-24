import logging

logger = logging.getLogger(__name__)

def create_execution_plan(parsed_task: dict) -> list:
    """Maps parsed steps to an actionable execution plan sequence."""
    logger.info("Creating execution plan")
    steps = parsed_task.get("steps", [])
    
    plan = []
    for step in steps:
        plan.append({
            "action": step,
            "status": "pending"
        })
    return plan
