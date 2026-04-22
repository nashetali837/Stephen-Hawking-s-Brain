import pytest
import httpx
import asyncio

# Testing the Llama-4 Cosmology Engine
BASE_URL = "http://localhost:8000"

@pytest.mark.asyncio
async def test_health_check():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        assert response.json()["status"] == "operational"

@pytest.mark.asyncio
async def test_swarm_reasoning():
    payload = {
        "prompt": "Test the 3-round reasoning loop",
        "mode": "Scholar"
    }
    async with httpx.AsyncClient() as client:
        # We use a longer timeout for the simulated swarm
        response = await client.post(f"{BASE_URL}/v1/reason", json=payload, timeout=30.0)
        assert response.status_code == 200
        data = response.json()
        assert "final_answer" in data
        assert len(data["rounds"]) >= 1
        assert data["confidence"] > 0

def run_tests():
    print("🚀 Triggering Hawking Core API validation...")
    # In a real CI environment, you would run 'pytest' 
    # This file serves as the specification for engine testing.

if __name__ == "__main__":
    run_tests()
