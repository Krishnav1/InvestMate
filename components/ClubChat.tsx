
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Smile, AtSign } from 'lucide-react';
import { Club } from '../types';
import { LEADERBOARD_USERS } from '../constants';
import Avatar from './Avatar';

interface ClubChatProps {
    club: Club;
}

interface Message {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    timestamp: string;
}

const ClubChat: React.FC<ClubChatProps> = ({ club }) => {
    const { currentUser } = useApp();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial Mock Messages for the lounge
    useEffect(() => {
        setMessages([
            { id: '1', userId: 'u99', userName: 'System', userAvatar: '', text: `Welcome to the ${club.name} Lounge! This is an open space for all members.`, timestamp: 'Just now' },
            { id: '2', userId: 'u2', userName: 'Priya Sharma', userAvatar: 'https://picsum.photos/100/100?random=2', text: 'Hey everyone! Excited to be here.', timestamp: '1m ago' },
        ]);
    }, [club]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showMentions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInput(text);

        // Mention Logic
        const cursor = e.target.selectionStart || 0;
        const textUpToCursor = text.slice(0, cursor);
        const lastAtIndex = textUpToCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const isStartOfWord = lastAtIndex === 0 || textUpToCursor[lastAtIndex - 1] === ' ';
            const hasSpaceAfterAt = textUpToCursor.slice(lastAtIndex + 1).includes(' ');

            if (isStartOfWord && !hasSpaceAfterAt) {
                const query = textUpToCursor.slice(lastAtIndex + 1);
                setMentionQuery(query);
                setShowMentions(true);
                return;
            }
        }
        setShowMentions(false);
    };

    const handleMentionSelect = (userName: string) => {
        if (!inputRef.current) return;

        const cursor = inputRef.current.selectionStart || 0;
        const textUpToCursor = input.slice(0, cursor);
        const lastAtIndex = textUpToCursor.lastIndexOf('@');
        const textAfterCursor = input.slice(cursor);

        const newText = input.slice(0, lastAtIndex) + `@${userName} ` + textAfterCursor;
        setInput(newText);
        setShowMentions(false);

        if (navigator.vibrate) navigator.vibrate(5);

        // Restore focus
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 0);
    };

    const handleSend = () => {
        if (!input.trim()) return;
        if (navigator.vibrate) navigator.vibrate(10);
        
        const newMsg: Message = {
            id: Date.now().toString(),
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            text: input,
            timestamp: 'Just now'
        };

        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setShowMentions(false);

        // Simulate random reply
        if (Math.random() > 0.7) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString() + 'r',
                    userId: 'u_random',
                    userName: 'Rahul T',
                    userAvatar: 'https://picsum.photos/100/100?random=50',
                    text: 'Agreed!',
                    timestamp: 'Just now'
                }]);
            }, 2000);
        }
    };

    const filteredUsers = LEADERBOARD_USERS.filter(u => 
        u.name.toLowerCase().includes(mentionQuery.toLowerCase()) || 
        u.handle.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[500px] bg-white dark:bg-black relative">
            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {messages.map((msg, i) => {
                    const isMe = msg.userId === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && msg.userId !== 'u99' && (
                                <img src={msg.userAvatar} className="w-8 h-8 rounded-full mr-2 self-end mb-1 border border-slate-100 dark:border-white/10" />
                            )}
                            <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                                isMe 
                                ? 'bg-brand-600 text-white rounded-br-sm' 
                                : msg.userId === 'u99'
                                ? 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 text-center w-full my-2 text-xs font-bold border border-yellow-100 dark:border-yellow-900/20'
                                : 'bg-slate-100 dark:bg-dark-800 text-slate-800 dark:text-zinc-200 rounded-bl-sm'
                            }`}>
                                {msg.userId !== 'u99' && !isMe && (
                                    <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 mb-0.5">{msg.userName}</div>
                                )}
                                <p className="text-sm leading-snug">{msg.text}</p>
                                {msg.userId !== 'u99' && <div className="text-[9px] opacity-70 text-right mt-1">{msg.timestamp}</div>}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-black border-t border-slate-100 dark:border-white/5 relative">
                
                {/* Mention Dropdown */}
                {showMentions && filteredUsers.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 mx-3 w-[240px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <div className="px-3 py-2 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                            Mention Member
                        </div>
                        <div className="max-h-48 overflow-y-auto no-scrollbar">
                            {filteredUsers.map(user => (
                                <button 
                                    key={user.id}
                                    onClick={() => handleMentionSelect(user.name)}
                                    className="w-full flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left border-b border-slate-50 dark:border-white/5 last:border-0"
                                >
                                    <Avatar user={user} size="sm" className="mr-3" />
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{user.name}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">{user.handle}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-100 dark:bg-dark-800 rounded-full flex items-center border border-transparent focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={`Message ${club.name}...`}
                            className="flex-1 bg-transparent text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none placeholder-slate-400 dark:placeholder-zinc-600 font-medium"
                        />
                    </div>
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="p-2.5 bg-brand-600 rounded-full text-white shadow-md disabled:opacity-50 active:scale-95 transition-transform"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClubChat;
