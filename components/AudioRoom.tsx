



import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Mic, MicOff, Hand, MoreHorizontal, X, MessageSquare, ChevronDown, UserPlus, Users, Sparkles, TrendingUp, Power, Lock } from 'lucide-react';
import { audioService } from '../services/audioService';
import { TranscriptSegment } from '../types';

const MAX_FREE_LISTENING_TIME = 120; // 2 minutes

const AudioRoom: React.FC = () => {
    const { activeRoom, currentUser, leaveRoom, endRoom, minimizeRoom, openPaymentModal } = useApp();
    const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
    const [audioLevels, setAudioLevels] = useState<Record<string, number>>({});
    const [isMyMicMuted, setIsMyMicMuted] = useState(true);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [showConfirmEnd, setShowConfirmEnd] = useState(false);
    
    // Timer State for Non-Pro Users
    const [listeningTime, setListeningTime] = useState(0);
    const [isTimeUp, setIsTimeUp] = useState(false);

    const transcriptsEndRef = useRef<HTMLDivElement>(null);

    // Gating Logic Timer
    useEffect(() => {
        if (!activeRoom || currentUser.isPro || isTimeUp) return;

        const timer = setInterval(() => {
            setListeningTime(prev => {
                if (prev >= MAX_FREE_LISTENING_TIME) {
                    setIsTimeUp(true);
                    clearInterval(timer);
                    return prev;
                }
                return prev + 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [activeRoom, currentUser.isPro, isTimeUp]);

    useEffect(() => {
        if (!activeRoom) return;

        // Connect to mock service
        audioService.connect(activeRoom.speakers);

        // Subscribe to audio levels
        const unsubLevels = audioService.onAudioLevel((speakerId, level) => {
            if (!isTimeUp) {
                 setAudioLevels(prev => ({ ...prev, [speakerId]: level }));
            }
        });

        // Subscribe to transcripts
        const unsubTranscripts = audioService.onTranscript((segment) => {
             if (!isTimeUp) {
                setTranscripts(prev => [...prev.slice(-4), segment]); // Keep last 5
             }
        });

        return () => {
            audioService.disconnect();
            unsubLevels();
            unsubTranscripts();
        };
    }, [activeRoom, isTimeUp]);

    // Auto scroll transcripts
    useEffect(() => {
        if (transcriptsEndRef.current) {
            transcriptsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcripts]);

    const handleUnlock = () => {
        openPaymentModal("Continue Listening to Audio Room");
    };

    if (!activeRoom) return null;

    const isHost = activeRoom.hostId === currentUser.id;
    const speakers = activeRoom.speakers.filter(s => s.role !== 'LISTENER');
    const listeners = activeRoom.speakers.filter(s => s.role === 'LISTENER');

    const toggleMic = () => {
        if(navigator.vibrate) navigator.vibrate(10);
        setIsMyMicMuted(!isMyMicMuted);
    };

    const toggleHand = () => {
        if(navigator.vibrate) navigator.vibrate(10);
        setIsHandRaised(!isHandRaised);
    };

    const handleEndRoom = () => {
        if (navigator.vibrate) navigator.vibrate(20);
        endRoom(activeRoom.id);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0F1115] text-white flex flex-col animate-in slide-in-from-bottom duration-300 relative">
            
            {/* PAYWALL OVERLAY */}
            {isTimeUp && !currentUser.isPro && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-[#16181C] w-full max-w-sm rounded-3xl p-8 text-center border border-white/10 shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Lock className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black mb-2">Free Preview Ended</h2>
                        <p className="text-gray-400 mb-6 text-sm">Join InvestMate Pro to continue listening to this exclusive session.</p>
                        
                        <button 
                            onClick={handleUnlock}
                            className="w-full bg-white text-black font-bold py-3.5 rounded-xl mb-3 hover:bg-gray-200 transition-colors"
                        >
                            Unlock Full Access
                        </button>
                        <button 
                            onClick={leaveRoom}
                            className="text-gray-500 text-sm font-bold hover:text-white transition-colors"
                        >
                            Leave Room
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={`px-5 py-4 flex justify-between items-start shrink-0 ${isTimeUp ? 'blur-sm' : ''}`}>
                <button onClick={minimizeRoom} className="p-2 -ml-2 text-gray-400 hover:text-white">
                    <ChevronDown className="w-6 h-6" />
                </button>
                <div className="flex-1 text-center px-4 flex flex-col items-center">
                    <div className="flex items-center space-x-2 mb-1">
                        <img src={activeRoom.clubImage} className="w-4 h-4 rounded-full border border-white/20"/>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[120px]">{activeRoom.clubName}</span>
                    </div>
                    <h2 className="text-lg font-bold leading-tight line-clamp-2">{activeRoom.title}</h2>
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider mt-1 animate-pulse">● Live Now</span>
                </div>
                
                {isHost ? (
                    <button 
                        onClick={() => setShowConfirmEnd(true)} 
                        className="p-2 -mr-2 text-red-500 font-bold text-xs uppercase bg-red-500/10 rounded-full px-4 hover:bg-red-500/20 flex items-center"
                    >
                        <Power className="w-3.5 h-3.5 mr-1" /> End
                    </button>
                ) : (
                    <button onClick={leaveRoom} className="p-2 -mr-2 text-red-500 font-bold text-xs uppercase bg-red-500/10 rounded-full px-4 hover:bg-red-500/20">
                        Leave
                    </button>
                )}
            </div>

            {/* Live Ticker Context */}
            {activeRoom.relatedTickers.length > 0 && (
                <div className={`px-5 mb-4 overflow-x-auto no-scrollbar ${isTimeUp ? 'blur-sm' : ''}`}>
                    <div className="flex space-x-3">
                        {activeRoom.relatedTickers.map(ticker => (
                            <div key={ticker} className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
                                <span className="font-bold text-xs">{ticker}</span>
                                <span className="text-[10px] text-green-400 font-mono">+0.45%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Speakers Grid */}
            <div className={`flex-1 overflow-y-auto px-5 ${isTimeUp ? 'blur-sm pointer-events-none' : ''}`}>
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Speakers ({speakers.length})</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {speakers.map(speaker => {
                            const level = audioLevels[speaker.id] || 0;
                            const isTalking = level > 10;
                            
                            return (
                                <div key={speaker.id} className="flex flex-col items-center">
                                    <div className="relative">
                                        <div 
                                            className="w-20 h-20 rounded-full mb-2 overflow-hidden border-2 transition-all duration-100 relative z-10"
                                            style={{ borderColor: isTalking ? '#3b82f6' : 'transparent' }}
                                        >
                                            <img src={speaker.user.avatar} className="w-full h-full object-cover" />
                                        </div>
                                        {/* Audio Pulse Ring */}
                                        {isTalking && (
                                            <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping z-0"></div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 bg-gray-800 p-1 rounded-full border border-gray-700 z-20">
                                            {speaker.isMuted ? <MicOff className="w-3 h-3 text-red-500" /> : <Mic className="w-3 h-3 text-green-500" />}
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold truncate max-w-full">{speaker.user.name.split(' ')[0]}</span>
                                    <span className="text-[10px] text-gray-500 uppercase">{speaker.role}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Listeners */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                        Listeners ({activeRoom.listenerCount})
                        <span className="ml-auto flex items-center text-[10px] bg-white/10 px-2 py-0.5 rounded-full"><Users className="w-3 h-3 mr-1"/> Join Stage</span>
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                        {listeners.map(listener => (
                             <div key={listener.id} className="flex flex-col items-center opacity-70">
                                <div className="w-14 h-14 rounded-full mb-1 overflow-hidden bg-gray-800 border border-white/5 relative">
                                    <img src={listener.user.avatar} className="w-full h-full object-cover" />
                                    {listener.id === 'me' && isHandRaised && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-pulse">
                                            <Hand className="w-6 h-6 text-yellow-400" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-medium truncate max-w-full">{listener.id === 'me' ? 'You' : listener.user.name.split(' ')[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Live Transcription Overlay */}
            <div className={`px-5 mb-4 relative z-10 ${isTimeUp ? 'opacity-0' : ''}`}>
                 <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 h-32 overflow-hidden flex flex-col justify-end mask-fade-top">
                    <div className="absolute top-2 right-2 flex items-center space-x-1 text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        <Sparkles className="w-3 h-3" /> AI Captions
                    </div>
                    <div className="space-y-2 overflow-y-auto no-scrollbar">
                        {transcripts.map(t => (
                            <div key={t.id} className="animate-in slide-in-from-bottom-2 fade-in">
                                <span className="text-[10px] font-bold text-yellow-500 mr-2">{t.userName}:</span>
                                <span className="text-sm font-medium text-white/90 leading-tight">{t.text}</span>
                            </div>
                        ))}
                        <div ref={transcriptsEndRef} />
                    </div>
                 </div>
            </div>

            {/* Bottom Controls */}
            <div className={`p-5 pb-8 bg-[#16181C] border-t border-white/5 flex items-center justify-between shrink-0 ${isTimeUp ? 'blur-sm pointer-events-none' : ''}`}>
                <button onClick={toggleHand} className={`p-4 rounded-full transition-all active:scale-95 ${isHandRaised ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                    <Hand className="w-6 h-6" />
                </button>
                
                <button 
                    onClick={toggleMic}
                    className={`p-6 rounded-full transition-all active:scale-95 shadow-xl ${isMyMicMuted ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                    {isMyMicMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                <button className="p-4 bg-white/5 rounded-full text-white hover:bg-white/10 active:scale-95">
                    <MoreHorizontal className="w-6 h-6" />
                </button>
            </div>

            {/* End Room Confirmation Modal */}
            {showConfirmEnd && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in">
                    <div className="bg-[#16181C] w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">End this session?</h3>
                        <p className="text-sm text-gray-400 mb-6">This will close the room for all speakers and listeners. You cannot undo this.</p>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setShowConfirmEnd(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleEndRoom}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
                            >
                                End Room
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioRoom;