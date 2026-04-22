from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
try:
    from swarm import HawkingSwarm
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__filename__)))
    from swarm import HawkingSwarm

app = FastAPI(title="Stephen Hawking Brain - Cognitive Core")
swarm = HawkingSwarm()

class QueryRequest(BaseModel):
    prompt: str
    mode: Optional[str] = "Scholar"

class AgentContribution(BaseModel):
    agent_role: str
    content: str
    confidence: float

class SwarmResponse(BaseModel):
    final_answer: str
    rounds: List[dict]
    sources: List[str]
    confidence: float

@app.post("/v1/reason", response_model=SwarmResponse)
async def reason(request: QueryRequest):
    """
    Executes a 3-round swarm reasoning process.
    """
    try:
        result = await swarm.process_query(request.prompt, request.mode)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "operational", "engine": "Llama-4-70B-LoRA"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
