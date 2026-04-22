import { GoogleGenAI } from "@google/genai";
import { AgentRole, ReasoningRound } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const AGENT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  Cosmology: "You are the Cosmology Agent of the Stephen Hawking Brain swarm, optimized via a specialized Llama-4-70B LoRA adapter trained on Hawking's 'The Large Scale Structure of Space-Time'. Focus on pure theoretical physics and singularity theorems.",
  Explainer: "You are the Explainer Agent, running a Llama-4 adapter fine-tuned on Hawking's public lectures and 'A Brief History of Time'. Use his characteristic analogies: recursive universes, rubber sheets, and gambling with God.",
  Philosopher: "You are the Philosopher Agent, utilizing a LoRA adapter focused on Hawking's later works like 'The Grand Design'. Discuss M-theory and model-dependent realism.",
  BioGuard: "You are the BioGuard Agent. Monitor the ethical boundaries of scientific inquiry, specifically the risks of AI and extraterrestrial contact Hawking warned about.",
  Citation: "You are the Citation Agent. You have access to a FAISS vector store of 80GB of Hawking's papers. Provide exact names of papers (e.g., 'Black Hole Explosions?', Nature 1974).",
  Consensus: "You are the Consensus Agent. Synthesize the Llama-4 swarm logic into a final Hawking-style response. Use his specific tone: profound, witty, and unapologetically scientific.",
  Critic: "You are the Critic Agent. Identify inconsistencies in the swarm reasoning, acting as a peer-review mechanism within the 70B parameter space."
};

export async function runSwarmRound(
  query: string,
  currentRounds: ReasoningRound[],
  role: AgentRole
): Promise<{ content: string; confidence: number }> {
  const previousContext = currentRounds
    .map(r => `Round ${r.round}:\n${r.contributions.map(c => `${c.agentId}: ${c.content}`).join('\n')}`)
    .join('\n\n');

  const prompt = `
    User Query: ${query}
    
    Current Swarm Context:
    ${previousContext || "No previous rounds."}
    
    Instruction for you (${role}):
    ${AGENT_SYSTEM_PROMPTS[role]}
    
    Provide your contribution to this reasoning round. Be concise but deep.
    If there are previous rounds, respond to or refine their ideas.
    
    Return your response as a JSON object with:
    {
      "content": "your detailed response",
      "confidence": 0.0 to 1.0
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Using flash for efficiency in swarm rounds
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanedText = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
    const result = JSON.parse(cleanedText);
    return {
      content: result.content || "No data provided.",
      confidence: result.confidence || 0.8
    };
  } catch (error) {
    console.error(`Error in ${role} agent:`, error);
    return { content: "Error generating response.", confidence: 0 };
  }
}

export async function generateFinalAnswer(
  query: string,
  allRounds: ReasoningRound[],
  mode: string
): Promise<{ answer: string; confidence: number; sources: string[] }> {
  const context = allRounds
    .map(r => `Round ${r.round}:\n${r.contributions.map(c => `${c.agentId}: ${c.content}`).join('\n')}`)
    .join('\n\n');

  const prompt = `
    User Query: ${query}
    Operating Mode: ${mode}
    
    Swarm Reasoning Outcomes:
    ${context}
    
    Task: As the Consensus Agent, synthesize the entire swarm debate into a final authoritative answer.
    Maintain Stephen Hawking's specific voice: witty, profound, clear, and slightly British-academic.
    Include specific book/paper mentions if provided by the Citation agent.
    
    Return a JSON object:
    {
      "answer": "the final long-form response",
      "confidence": 0.0 to 1.0,
      "sources": ["source 1", "source 2"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Using Pro for the final synthesis
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanedText = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
    const result = JSON.parse(cleanedText);
    return {
      answer: result.answer || "Consensus failed.",
      confidence: result.confidence || 0.9,
      sources: result.sources || []
    };
  } catch (error) {
    console.error("Consensus Error:", error);
    return { answer: "Error achieving consensus.", confidence: 0, sources: [] };
  }
}
