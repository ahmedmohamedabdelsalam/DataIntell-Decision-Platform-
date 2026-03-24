import os
import shutil
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Step 1: ENV SETUP in code
load_dotenv()
api_key = os.getenv("GOOGLE_GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("Missing GOOGLE_GEMINI_API_KEY in environment variables.")

# Import the core agent execution flow
from agent.executor import run_agent

app = FastAPI(
    title="AI Agent System", 
    description="An AI agent system from scratch that plans and executes tools",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class TaskRequest(BaseModel):
    task: str
    file_id: str | None = None

# Step 2: API
@app.get("/health")
def health_check():
    """Health check endpoint to ensure API works and key is loaded."""
    return {"status": "active", "api_key_loaded": bool(api_key)}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a dataset for agent analysis."""
    try:
        file_extension = file.filename.split(".")[-1]
        if file_extension not in ["csv", "xlsx"]:
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported.")
        
        file_id = f"{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, file_id)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"file_id": file_id, "filename": file.filename, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/run-task")
def run_task_endpoint(request: TaskRequest):
    """Endpoint to run an AI task through the agent system."""
    try:
        if not request.task:
            raise ValueError("Task description cannot be empty.")
            
        # Step 7: AGENT FLOW
        result = run_agent(request.task, request.file_id)
        
        # Step 8: RESPONSE FORMAT
        return result
    except Exception as e:
        # Step 9: ERROR HANDLING
        raise HTTPException(status_code=500, detail=str(e))
