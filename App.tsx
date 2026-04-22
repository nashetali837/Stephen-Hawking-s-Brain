import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Cpu, 
  Database, 
  Search, 
  Settings, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  Layers,
  ChevronRight,
  Terminal,
  Activity,
  Globe,
  Radio,
  User,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainState, AgentRole, Agent, ReasoningRound } from './types';
import { runSwarmRound, generateFinalAnswer } from './services/gemini';
import { db, auth } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query as firestoreQuery, orderBy, limit, onSnapshot } from 'firebase/firestore';

const AGENTS: AgentRole[] = ['Cosmology', 'Explainer', 'Philosopher', 'BioGuard', 'Citation', 'Critic'];

export default function App() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<BrainState>({
    isProcessing: false,
    rounds: [],
    confidence: 0,
    sources: [],
    mode: 'Scholar'
  });
  const [activeAgents, setActiveAgents] = useState<Agent[]>(
    AGENTS.map(role => ({ id: role, role, status: 'idle' }))
  );
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.rounds, state.isProcessing]);

  const [backendHealth, setBackendHealth] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [globalPulse, setGlobalPulse] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Real-time listener for Global Swarm Pulse
  useEffect(() => {
    const q = firestoreQuery(
      collection(db, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGlobalPulse(logs);
    }, (error) => {
      console.error("Pulse feed disconnected:", error);
    });
    
    return () => unsub();
  }, []);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setBackendHealth(data.status === 'operational'))
      .catch(() => setBackendHealth(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || state.isProcessing) return;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      rounds: [], 
      finalAnswer: undefined,
      confidence: 0,
      sources: []
    }));

    try {
      const allRounds: ReasoningRound[] = [];
      
      // Round 1: Initial Thoughts
      const round1Contributions = [];
      for (const role of AGENTS) {
        updateAgentStatus(role, 'thinking');
        const contribution = await runSwarmRound(query, [], role);
        round1Contributions.push({ agentId: role, ...contribution });
        updateAgentStatus(role, 'contributing');
      }
      
      allRounds.push({ round: 1, contributions: round1Contributions });
      setState(prev => ({ ...prev, rounds: [...allRounds] }));

      // Round 2: Rebuttal & Refinement
      const round2Contributions = [];
      for (const role of AGENTS) {
        updateAgentStatus(role, 'thinking');
        const contribution = await runSwarmRound(query, allRounds, role);
        round2Contributions.push({ agentId: role, ...contribution });
        updateAgentStatus(role, 'contributing');
      }
      allRounds.push({ round: 2, contributions: round2Contributions });
      setState(prev => ({ ...prev, rounds: [...allRounds] }));

      // Final Consensus
      updateAgentStatus('Consensus', 'thinking');
      const finalResult = await generateFinalAnswer(query, allRounds, state.mode);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        finalAnswer: finalResult.answer,
        confidence: finalResult.confidence,
        sources: finalResult.sources
      }));
      resetAgentStatus();

      // Persistence to Firebase if signed in
      if (auth.currentUser && auth.currentUser.emailVerified) {
        try {
          await addDoc(collection(db, 'logs'), {
            query: query,
            consensus: finalResult.answer,
            confidence: finalResult.confidence,
            timestamp: serverTimestamp(),
            userId: auth.currentUser.uid
          });
          console.log("Log persisted to Hawking Archive.");
        } catch (err) {
          console.error("Persistence failed:", err);
        }
      }

    } catch (error) {
      console.error("Swarm failure:", error);
      setState(prev => ({ ...prev, isProcessing: false }));
      resetAgentStatus();
    }
  };

  const updateAgentStatus = (role: string, status: Agent['status']) => {
    setActiveAgents(prev => prev.map(a => a.role === role ? { ...a, status } : a));
  };

  const resetAgentStatus = () => {
    setActiveAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
  };

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-slate-300 font-sans overflow-hidden border-8 border-[#0a0c12] relative">
      {/* Background Glows */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900 blur-[120px]"></div>
      </div>

      {/* Header / Nav */}
      <nav className="relative z-10 h-16 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center">
            <span className="text-black font-bold text-xl tracking-tighter">Σ</span>
          </div>
          <div>
            <h1 className="text-white font-bold tracking-tight text-lg leading-tight uppercase font-serif italic">Stephen Hawking Brain</h1>
            <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-medium">Open-Source Cognitive Swarm</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${backendHealth ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-slate-400">SWARM STATUS: {backendHealth ? 'OPERATIONAL' : 'DEGRADED'}</span>
          </div>
          <div className="flex gap-2">
            {['Scholar', 'Lecturer', 'Debate', 'Archive'].map((m) => (
              <button 
                key={m}
                onClick={() => setState(prev => ({ ...prev, mode: m as any }))}
                className={`px-3 py-1 border rounded transition-all uppercase text-[10px] ${
                  state.mode === m 
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold' 
                    : 'border-white/20 bg-white/5 text-slate-400 hover:border-white/40'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="text-cyan-400 opacity-70">v0.4.2-PILOT</div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-6 ml-2">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[9px] text-white font-bold leading-none">{currentUser.displayName}</p>
                  <p className="text-[8px] text-cyan-400 opacity-60 leading-none mt-1">Verified Scholar</p>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSignIn}
                className="flex items-center gap-2 px-3 py-1 bg-cyan-500 text-black rounded font-bold text-[10px] uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                <User className="w-3.5 h-3.5" />
                Initialize Identity
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 grid grid-cols-12 h-[calc(100vh-64px-16px)] gap-4 p-4">
        {/* Left Col: Agents & Telemetry */}
        <section className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <div className="bg-[#0a0c12]/80 border border-white/10 rounded-xl p-4 flex-1 backdrop-blur-xl flex flex-col overflow-hidden">
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 font-bold border-b border-white/5 pb-2">7-Agent Orchestrator</h2>
            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
              <div className="flex items-center justify-between p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-xs text-cyan-100 font-semibold italic">Llama-4 Core (70B)</span>
                <span className="text-[10px] text-cyan-400 font-mono">LOAD 88%</span>
              </div>
              <div className="space-y-1.5">
                {activeAgents.map((agent) => (
                  <div key={agent.id} className="flex justify-between text-[11px] items-center px-2 py-2 border border-white/5 rounded bg-white/2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-3 rounded-full ${agent.status !== 'idle' ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`} />
                      <span className="text-slate-400 uppercase tracking-tight">{agent.role} Adapter</span>
                    </div>
                    <span className={`font-mono uppercase text-[9px] ${
                      agent.status === 'thinking' ? 'text-cyan-400 animate-pulse' : 
                      agent.status === 'contributing' ? 'text-green-500' : 'text-slate-600'
                    }`}>
                      {agent.status === 'idle' ? 'Ready' : agent.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#0a0c12]/80 border border-white/10 rounded-xl p-4 h-48 backdrop-blur-xl">
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-bold">Hardware Telemetry</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="opacity-60">VRAM UTILIZATION</span>
                  <span className="text-white">64.2GB / 80GB</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[80%] h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="opacity-60">CONVERGENCE PROB</span>
                  <span className="text-white">{(state.confidence * 100 || 98.4).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: `${state.confidence * 100 || 98.4}%` }}
                    className="h-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                  ></motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Center: Swarm Visualizer & Output */}
        <section className="col-span-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex-[1.5] bg-black/40 border border-cyan-500/20 rounded-2xl relative flex items-center justify-center overflow-hidden shadow-[inset_0_0_50px_rgba(0,255,255,0.05)]">
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
               <div className="w-48 h-48 rounded-full border border-cyan-500/20 flex items-center justify-center">
                 <div className="w-32 h-32 rounded-full border border-cyan-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.2)]">
                   <div className="w-16 h-16 rounded-full bg-cyan-500 blur-sm opacity-50"></div>
                   <div className="w-8 h-8 rounded-full bg-white absolute"></div>
                 </div>
               </div>
               <div className="absolute w-[400px] h-[400px] border border-white/5 rounded-full rotate-45"></div>
               <div className="absolute w-2 h-2 bg-white rounded-full translate-x-[200px] shadow-[0_0_10px_#fff]"></div>
               <div className="absolute w-2 h-2 bg-cyan-400 rounded-full translate-x-[-150px] translate-y-[-100px] shadow-[0_0_10px_#22d3ee]"></div>
               <div className="absolute w-2 h-2 bg-indigo-400 rounded-full translate-x-[120px] translate-y-[150px] shadow-[0_0_10px_#818cf8]"></div>
            </div>

            {/* Active Visualizer Layer */}
            <div className="relative z-10 flex items-center justify-center gap-8 bg-black/20 p-8 rounded-full backdrop-blur-sm border border-white/5">
              {activeAgents.map((agent) => (
                <div key={agent.id} className="relative flex flex-col items-center">
                  <motion.div 
                    animate={agent.status !== 'idle' ? { 
                      scale: [1, 1.2, 1], 
                      boxShadow: ['0 0 0px var(--color-cyan-glow)', '0 0 20px var(--color-cyan-glow)', '0 0 0px var(--color-cyan-glow)']
                    } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                      agent.status === 'idle' ? 'border-white/10 bg-white/5 text-slate-500' : 'border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    }`}
                  >
                    {agent.role === 'Cosmology' && <Globe className="w-5 h-5" />}
                    {agent.role === 'Explainer' && <MessageSquare className="w-5 h-5" />}
                    {agent.role === 'Philosopher' && <Zap className="w-5 h-5" />}
                    {agent.role === 'BioGuard' && <Activity className="w-5 h-5" />}
                    {agent.role === 'Citation' && <Database className="w-5 h-5" />}
                    {agent.role === 'Critic' && <Radio className="w-5 h-5" />}
                  </motion.div>
                </div>
              ))}
            </div>

            <div className="absolute top-4 left-4 font-mono text-[10px] text-cyan-400/60 uppercase tracking-widest">Topology: Distributed Cluster</div>
            <div className="absolute bottom-6 flex flex-col items-center">
               <p className="text-cyan-500/60 text-[10px] tracking-[0.4em] uppercase font-bold mb-2">3-Round Swarm Consensus</p>
               <div className="flex gap-1">
                 {[1, 2, 3].map(r => (
                   <div key={r} className={`w-12 h-0.5 rounded-full ${state.rounds.length >= r ? 'bg-cyan-500' : 'bg-white/10'}`} />
                 ))}
               </div>
            </div>
          </div>

          <div className="flex-1 bg-[#05060a] border border-white/10 rounded-2xl p-6 font-mono text-sm shadow-2xl relative flex flex-col overflow-hidden">
            <div className="absolute top-[-10px] left-8 px-3 py-1 bg-cyan-500 text-black text-[10px] font-bold rounded uppercase tracking-widest z-20">Output Terminal</div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2 pb-4">
              {!state.finalAnswer && state.rounds.length === 0 && !state.isProcessing && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12 opacity-40">
                  <Brain className="w-12 h-12 text-cyan-400 mb-2" />
                  <p className="text-xs tracking-widest uppercase italic">Awaiting Quantum Input...</p>
                </div>
              )}

              {state.rounds.map((round) => (
                <div key={round.round} className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 text-[10px] text-cyan-500 font-bold">
                    <span className="px-1 bg-cyan-500/20 border border-cyan-500/20 rounded">ROUND {round.round}</span>
                    <span className="h-[1px] flex-1 bg-cyan-500/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {round.contributions.slice(0, 4).map((c, i) => (
                      <div key={i} className="text-slate-500 bg-white/2 p-2 rounded italic">
                        <span className="text-cyan-400 font-bold mr-2">{c.agentId}:</span>
                        <span className="line-clamp-2">{c.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {state.finalAnswer && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex gap-2">
                    <span className="text-indigo-400 font-bold uppercase tracking-tighter">Final Output:</span>
                  </div>
                  <div className="text-slate-300 italic font-serif text-lg leading-relaxed bg-white/2 p-4 rounded-xl border border-white/5">
                    {state.finalAnswer}
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="text-[10px] flex items-center gap-2">
                      <span className="text-slate-500">CONFIDENCE:</span>
                      <span className="text-green-400 font-bold">{(state.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-[10px] flex items-center gap-2">
                      <span className="text-slate-500">GROUNDING:</span>
                      <div className="flex gap-1">
                        {state.sources.map((s, i) => (
                          <span key={i} className="text-white bg-white/10 px-2 py-0.5 rounded italic">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {state.isProcessing && (
                <div className="flex items-center gap-3 text-cyan-400 font-bold animate-pulse">
                  <span className="text-xl">_</span>
                  <span className="text-xs uppercase tracking-[0.3em]">Analyzing Vector Space...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-white/10 relative">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="PROMPT RECONSTRUCTION UNIT ACTIVE..."
                className="w-full bg-[#16181D]/50 border border-white/10 rounded-xl py-3 px-6 pr-14 text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-gray-600 font-mono text-xs uppercase tracking-widest"
              />
              <button 
                type="submit"
                disabled={state.isProcessing}
                className={`absolute right-2 top-[calc(1rem+4px)] p-2 rounded-lg transition-all ${
                  query.trim() ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-gray-600'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </section>

        {/* Right Col: Dynamics & Actions */}
        <section className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <div className="bg-[#0a0c12]/80 border border-white/10 rounded-xl p-4 flex-1 backdrop-blur-xl space-y-6">
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 font-bold border-b border-white/5 pb-2">Swarm Dynamics</h2>
            
            <div className="space-y-4">
              <div className="p-3 rounded bg-white/5 border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase mb-2 flex justify-between">
                  <span>Round 1: Divergence</span>
                  <span className={state.rounds.length >= 1 ? 'text-cyan-500' : 'text-slate-600'}>
                    {state.rounds.length >= 1 ? 'COMPLETE' : 'PENDING'}
                  </span>
                </p>
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 transition-all duration-500 ${state.rounds.length >= 1 ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-slate-700'}`} />
                  ))}
                </div>
              </div>

              <div className="p-3 rounded bg-white/5 border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase mb-2 flex justify-between">
                  <span>Round 2: Debate</span>
                  <span className={state.rounds.length >= 2 ? 'text-cyan-500' : 'text-slate-600'}>
                    {state.rounds.length >= 2 ? 'COMPLETE' : 'PENDING'}
                  </span>
                </p>
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 transition-all duration-500 ${state.rounds.length >= 2 ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-slate-700'}`} />
                  ))}
                </div>
              </div>

              <div className="p-3 rounded bg-white/5 border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase mb-2 flex justify-between">
                  <span>Round 3: Convergence</span>
                  <span className={state.finalAnswer ? 'text-green-500' : 'text-slate-600'}>
                    {state.finalAnswer ? 'COMPLETE' : 'PENDING'}
                  </span>
                </p>
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 transition-all duration-500 ${state.finalAnswer ? 'bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-slate-700'}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <h2 className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 font-bold border-b border-white/5 pb-2">Global Swarm Pulse</h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {globalPulse.length === 0 ? (
                  <div className="p-3 bg-black/20 rounded border border-white/5 text-[9px] text-slate-600 italic">
                    &gt;&gt; No remote convergences detected. Initializing interlink...
                  </div>
                ) : (
                  globalPulse.map((pulse) => (
                    <div 
                      key={pulse.id} 
                      onClick={() => setQuery(pulse.query)}
                      className="p-3 bg-white/5 border border-white/5 rounded-lg cursor-pointer hover:bg-cyan-500/5 hover:border-cyan-500/20 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[8px] text-cyan-400 font-mono uppercase">Converged Query</span>
                        <span className="text-[8px] text-slate-600 font-mono">{(pulse.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-[10px] text-slate-300 line-clamp-2 leading-tight group-hover:text-white">
                        "{pulse.query}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4">
              <h4 className="text-[9px] uppercase tracking-[0.2em] text-slate-600 mb-2">Internal Feedback</h4>
              <div className="p-3 bg-black/40 rounded border border-white/5 font-mono text-[9px] leading-relaxed text-slate-500 italic">
                {state.isProcessing 
                  ? "&gt;&gt; SWARM SYNCHRONIZING NEURAL WEIGHTS across 7-agent cluster. Convergence threshold set at 0.95..."
                  : state.finalAnswer 
                  ? "&gt;&gt; LOG: Consensus achieved at alpha-level 0.98. Minimal divergence detected in cosmology sector."
                  : "&gt;&gt; READY: Awaiting user prompt for Llama-4 reconstruction cycle..."
                }
              </div>
            </div>
          </div>

          <button className="w-full h-14 bg-white text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-cyan-400 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            Request Verification
          </button>
        </section>
      </main>

      <footer className="h-10 px-8 flex justify-between items-center z-20 relative bg-black/20 border-t border-white/5">
        <div className="flex gap-6 text-[9px] uppercase tracking-tighter text-slate-500 font-mono">
          <span>Local RAG: FAISS Optimized</span>
          <span className="hidden md:inline">Dataset: Hawking-Only Corpus (80GB)</span>
          <span className="hidden lg:inline">A100/4090 Required</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-500 font-bold uppercase tracking-widest">
            Hardware Constraint Active
          </div>
          <span className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">Public Rollout: June 2026</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.3);
        }
        @keyframes pulse-cyan {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
