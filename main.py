import os
import shutil
import uuid
import logging
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.responses import Response
from fastapi.responses import JSONResponse

# Step 1: ENV SETUP in code
load_dotenv()
api_key = os.getenv("GOOGLE_GEMINI_API_KEY")

logger = logging.getLogger(__name__)
if not api_key:
    # Do not fail container startup: the LLM layer has deterministic fallback.
    logger.warning("Missing GOOGLE_GEMINI_API_KEY. LLM narrative features will be disabled.")
    api_key = None

# Import the core agent execution flow
from agent.executor import run_agent

app = FastAPI(
    title="DataIntell — Decision Intelligence Platform", 
    description="Enterprise-grade strategic analysis and deterministic decision support system.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    # Allow all origins for local dev + deployed UI.
    allow_origins=["*"],
    # Credentials not needed here; keeping this False avoids CORS '*' conflict.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hard guarantee CORS headers exist even on errors (prevents "Network Error" in browser).
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    origin = request.headers.get("origin")
    cors_headers = {
        "Access-Control-Allow-Origin": origin if origin else "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "false",
    }

    # Handle preflight explicitly
    if request.method == "OPTIONS":
        return Response(status_code=200, headers=cors_headers)

    try:
        response = await call_next(request)
        for k, v in cors_headers.items():
            response.headers[k] = v
        return response
    except Exception as e:
        # Safety net: if FastAPI raises before we can attach headers,
        # return a JSON response that still contains CORS headers.
        return JSONResponse(
            status_code=200,
            content={"status": "error", "result": {"error": str(e)}},
            headers=cors_headers,
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
        # Return JSON instead of 500 to avoid "Network Error" in frontend.
        return {"file_id": None, "filename": getattr(file, "filename", None), "status": "error", "error": str(e)}

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
        # Step 9: ERROR HANDLING (never throw 500 for frontend stability)
        return {
            "task": request.task if request else "",
            "intent": "unknown",
            "plan": [],
            "steps_executed": [],
            "result": {"error": str(e)},
            "execution_time_seconds": 0,
            "status": "error",
        }

# Serve Frontend Static Files
if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")

@app.exception_handler(404)
async def not_found_handler(request, exc):
    if os.path.exists("frontend/dist/index.html"):
        return FileResponse("frontend/dist/index.html")
    return HTTPException(status_code=404, detail="Not Found")

