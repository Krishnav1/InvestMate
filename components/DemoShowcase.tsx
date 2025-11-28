
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Check, TrendingUp, Trophy, Mic, Users, ArrowUp, Star, ShieldCheck, Play, Pause, RefreshCw, ChevronRight, Power, Zap } from 'lucide-react';

const DemoShowcase: React.FC = () => {
    const { isDemoOpen, closeDemo } = useApp();
    const [scene, setScene] = useState<'intro' | 'feed' | 'unlock' | 'leaderboard' | 'audio' | 'outro'>('intro');
    const [isPaused, setIsPaused] = useState(false);
    
    // Scenario State
    const [unlockState, setUnlockState] = useState<'locked' | 'modal' | 'processing' | 'success' | 'unlocked'>('locked');
    const [rankState, setRankState] = useState<'initial' | 'climbing'>('initial');
    const [audioState, setAudioState] = useState<'talking' | 'gated'>('talking');

    // Reset logic
    useEffect(() => {
        if (isDemoOpen) {
            setScene('intro');
            setUnlockState('locked');
            setRankState('initial');
            setAudioState('talking');
            setIsPaused(false);
        }
    }, [isDemoOpen]);

    // Scenario Sequencer
    useEffect(() => {
        if (!isDemoOpen || isPaused) return;

        let timeout: ReturnType<typeof setTimeout>;

        const next = (delay: number, nextScene: typeof scene) => {
            timeout = setTimeout(() => setScene(nextScene), delay);
        };

        switch (scene) {
            case 'intro':
                next(2500, 'feed');
                break;
            case 'feed':
                // Scroll feed, then click unlock
                timeout = setTimeout(() => {
                    setScene('unlock');
                }, 3500); 
                break;
            case 'unlock':
                // Logic handled by internal state effects below, eventually moves to leaderboard
                break;
            case 'leaderboard':
                timeout = setTimeout(() => {
                    setRankState('climbing');
                    setTimeout(() => setScene('audio'), 3500);
                }, 1000);
                break;
            case 'audio':
                 timeout = setTimeout(() => {
                    setAudioState('gated');
                    setTimeout(() => setScene('outro'), 3500);
                }, 2500);
                break;
            case 'outro':
                // Stops here
                break;
        }

        return () => clearTimeout(timeout);
    }, [scene, isDemoOpen, isPaused]);

    // Unlock Sequence Logic
    useEffect(() => {
        if (scene === 'unlock' && !isPaused) {
            let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>, t3: ReturnType<typeof setTimeout>, t4: ReturnType<typeof setTimeout>;
            
            // 1. Open Modal
            t1 = setTimeout(() => setUnlockState('modal'), 500);
            // 2. Click Pay (Processing)
            t2 = setTimeout(() => setUnlockState('processing'), 2000);
            // 3. Success
            t3 = setTimeout(() => setUnlockState('success'), 3500);
            // 4. Show Content & Move On
            t4 = setTimeout(() => {
                setUnlockState('unlocked');
                setTimeout(() => setScene('leaderboard'), 2500);
            }, 5000);

            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
        }
    }, [scene, isPaused]);


    if (!isDemoOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
            
            {/* Custom Animations */}
            <style>{`
                @keyframes phone-float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
                @keyframes feed-scroll { 0% { transform: translateY(0); } 30% { transform: translateY(-120px); } 100% { transform: translateY(-120px); } }
                @keyframes cursor-move-unlock { 
                    0% { top: 100%; left: 100%; opacity: 0; } 
                    30% { top: 80%; left: 80%; opacity: 1; }
                    80% { top: 58%; left: 50%; transform: scale(1); }
                    90% { transform: scale(0.9); } 
                    100% { top: 58%; left: 50%; opacity: 0; }
                }
                @keyframes cursor-move-pay {
                    0% { top: 100%; left: 50%; opacity: 0; }
                    30% { top: 90%; left: 50%; opacity: 1; }
                    80% { top: 85%; left: 50%; transform: translate(-50%, 0) scale(1); }
                    90% { top: 85%; left: 50%; transform: translate(-50%, 0) scale(0.9); }
                    100% { top: 85%; left: 50%; transform: translate(-50%, 0) opacity: 0; }
                }
                @keyframes rank-swap { 0% { transform: translateY(0); } 100% { transform: translateY(-100%); } }
                @keyframes rank-swap-down { 0% { transform: translateY(0); } 100% { transform: translateY(100%); } }
            `}</style>

            {/* Header Controls */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
                <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/30">I</div>
                     <div>
                         <h1 className="text-white font-bold text-lg leading-tight">Product Tour</h1>
                         <div className="flex space-x-1 mt-1">
                             {['intro','feed','unlock','leaderboard','audio','outro'].map((s) => (
                                 <div key={s} className={`h-1 rounded-full transition-all duration-300 ${scene === s ? 'w-6 bg-brand-500' : 'w-2 bg-zinc-800'}`}></div>
                             ))}
                         </div>
                     </div>
                </div>
                <button onClick={closeDemo} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* PHONE MOCKUP */}
            <div className="relative w-[340px] h-[680px] bg-black rounded-[3rem] border-8 border-zinc-800 shadow-2xl ring-1 ring-white/10 overflow-hidden animate-[phone-float_6s_ease-in-out_infinite]">
                {/* Dynamic Island */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-28 bg-black rounded-b-2xl z-50 flex items-center justify-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800/50"></div>
                    <div className="w-12 h-1.5 rounded-full bg-zinc-800/50"></div>
                </div>

                {/* --- SCENE: INTRO --- */}
                {scene === 'intro' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-center p-6 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(37,99,235,0.4)]">
                            <TrendingUp className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">InvestMate Ecosystem</h2>
                        <p className="text-zinc-500 text-sm">Monetization • Gamification • Community</p>
                    </div>
                )}

                {/* --- SCENE: FEED & UNLOCK --- */}
                {(scene === 'feed' || scene === 'unlock') && (
                    <div className="w-full h-full bg-slate-50 relative overflow-hidden">
                        {/* Fake Header */}
                        <div className="h-24 bg-white pt-10 px-4 flex justify-between items-center shadow-sm z-10 relative">
                            <div className="font-bold text-xl text-slate-900">Feed</div>
                            <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                        </div>

                        {/* Feed Content */}
                        <div className={`p-4 space-y-4 ${scene === 'feed' ? 'animate-[feed-scroll_3s_ease-in-out_forwards]' : 'translate-y-[-120px]'}`}>
                            {/* Dummy Post 1 */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 opacity-50">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                                </div>
                                <div className="h-16 bg-slate-100 rounded-xl"></div>
                            </div>

                            {/* TARGET POST: SIGNAL */}
                            <div className="bg-white p-4 rounded-2xl shadow-md border border-brand-100 relative overflow-hidden transition-all duration-500 transform scale-100 ring-2 ring-brand-500/0">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-2">
                                        <img src="https://picsum.photos/100?random=2" className="w-10 h-10 rounded-full" />
                                        <div>
                                            <div className="font-bold text-sm text-slate-900">Priya Sharma</div>
                                            <div className="text-[10px] text-slate-500">Guru • 2m ago</div>
                                        </div>
                                    </div>
                                    <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">BUY</div>
                                </div>
                                <div className="font-bold text-lg mb-3">$NIFTY50 Options</div>
                                
                                {/* Locked/Unlocked State */}
                                <div className="grid grid-cols-2 gap-2 relative">
                                    <div className={`p-2 rounded-lg border ${unlockState === 'unlocked' ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 blur-[2px]'}`}>
                                        <div className="text-[10px] text-slate-400">Entry</div>
                                        <div className="font-mono font-bold">19,450</div>
                                    </div>
                                    <div className={`p-2 rounded-lg border ${unlockState === 'unlocked' ? 'bg-green-50 border-green-200' : 'bg-green-50/50 border-green-100 blur-[2px]'}`}>
                                        <div className="text-[10px] text-green-600">Target</div>
                                        <div className="font-mono font-bold text-green-700">19,520</div>
                                    </div>

                                    {/* Lock Overlay */}
                                    {unlockState !== 'unlocked' && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                             <button className={`bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center shadow-lg transition-transform ${unlockState === 'locked' ? 'scale-100' : 'scale-90 opacity-0'}`}>
                                                <Lock className="w-3 h-3 mr-1.5" /> Unlock Signal
                                             </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Dummy Post 2 */}
                             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 opacity-50">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                                </div>
                                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                            </div>
                        </div>

                        {/* MOCK CURSOR: UNLOCK */}
                        {scene === 'feed' && (
                             <div className="absolute z-50 animate-[cursor-move-unlock_3.5s_ease-in-out_forwards] pointer-events-none">
                                 <div className="w-8 h-8 bg-white/50 rounded-full border border-black/20 backdrop-blur-sm"></div>
                             </div>
                        )}

                        {/* PAYMENT MODAL */}
                        {unlockState !== 'locked' && unlockState !== 'unlocked' && (
                            <div className="absolute inset-0 z-40 flex items-end">
                                <div className="bg-black/20 absolute inset-0 backdrop-blur-sm animate-in fade-in"></div>
                                <div className="bg-white w-full rounded-t-3xl p-6 relative z-50 animate-in slide-in-from-bottom duration-300">
                                    <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4"></div>
                                    <h3 className="font-bold text-xl text-center mb-2">Upgrade to Pro</h3>
                                    <p className="text-center text-xs text-slate-500 mb-6">Unlock real-time signals from top Gurus.</p>
                                    
                                    <button className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg relative overflow-hidden">
                                        {unlockState === 'processing' ? (
                                            <span className="flex items-center justify-center"><RefreshCw className="w-4 h-4 animate-spin mr-2"/> Processing</span>
                                        ) : unlockState === 'success' ? (
                                            <span className="flex items-center justify-center"><Check className="w-4 h-4 mr-2"/> Success</span>
                                        ) : (
                                            "Pay ₹899 / month"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* MOCK CURSOR: PAY */}
                        {unlockState === 'modal' && (
                             <div className="absolute z-[60] animate-[cursor-move-pay_1.5s_ease-in-out_forwards] pointer-events-none w-8 h-8 bg-white/50 rounded-full border border-black/20 backdrop-blur-sm translate-x-[-50%]"></div>
                        )}
                    </div>
                )}


                {/* --- SCENE: LEADERBOARD --- */}
                {scene === 'leaderboard' && (
                    <div className="w-full h-full bg-slate-50 flex flex-col">
                        <div className="h-28 bg-gradient-to-r from-purple-600 to-indigo-600 pt-12 px-6 flex items-center text-white shrink-0">
                             <Trophy className="w-6 h-6 mr-3 text-yellow-300" />
                             <div>
                                 <h2 className="font-bold text-lg">Guru Rankings</h2>
                                 <p className="text-xs text-purple-200">Weekly Top Performers</p>
                             </div>
                        </div>

                        <div className="p-4 space-y-3 flex-1 overflow-hidden relative">
                            {/* RANK 1 (Static) */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center">
                                <div className="font-black text-lg text-yellow-500 w-8">#1</div>
                                <div className="w-10 h-10 bg-slate-200 rounded-full mr-3"></div>
                                <div className="flex-1">
                                    <div className="h-3 w-20 bg-slate-200 rounded mb-1"></div>
                                    <div className="h-2 w-12 bg-slate-100 rounded"></div>
                                </div>
                            </div>

                            {/* RANK 2 (Moves Down) */}
                            <div className={`bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center transition-transform duration-1000 ${rankState === 'climbing' ? 'translate-y-[110%]' : ''}`}>
                                <div className="font-black text-lg text-slate-400 w-8">#2</div>
                                <div className="w-10 h-10 bg-slate-200 rounded-full mr-3"></div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm text-slate-700">Rahul Trader</div>
                                    <div className="text-xs text-slate-400">Reach: 12k</div>
                                </div>
                            </div>

                            {/* RANK 3 (The Hero - Moves Up) */}
                            <div className={`bg-white p-3 rounded-xl shadow-lg border-l-4 border-l-green-500 border-y border-r border-slate-100 flex items-center transition-transform duration-1000 relative z-10 ${rankState === 'climbing' ? 'translate-y-[-110%]' : ''}`}>
                                <div className="font-black text-lg text-brand-600 w-8 flex flex-col items-center">
                                    {rankState === 'climbing' ? '#2' : '#3'}
                                    {rankState === 'climbing' && <ArrowUp className="w-3 h-3 text-green-500 animate-bounce" />}
                                </div>
                                <img src="https://picsum.photos/100?random=2" className="w-10 h-10 rounded-full mr-3 border-2 border-brand-500" />
                                <div className="flex-1">
                                    <div className="font-bold text-sm text-slate-900">Priya Sharma</div>
                                    <div className="text-xs text-brand-600 font-bold flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        {rankState === 'climbing' ? 'Revenue: ₹45k' : 'Revenue: ₹12k'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Gamification Context */}
                        <div className="bg-white p-4 m-4 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom duration-700">
                             <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2">
                                 <Star className="w-4 h-4 text-yellow-500" /> Guru Rewards Unlocked
                             </div>
                             <div className="flex space-x-2">
                                 <div className="flex-1 bg-slate-50 p-2 rounded-lg text-center opacity-50"><ShieldCheck className="w-5 h-5 mx-auto mb-1 text-slate-400"/></div>
                                 <div className="flex-1 bg-brand-50 p-2 rounded-lg text-center border border-brand-200"><Users className="w-5 h-5 mx-auto mb-1 text-brand-500"/></div>
                                 <div className="flex-1 bg-slate-50 p-2 rounded-lg text-center opacity-50"><Zap className="w-5 h-5 mx-auto mb-1 text-slate-400"/></div>
                             </div>
                        </div>
                    </div>
                )}

                {/* --- SCENE: AUDIO ROOM --- */}
                {scene === 'audio' && (
                    <div className="w-full h-full bg-[#16181C] flex flex-col relative text-white">
                         <div className="p-4 flex items-center space-x-3 border-b border-white/10">
                             <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center"><Mic className="w-4 h-4 text-red-500"/></div>
                             <div>
                                 <div className="font-bold text-sm">Pre-Market Analysis</div>
                                 <div className="text-[10px] text-green-400 font-bold uppercase animate-pulse">● Live Now</div>
                             </div>
                         </div>

                         {/* Speakers */}
                         <div className="flex-1 p-6 flex flex-col items-center pt-10">
                             <div className="relative mb-4">
                                 <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-indigo-500 relative z-10">
                                     <img src="https://picsum.photos/100?random=2" className="w-full h-full rounded-full border-2 border-[#16181C]" />
                                 </div>
                                 {/* Talking Ring */}
                                 <div className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping z-0"></div>
                             </div>
                             <h3 className="font-bold text-lg">Priya Sharma</h3>
                             <p className="text-xs text-gray-400 mb-8">Host • Guru</p>

                             {/* Listeners */}
                             <div className="flex -space-x-2 opacity-60">
                                 <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-[#16181C]"></div>
                                 <div className="w-10 h-10 rounded-full bg-gray-600 border-2 border-[#16181C]"></div>
                                 <div className="w-10 h-10 rounded-full bg-gray-500 border-2 border-[#16181C]"></div>
                             </div>
                         </div>

                         {/* Captions */}
                         <div className="p-4">
                             <div className="bg-black/30 backdrop-blur rounded-xl p-3 border border-white/5 min-h-[80px] flex items-end">
                                 <p className="text-sm font-medium leading-relaxed">
                                     <span className="text-yellow-500 font-bold text-xs mr-2">Priya:</span>
                                     "...and that's why the 19,450 level is crucial for tomorrow's open."
                                 </p>
                             </div>
                         </div>
                         
                         {/* GATE */}
                         {audioState === 'gated' && (
                             <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in">
                                 <div className="bg-[#1F2228] w-full rounded-2xl p-6 text-center border border-white/10 shadow-2xl">
                                     <Lock className="w-8 h-8 text-red-500 mx-auto mb-3" />
                                     <h3 className="font-bold text-lg mb-1">Free Preview Ended</h3>
                                     <p className="text-xs text-gray-400 mb-4">Join Pro to keep listening.</p>
                                     <button className="w-full bg-white text-black font-bold py-2.5 rounded-lg text-sm">Unlock Access</button>
                                 </div>
                             </div>
                         )}
                    </div>
                )}

                {/* --- SCENE: OUTRO --- */}
                {scene === 'outro' && (
                    <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
                        <h2 className="text-3xl font-black text-white mb-2">Ready to Build?</h2>
                        <p className="text-zinc-400 mb-8">InvestMate is ready for launch.</p>
                        <button 
                            onClick={closeDemo}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(37,99,235,0.4)] animate-pulse"
                        >
                            Start Using App
                        </button>
                        <button onClick={() => setScene('intro')} className="mt-6 text-zinc-500 text-sm hover:text-white flex items-center">
                            <RefreshCw className="w-3 h-3 mr-1.5"/> Replay Tour
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="mt-8 flex items-center space-x-4">
                <button onClick={() => setIsPaused(!isPaused)} className="p-3 bg-zinc-800 rounded-full text-white hover:bg-zinc-700 transition-colors">
                    {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                </button>
                <div className="text-zinc-500 font-mono text-xs">
                    {scene.toUpperCase()} PHASE
                </div>
            </div>
        </div>
    );
};

export default DemoShowcase;
