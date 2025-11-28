

import React from 'react';
import { useApp } from '../context/AppContext';
import { Mic, MicOff, X, Maximize2, BarChart2 } from 'lucide-react';

const AudioRoomBar: React.FC = () => {
    const { activeRoom, isRoomMinimized, maximizeRoom, leaveRoom } = useApp();

    if (!activeRoom || !isRoomMinimized) return null;

    const speakers = activeRoom.speakers.filter(s => s.role !== 'LISTENER');

    return (
        <div 
            onClick={maximizeRoom}
            className="fixed bottom-[80px] left-2 right-2 z-40 bg-[#16181C] text-white rounded-2xl p-3 shadow-2xl border border-white/10 flex items-center justify-between cursor-pointer animate-in slide-in-from-bottom-4 active:scale-[0.99] transition-transform"
        >
            <div className="flex items-center space-x-3 overflow-hidden">
                {/* Audio Visualizer Mock */}
                <div className="flex space-x-0.5 items-end h-8 w-8 shrink-0">
                    <div className="w-1 bg-green-500 rounded-t animate-[pulse_0.8s_ease-in-out_infinite] h-[60%]"></div>
                    <div className="w-1 bg-green-500 rounded-t animate-[pulse_1.2s_ease-in-out_infinite] h-[100%]"></div>
                    <div className="w-1 bg-green-500 rounded-t animate-[pulse_1.0s_ease-in-out_infinite] h-[40%]"></div>
                    <div className="w-1 bg-green-500 rounded-t animate-[pulse_0.6s_ease-in-out_infinite] h-[80%]"></div>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 flex items-center truncate">
                        {activeRoom.clubName}
                    </h3>
                    <p className="text-sm font-bold truncate text-white">{activeRoom.title}</p>
                    <div className="flex -space-x-1.5 mt-1">
                        {speakers.slice(0, 3).map(s => (
                            <img key={s.id} src={s.user.avatar} className="w-4 h-4 rounded-full border border-[#16181C]" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-1 pl-2 border-l border-white/10 ml-2">
                 <button 
                    onClick={(e) => { e.stopPropagation(); leaveRoom(); }}
                    className="p-2 text-red-400 hover:bg-white/5 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default AudioRoomBar;
