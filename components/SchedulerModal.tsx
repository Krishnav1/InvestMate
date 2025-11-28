
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Sparkles, Repeat, Megaphone, Bell, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AlertType, RepeatType } from '../types';

interface SchedulerModalProps {
    onClose: () => void;
}

const SchedulerModal: React.FC<SchedulerModalProps> = ({ onClose }) => {
    const { clubs, currentUser, scheduleAlert } = useApp();
    
    const [alertType, setAlertType] = useState<AlertType>('PRE_MARKET');
    const [content, setContent] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [targetClub, setTargetClub] = useState<string>('public');
    const [repeat, setRepeat] = useState<RepeatType>('NONE');
    const [aiContext, setAiContext] = useState(false);

    // Initial Defaults
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setScheduledDate(tomorrow.toISOString().split('T')[0]);
        setScheduledTime('08:45'); // Default Pre-Market time
        
        // Default Template
        setContent("☀️ PRE-MARKET PLAN\n\n🔑 Key Levels to Watch:\n\n1. NIFTY Support: \n2. BANKNIFTY Resistance: \n\n📰 Global Cues: Neutral");
    }, []);

    const handleTypeChange = (type: AlertType) => {
        setAlertType(type);
        if (type === 'PRE_MARKET') {
            setScheduledTime('08:45');
            setContent("☀️ PRE-MARKET PLAN\n\n🔑 Key Levels to Watch:\n\n1. NIFTY Support: \n2. BANKNIFTY Resistance: \n\n📰 Global Cues: Neutral");
        } else if (type === 'POST_MARKET') {
            setScheduledTime('15:45');
            setContent("🌙 POST-MARKET SUMMARY\n\n📉 Top Losers:\n📈 Top Gainers:\n\n📝 Analysis: ");
        } else if (type === 'NEWS') {
            setContent("📰 UPCOMING EVENT: [Event Name]\n\nImpact Expected: High\nTime: ");
        } else {
            setContent("🔔 TRADE ALERT REMINDER\n\nTicker: \nStatus: Still Active");
        }
    };

    const handleSchedule = () => {
        if (!content || !scheduledDate || !scheduledTime) return;
        
        const isoString = `${scheduledDate}T${scheduledTime}:00`;
        const clubId = targetClub === 'public' ? undefined : targetClub;
        
        scheduleAlert(alertType, content, isoString, clubId, repeat, aiContext);
        if (navigator.vibrate) navigator.vibrate(20);
        onClose();
    };

    const myOwnedClubs = clubs.filter(c => c.ownerId === currentUser.id);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-brand-600 dark:text-brand-400" />
                            Schedule Alert
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-500">Automate your updates for the community.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white dark:bg-white/10 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    
                    {/* Alert Type Selector */}
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => handleTypeChange('PRE_MARKET')}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${alertType === 'PRE_MARKET' ? 'bg-orange-50 dark:bg-orange-500/20 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-white/10 text-slate-500'}`}
                        >
                            <Sun className="w-5 h-5" />
                            <span className="text-xs font-bold">Pre-Market</span>
                        </button>
                        <button 
                            onClick={() => handleTypeChange('POST_MARKET')}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${alertType === 'POST_MARKET' ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-white/10 text-slate-500'}`}
                        >
                            <Moon className="w-5 h-5" />
                            <span className="text-xs font-bold">Post-Market</span>
                        </button>
                        <button 
                            onClick={() => handleTypeChange('NEWS')}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${alertType === 'NEWS' ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-white/10 text-slate-500'}`}
                        >
                            <Megaphone className="w-5 h-5" />
                            <span className="text-xs font-bold">News Event</span>
                        </button>
                         <button 
                            onClick={() => handleTypeChange('SIGNAL_REMINDER')}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${alertType === 'SIGNAL_REMINDER' ? 'bg-green-50 dark:bg-green-500/20 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-white/10 text-slate-500'}`}
                        >
                            <Bell className="w-5 h-5" />
                            <span className="text-xs font-bold">Reminder</span>
                        </button>
                    </div>

                    {/* Timing & Audience */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5">Date</label>
                            <input 
                                type="date" 
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-sm font-medium dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5">Time</label>
                            <input 
                                type="time" 
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-sm font-medium dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5">Audience (Club)</label>
                            <select 
                                value={targetClub}
                                onChange={(e) => setTargetClub(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-sm font-medium dark:text-white outline-none"
                            >
                                <option value="public">Global Feed (Public)</option>
                                {myOwnedClubs.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5">Repeat</label>
                            <div className="relative">
                                <select 
                                    value={repeat}
                                    onChange={(e) => setRepeat(e.target.value as RepeatType)}
                                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-sm font-medium dark:text-white outline-none pl-9"
                                >
                                    <option value="NONE">One-time</option>
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                </select>
                                <Repeat className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Content Editor */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-500">Message Content</label>
                            <button 
                                onClick={() => setAiContext(!aiContext)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center transition-colors ${aiContext ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' : 'bg-slate-100 text-slate-500 dark:bg-white/5'}`}
                            >
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Context {aiContext ? 'On' : 'Off'}
                            </button>
                        </div>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-32 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm font-medium dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>

                    {/* Preview Card */}
                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Preview</div>
                        <div className="flex items-start space-x-3 opacity-80">
                            <img src={currentUser.avatar} className="w-8 h-8 rounded-full" />
                            <div className="flex-1">
                                <div className="text-xs font-bold dark:text-white mb-0.5">{currentUser.name}</div>
                                <div className="text-[10px] text-slate-500 mb-1">
                                    {alertType === 'PRE_MARKET' && '☀️ Pre-Market Plan'}
                                    {alertType === 'POST_MARKET' && '🌙 Post-Market Summary'}
                                </div>
                                <div className="text-xs text-slate-800 dark:text-zinc-300 whitespace-pre-wrap line-clamp-3">
                                    {content}
                                    {aiContext && "\n\n🤖 *AI Context Added*: Market volatility is currently..."}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                    <button 
                        onClick={handleSchedule}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center"
                    >
                        <Clock className="w-4 h-4 mr-2" /> Schedule Alert
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SchedulerModal;
