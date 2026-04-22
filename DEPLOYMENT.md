# Stephen Hawking Brain: Omni-Deployment Guide 🚀

The Stephen Hawking Brain system is designed for high-availability cognitive reconstruction across diverse infrastructure layers.

## 1. Cloud-Native (Multi-Cloud / Serverless)
### Vercel / Netlify
- The project is pre-configured with `vercel.json`.
- Simply connect your GitHub repo to Vercel.
- Configure `GEMINI_API_KEY` in Vercel Environment Variables.
- **Benefit**: Zero-maintenance scale for the cognitive interface.

### Cloud Run / AWS Fargate
- Use the provided `Dockerfile`.
- `docker build -t gcr.io/your-project/hawking-brain .`
- `docker push gcr.io/your-project/hawking-brain`
- Deploy with `PORT=3000`.

## 2. On-Premise & Hyperconverged
### Docker Compose
- Run `docker-compose up -d`.
- This spins up the Node.js Cognitive Core and provides an orchestration layer.
- **Local FAISS**: The system is designed to interface with a local FAISS vector store. In a hyperconverged environment, mount your RAG data to `/app/rag_data`.

### Bare Metal (Node.js)
1. `npm install`
2. `npm run build`
3. `npm start`
4. Use PM2 for persistence: `pm2 start dist/server.js`

## 3. Hybrid Edge Logic
- The `python_core/` provides the high-performance Llama-4 reasoning engine.
- Deploy the Python core on GPU-heavy edge nodes (using NVIDIA A100/4090).
- The Node.js frontend can bridge to this engine via the `/api/cosmos/reason` gateway.

## 4. Configuration Matrix
| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | Environment Toggle | `development` |
| `GEMINI_API_KEY` | Swarm Intelligence Key | Required |
| `PORT` | Networking | `3000` |
