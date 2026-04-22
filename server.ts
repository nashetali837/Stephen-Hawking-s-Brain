import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing for API requests
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "operational",
      version: "0.4.2-PILOT",
      engine: "Llama-4-70B-Quantized",
      deployment: "Full-Stack Hybrid"
    });
  });

  // Proxy-like simulation for Python Core (Cosmology Engine)
  app.post("/api/cosmos/reason", (req, res) => {
    const { query } = req.body;
    // In a real multi-cloud env, this would call a separate microservice 
    // but for this MVP, we provide a unified response layer
    res.json({
      success: true,
      data: {
        thought: "Processing through Llama-4 Hawking Swarm...",
        meta: {
          vram: "64.2GB",
          adapters: ["Cosmology", "Explainer"],
          timestamp: new Date().toISOString()
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cognitive Core] Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical Failure in Cognitive Core startup:", err);
  process.exit(1);
});
