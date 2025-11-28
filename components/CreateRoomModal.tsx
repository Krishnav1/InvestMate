
import React, { useState } from 'react';
import { X, Mic, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CreateRoomModalProps {
    clubId: string;
    onClose: () => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ clubId, onClose }) => {
    const { createRoom } = useApp();
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('General Discussion');

    const handleCreate = () => {
        if (!title.trim()) return;
        if (navigator.vibrate) navigator.vibrate(20);
        createRoom(clubId, title, topic);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200 dark:border-white/10 flex flex-col">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-2">
                             <div className="p-2 bg-red-500/10 rounded-full text-red-500">
                                <Mic className="w-6 h-6" />
                             </div>
                             <div>
                                 <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Start Audio Room</h2>
                                 <p className="text-xs text-slate-500 dark:text-zinc-500">Go live for your club members</p>
                             </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Room Title</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Pre-Market Strategy for Tomorrow"
                                className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Topic / Tag</label>
                            <div className="flex flex-wrap gap-2">
                                {['Market Analysis', 'Q&A Session', 'Earnings Call', 'Crypto Talk', 'Educational'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTopic(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${topic === t ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20' : 'bg-white dark:bg-dark-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-white/10 hover:border-red-300'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleCreate}
                        disabled={!title.trim()}
                        className="w-full mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/30 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Mic className="w-5 h-5 mr-2" />
                        Go Live Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateRoomModal;
