export type AgentRole = 'Cosmology' | 'Explainer' | 'Philosopher' | 'BioGuard' | 'Citation' | 'Consensus' | 'Critic';

export interface Agent {
  id: string;
  role: AgentRole;
  status: 'idle' | 'thinking' | 'contributing' | 'voting';
  lastContribution?: string;
}

export interface ReasoningRound {
  round: number;
  contributions: {
    agentId: string;
    content: string;
    confidence: number;
  }[];
  consensusSummary?: string;
}

export interface BrainState {
  isProcessing: boolean;
  rounds: ReasoningRound[];
  finalAnswer?: string;
  confidence: number;
  sources: string[];
  mode: 'Scholar' | 'Lecturer' | 'Debate' | 'Archive';
}
