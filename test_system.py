import sys
import os
sys.path.append(os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def test_health():
    print("Testing /health ... ", end="")
    response = client.get("/health")
    if response.status_code == 200:
        print("PASSED", response.json())
    else:
        print("FAILED", response.status_code, response.text)

def test_run_task():
    print("\nTesting /run-task with sample data ...")
    payload = {"task": "Please analyze the sample_data.csv file and generate a report"}
    response = client.post("/run-task", json=payload)
    
    if response.status_code != 200:
        print("FAILED Status", response.status_code)
        print("ERROR:", response.text)
        return
        
    data = response.json()
    print(json.dumps(data, indent=2))
    
    if data.get("status") == "success":
        print("\n=> SYSTEM TEST PASSED!")
    else:
        print("\n=> SYSTEM TEST FAILED.")

if __name__ == "__main__":
    test_health()
    test_run_task()
