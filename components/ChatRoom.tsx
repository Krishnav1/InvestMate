
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_CHAT, LEADERBOARD_USERS } from '../constants';
import { ChatMessage } from '../types';
import { summarizeChat, getChatBotResponse } from '../services/geminiService';
import { chatService } from '../services/chatService';
import { sendNotification } from '../services/notificationService';
import { Send, Zap, Users, Wifi, Info, X, Bot, AtSign } from 'lucide-react';
import Avatar from './Avatar';

const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState<string[] | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  
  // Mention State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatService.connect();
    setIsConnected(true);

    const unsubscribe = chatService.onMessage((msg) => {
      setMessages(prev => {
        const exists = prev.find(m => m.id === msg.id);
        if (exists) return prev;
        
        if (msg.userId !== 'u1' && document.hidden) {
             sendNotification(`New Message from ${msg.user.name}`, msg.text);
             if (navigator.vibrate) navigator.vibrate(5);
        }
        
        return [...prev, msg];
      });
    });

    return () => {
      chatService.disconnect();
      unsubscribe();
      setIsConnected(false);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);
    
    // Mention Logic
    const cursor = e.target.selectionStart || 0;
    const textUpToCursor = text.slice(0, cursor);
    const lastAtIndex = textUpToCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
        // Check if valid start (start of line or preceded by space)
        const isStartOfWord = lastAtIndex === 0 || textUpToCursor[lastAtIndex - 1] === ' ';
        // Check if no spaces in the query part
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
      const textUpToCursor = inputText.slice(0, cursor);
      const lastAtIndex = textUpToCursor.lastIndexOf('@');
      const textAfterCursor = inputText.slice(cursor);
      
      const newText = inputText.slice(0, lastAtIndex) + `@${userName} ` + textAfterCursor;
      setInputText(newText);
      setShowMentions(false);
      
      if (navigator.vibrate) navigator.vibrate(5);

      // Restore focus
      setTimeout(() => {
          if (inputRef.current) {
              inputRef.current.focus();
          }
      }, 0);
  };

  const filteredUsers = LEADERBOARD_USERS.filter(u => 
      u.name.toLowerCase().includes(mentionQuery.toLowerCase()) || 
      u.handle.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (navigator.vibrate) navigator.vibrate(10);
    const textToSend = inputText;
    
    // Send user message
    chatService.sendMessage(textToSend);
    setInputText('');
    setShowMentions(false);

    // Check for AI tag
    if (textToSend.includes('@Gemini')) {
        setIsBotTyping(true);
        try {
            const reply = await getChatBotResponse(textToSend);
            
            // Inject AI response as a system/bot message locally
            const botMsg: ChatMessage = {
                id: Date.now().toString() + '_bot',
                userId: 'gemini_bot',
                user: {
                    id: 'gemini_bot',
                    name: 'Gemini AI',
                    handle: '@Gemini',
                    avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
                    rank: 'Market Wizard',
                    xp: 999999,
                    following: 0,
                    followers: 0,
                    streak: 999,
                    bio: 'AI Assistant',
                    badges: [],
                    joinedClubs: []
                },
                text: reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSystem: true
            };
            
            // Add slight delay for realism
            setTimeout(() => {
                setMessages(prev => [...prev, botMsg]);
                setIsBotTyping(false);
                if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
            }, 1000);

        } catch (e) {
            setIsBotTyping(false);
        }
    }
  };

  const handleCatchUp = async () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setLoadingSummary(true);
    const recentMsgs = messages.slice(-15).map(m => `${m.user.name}: ${m.text}`);
    const result = await summarizeChat(recentMsgs);
    setSummary(result);
    setLoadingSummary(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-black relative">
      {/* Chat Header - Sticky */}
      <div className="mx-4 my-2 bg-white/80 dark:bg-white/5 p-3 rounded-2xl border border-slate-200 dark:border-white/5 flex justify-between items-center shadow-sm backdrop-blur-md sticky top-2 z-20">
        <div>
           <h2 className="font-bold text-slate-800 dark:text-white flex items-center text-base tracking-tight">
             Market Pe Charcha 
             <span className={`w-2 h-2 rounded-full ml-2 animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
           </h2>
           <span className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center mt-0.5 font-medium">
             <Users className="w-3 h-3 mr-1" /> 1,245 online • <Wifi className="w-3 h-3 ml-2 mr-1" /> {isConnected ? 'Live' : 'Connecting...'}
           </span>
        </div>
        <button 
          onClick={handleCatchUp}
          className="bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/20 dark:hover:bg-brand-500/30 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center transition-all border border-brand-200 dark:border-brand-500/30 active:scale-95"
        >
          <Zap className="w-3 h-3 mr-1.5" />
          {loadingSummary ? 'Thinking...' : 'Summary'}
        </button>
      </div>

      {/* AI Summary Overlay */}
      {summary && (
        <div className="mx-4 mt-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 p-4 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 shadow-xl relative animate-in slide-in-from-top-4 z-10 backdrop-blur-xl">
          <div className="flex justify-between items-start mb-3">
             <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-100 flex items-center uppercase tracking-wide"><Zap className="w-3.5 h-3.5 mr-2 text-indigo-500"/> AI Recap</h3>
             <button onClick={() => setSummary(null)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500"><X className="w-4 h-4"/></button>
          </div>
          <ul className="space-y-2">
            {summary.map((point, i) => (
              <li key={i} className="text-xs font-medium text-indigo-800 dark:text-indigo-200 flex items-start leading-relaxed">
                  <span className="mr-2 text-indigo-400">•</span> {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 no-scrollbar pb-[80px]">
        <div className="text-center py-2">
            <span className="bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-zinc-400 text-[10px] px-3 py-1 rounded-full font-bold">Today</span>
        </div>
        {messages.map((msg, idx) => {
          const isMe = msg.userId === 'u1';
          const isBot = msg.userId === 'gemini_bot';
          const isPrevSame = idx > 0 && messages[idx-1].userId === msg.userId;
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              {!isMe && !isPrevSame && <Avatar user={msg.user} size="sm" className="mr-2 self-end mb-1" />}
              {!isMe && isPrevSame && <div className="w-10 mr-0"></div>}
              
              <div className={`max-w-[80%] px-4 py-3 shadow-sm ${
                isMe 
                  ? 'bg-brand-600 text-white rounded-2xl rounded-tr-sm' 
                  : isBot 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tl-sm border-none shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-dark-800 text-slate-800 dark:text-zinc-200 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-white/5'
              } ${isPrevSame ? (isMe ? 'mt-1 rounded-tr-2xl' : 'mt-1 rounded-tl-2xl') : ''}`}>
                {!isMe && !isPrevSame && (
                    <div className="flex items-center space-x-1.5 mb-1">
                        <span className={`text-[11px] font-bold ${isBot ? 'text-indigo-100' : 'text-slate-900 dark:text-white'}`}>{msg.user.name}</span>
                        {msg.user.rank === 'Guru' && <span className="text-[8px] bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 px-1 rounded font-bold">GURU</span>}
                    </div>
                )}
                <p className="text-[14px] leading-relaxed font-normal">{msg.text}</p>
                <div className={`text-[9px] text-right mt-1 font-medium opacity-70`}>{msg.timestamp}</div>
              </div>
            </div>
          );
        })}
        
        {isBotTyping && (
            <div className="flex justify-start animate-pulse">
               <div className="w-8 h-8 rounded-full mr-2 self-end mb-1 bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                   <Bot className="w-4 h-4 text-white" />
               </div>
               <div className="bg-white dark:bg-dark-800 rounded-2xl rounded-tl-sm p-3 border border-slate-100 dark:border-dark-700">
                   <div className="flex space-x-1">
                       <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                       <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                       <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                   </div>
               </div>
            </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Input Area - Absolute Bottom */}
      <div className="p-3 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 absolute bottom-0 w-full z-30">
        
        {/* Mention Suggestions Dropdown */}
        {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 mx-3 w-[240px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                <div className="px-3 py-2 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Mention User
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
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Discuss or tag @Gemini..."
                className="flex-1 bg-transparent text-slate-900 dark:text-white px-5 py-3 text-sm focus:outline-none placeholder-slate-400 dark:placeholder-zinc-600 font-medium"
                />
            </div>
            <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-3 bg-brand-600 rounded-full text-white shadow-lg shadow-brand-500/30 active:scale-95 transition-transform disabled:opacity-50 disabled:shadow-none hover:bg-brand-700"
            >
            <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
