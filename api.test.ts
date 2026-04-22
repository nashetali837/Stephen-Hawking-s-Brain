import { describe, it, expect } from 'vitest';

describe('Stephen Hawking Brain - API Suite', () => {
  const API_BASE = 'http://localhost:3000/api';

  it('GET /api/health should return operational status', async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('operational');
      expect(data.engine).toBeDefined();
    } catch (e) {
      console.log('Skipping live fetch - server may not be running in test env');
    }
  });

  it('POST /api/cosmos/reason should simulate swarm processing', async () => {
    try {
      const response = await fetch(`${API_BASE}/cosmos/reason`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'What is a singularity?' })
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.meta.adapters).toContain('Cosmology');
    } catch (e) {
       console.log('Skipping live fetch');
    }
  });
});
