

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Users, ArrowRight, Plus, Check, X, ChevronLeft, Megaphone, MessageSquare, PenSquare, Send, Sparkles, AlertCircle, Lock, Trophy, Mic, Radio, Target, Clock, Lightbulb, Star, ShieldAlert, BarChart2 } from 'lucide-react';
import { Club, TradeType } from '../types';
import PostCard from './PostCard';
import ClubChat from './ClubChat';
import CreateRoomModal from './CreateRoomModal';

const Clubs: React.FC = () => {
  const { clubs, posts, currentUser, joinClub, leaveClub, createClub, addPost, availableRooms, joinRoom, openPaymentModal } = useApp();
  const [filter, setFilter] = useState('All');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  
  // Create Club Form State
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubCat, setNewClubCat] = useState<Club['category']>('Trading');
  // Premium Club State
  const [isPremiumClub, setIsPremiumClub] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState('999');
  
  const [createError, setCreateError] = useState('');

  // Club Detail View State
  const [activeDetailTab, setActiveDetailTab] = useState<'prime' | 'lounge'>('prime');
  const [isClubPostModalOpen, setClubPostModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setCreateRoomModalOpen] = useState(false);

  // --- Club Prime Feed Post State ---
  const [clubPostType, setClubPostType] = useState<'announcement' | 'signal' | 'insight'>('announcement');
  const [clubPostContent, setClubPostContent] = useState('');
  // Signal Fields
  const [signalTicker, setSignalTicker] = useState('');
  const [signalType, setSignalType] = useState<TradeType>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [timeframe, setTimeframe] = useState('Swing');

  const myClubs = clubs.filter(c => currentUser.joinedClubs.includes(c.id));
  const discoverClubs = clubs.filter(c => !currentUser.joinedClubs.includes(c.id));
  
  const displayedClubs = filter === 'All' 
    ? discoverClubs 
    : discoverClubs.filter(c => c.category === filter);

  // Pick some "Featured" clubs (e.g., top 3 by members)
  const featuredClubs = [...clubs].sort((a,b) => b.members - a.members).slice(0, 3);

  const canCreateClub = currentUser.rank === 'Guru' || currentUser.rank === 'Market Wizard';

  const handleJoinClub = (club: Club) => {
    if(navigator.vibrate) navigator.vibrate(10);
    
    // GATING LOGIC: Check if Premium
    if (club.isPremium && !currentUser.isPro) {
        openPaymentModal(`Join ${club.name} - Premium Community`);
        return;
    }
    
    if (currentUser.joinedClubs.includes(club.id)) {
        setSelectedClub(club);
    } else {
        joinClub(club.id);
    }
  };

  const handleCreateClub = () => {
    setCreateError('');
    if (navigator.vibrate) navigator.vibrate(10);
    // Double check permissions
    if (!canCreateClub) {
        setCreateError("Only Gurus and Market Wizards can create clubs.");
        return;
    }

    if (newClubName.trim().length < 3) {
        setCreateError("Club name must be at least 3 characters long.");
        return;
    }

    if (newClubDesc.trim().length < 10) {
        setCreateError("Description must be at least 10 characters long.");
        return;
    }

    if (isPremiumClub && (!premiumPrice || parseInt(premiumPrice) <= 0)) {
        setCreateError("Please enter a valid monthly price.");
        return;
    }

    if (newClubName && newClubDesc) {
        const createdClub = createClub(
            newClubName, 
            newClubCat, 
            newClubDesc, 
            isPremiumClub, 
            isPremiumClub ? parseInt(premiumPrice) : 0
        );
        setCreateModalOpen(false);
        setNewClubName('');
        setNewClubDesc('');
        setIsPremiumClub(false);
        setPremiumPrice('999');
        setCreateError('');
        // Open the new club immediately
        setSelectedClub(createdClub);
    }
  };

  const handleClubPostSubmit = async () => {
    if (!selectedClub) return;
    if (navigator.vibrate) navigator.vibrate(20);

    let finalType: any = 'regular';
    let tradeDetails = undefined;

    if (clubPostType === 'announcement') finalType = 'announcement';
    if (clubPostType === 'insight') finalType = 'educational'; // "Insight" maps to educational for ranking
    
    if (clubPostType === 'signal') {
        // SECURITY: Double check on submit
        if (!currentUser.isSebiVerified) {
             alert("Compliance Error: Only SEBI Registered Analysts can post actionable signals.");
             return;
        }

        finalType = 'signal';
        if (!signalTicker || !entryPrice || !targetPrice || !stopLoss) {
            alert("Please complete all signal details.");
            return;
        }
        tradeDetails = {
            ticker: signalTicker.toUpperCase(),
            tradeType: signalType,
            entryPrice: parseFloat(entryPrice),
            targetPrice: parseFloat(targetPrice),
            stopLoss: parseFloat(stopLoss),
            status: 'Active',
            timeframe: timeframe
        };
    }

    if (clubPostContent.trim() || tradeDetails) {
        await addPost(clubPostContent, selectedClub.id, finalType, tradeDetails as any);
        resetClubPostModal();
    }
  };

  const resetClubPostModal = () => {
      setClubPostContent('');
      setSignalTicker('');
      setEntryPrice('');
      setTargetPrice('');
      setStopLoss('');
      setClubPostModalOpen(false);
      setClubPostType('announcement'); // Reset to default
  };

  // Logic for Club Detail View
  if (selectedClub) {
      const isMember = currentUser.joinedClubs.includes(selectedClub.id);
      const isOwner = selectedClub.ownerId === currentUser.id;
      
      const clubPosts = posts.filter(p => p.clubId === selectedClub.id);
      
      // Prime Feed: Official announcements, Signals, Educational, or any post by the Owner
      const primePosts = clubPosts.filter(p => p.type === 'announcement' || p.type === 'signal' || p.type === 'educational' || p.userId === selectedClub.ownerId);

      // Check for Active Audio Room
      const activeClubRoom = availableRooms.find(r => r.clubId === selectedClub.id && r.status === 'LIVE');

      return (
          <div className="h-full bg-slate-50 dark:bg-black flex flex-col relative animate-in slide-in-from-right duration-300 overflow-hidden">
              
              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {/* Header - Immersive Parallax Feel */}
                <div className="h-56 bg-slate-200 dark:bg-dark-800 relative shrink-0">
                    <img src={selectedClub.image} className="w-full h-full object-cover" alt="Cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                    
                    {/* Top Bar inside Header */}
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
                        <button 
                            onClick={() => setSelectedClub(null)}
                            className="p-2 bg-black/30 rounded-full text-white backdrop-blur-md hover:bg-black/50 transition-colors active:scale-95"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        
                        {/* Start Room Button (Owner Only) */}
                        {isOwner && !activeClubRoom && (
                            <button 
                                onClick={() => setCreateRoomModalOpen(true)}
                                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-red-600/30 backdrop-blur-md transition-all active:scale-95"
                            >
                                <Mic className="w-3.5 h-3.5" />
                                <span>Start Room</span>
                            </button>
                        )}
                        
                        {/* Live Badge (If Room Active) */}
                        {activeClubRoom && (
                             <div className="flex items-center space-x-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-red-600/30 animate-pulse">
                                <Radio className="w-3.5 h-3.5" />
                                <span>LIVE</span>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex items-center space-x-2 mb-2">
                             <span className="bg-brand-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm inline-block uppercase tracking-wider">{selectedClub.category}</span>
                             {selectedClub.isPremium && (
                                 <span className="bg-yellow-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm inline-flex items-center uppercase tracking-wider">
                                     <Star className="w-3 h-3 mr-1 fill-current" /> Premium
                                 </span>
                             )}
                        </div>
                        <h1 className="text-3xl font-black mb-1 shadow-sm tracking-tight">{selectedClub.name}</h1>
                        <div className="flex justify-between items-end">
                            <p className="text-xs text-gray-200 line-clamp-1 w-2/3 font-medium opacity-90">{selectedClub.description}</p>
                            <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">{selectedClub.members.toLocaleString()} Members</span>
                        </div>
                    </div>
                </div>

                {/* LIVE ROOM BANNER (Visible to Members) */}
                {activeClubRoom && isMember && (
                    <div className="mx-4 -mt-6 relative z-10 mb-4 bg-[#16181C] rounded-2xl p-4 border border-white/10 shadow-xl overflow-hidden group cursor-pointer" onClick={() => joinRoom(activeClubRoom)}>
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                            <Mic className="w-16 h-16 text-white" />
                        </div>
                         <div className="flex items-center space-x-2 mb-2">
                             <div className="flex space-x-1 items-end h-3">
                                <div className="w-1 bg-red-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-full"></div>
                                <div className="w-1 bg-red-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite] h-2/3"></div>
                                <div className="w-1 bg-red-500 rounded-full animate-[pulse_1.0s_ease-in-out_infinite] h-full"></div>
                             </div>
                             <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Ongoing Session</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 relative z-10">{activeClubRoom.title}</h3>
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex -space-x-2">
                                {activeClubRoom.speakers.slice(0,3).map(s => (
                                    <img key={s.id} src={s.user.avatar} className="w-7 h-7 rounded-full border-2 border-[#16181C]" />
                                ))}
                            </div>
                            <button className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-red-500/20 group-active:scale-95 transition-transform">
                                Join In
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Bar (Join/Leave) */}
                <div className="px-4 py-3 bg-white dark:bg-dark-800 border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
                    <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Community Hub</div>
                    {isMember ? (
                        <button onClick={() => { if(navigator.vibrate) navigator.vibrate(10); leaveClub(selectedClub.id); setSelectedClub(null); }} className="text-xs font-bold text-red-500 border border-red-200 dark:border-red-500/30 px-5 py-2 rounded-full bg-red-50 dark:bg-red-500/10 active:scale-95 hover:bg-red-100 transition-colors">Leave</button>
                    ) : (
                        <button onClick={() => handleJoinClub(selectedClub)} className="text-xs text-white bg-brand-600 px-6 py-2 rounded-full font-bold shadow-lg shadow-brand-500/30 active:scale-95 hover:bg-brand-700 transition-all">
                             {selectedClub.isPremium ? `Join Premium (₹${selectedClub.price}/mo)` : 'Join Club'}
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="sticky top-0 z-10 flex border-b border-slate-200 dark:border-white/5 bg-white dark:bg-dark-800 shrink-0 shadow-sm">
                    <button 
                        onClick={() => setActiveDetailTab('prime')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center space-x-2 border-b-2 transition-colors ${activeDetailTab === 'prime' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600'}`}
                    >
                        <Trophy className="w-4 h-4" />
                        <span>Prime Feed</span>
                    </button>
                    <button 
                        onClick={() => setActiveDetailTab('lounge')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center space-x-2 border-b-2 transition-colors ${activeDetailTab === 'lounge' ? 'border-brand-500 text-brand-600 dark:text-brand-500 bg-brand-50/50 dark:bg-brand-900/10' : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600'}`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Traders' Lounge</span>
                    </button>
                </div>

                {/* Feed Content */}
                <div className="bg-slate-50 dark:bg-black min-h-[400px]">
                    {activeDetailTab === 'prime' ? (
                        <div className="p-4">
                            {/* Explanation Banner */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-200 dark:border-yellow-500/20 mb-4 flex items-start space-x-2">
                                <Lock className="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5"/>
                                <div className="text-xs text-yellow-800 dark:text-yellow-200 leading-tight">
                                    <span className="font-bold block mb-0.5">Club Leaders Only</span> 
                                    Signals, Insights, and Announcements from admins.
                                </div>
                            </div>

                            {primePosts.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 dark:text-zinc-600">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Megaphone className="w-8 h-8 opacity-40" />
                                    </div>
                                    <p className="font-medium">No official updates yet.</p>
                                </div>
                            ) : (
                                primePosts.map(post => <PostCard key={post.id} post={post} />)
                            )}
                        </div>
                    ) : (
                        <div className="h-full">
                            {!isMember ? (
                                <div className="text-center py-10 px-6 mt-10">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-3xl border border-blue-100 dark:border-blue-500/20">
                                            <p className="text-slate-800 dark:text-zinc-200 font-bold mb-2 text-lg">Members Only Lounge</p>
                                            <p className="text-sm text-slate-500 dark:text-zinc-500">Join this club to chat with other traders.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 text-[10px] text-slate-500 dark:text-zinc-400 text-center uppercase font-bold tracking-widest">
                                        General Member Discussion
                                    </div>
                                    <ClubChat club={selectedClub} />
                                </>
                            )}
                        </div>
                    )}
                </div>
              </div>

              {/* FAB - ONLY visible in Prime Feed for OWNERS */}
              {isMember && activeDetailTab === 'prime' && isOwner && (
                <button 
                    onClick={() => { if(navigator.vibrate) navigator.vibrate(10); setClubPostModalOpen(true); }}
                    className="absolute bottom-6 right-5 w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-yellow-500/40 active:scale-95 transition-transform z-40 hover:bg-yellow-600 animate-pop border border-white/20"
                >
                    <PenSquare className="w-6 h-6" />
                </button>
              )}

              {/* Enhanced Club Prime Post Modal */}
              {isClubPostModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-white/10 slide-in-from-bottom-10 animate-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
                        
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center text-lg">
                                Post to Prime Feed
                            </h3>
                            <button onClick={resetClubPostModal} className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-full text-slate-500 dark:text-zinc-400 hover:text-slate-800"><X className="w-5 h-5"/></button>
                        </div>

                        {/* Type Selector Tabs - STRICTLY CONTROLLED BY SEBI VERIFICATION */}
                        <div className="flex space-x-2 mb-4 bg-slate-100 dark:bg-black/40 p-1 rounded-xl overflow-x-auto no-scrollbar">
                             <button 
                                onClick={() => setClubPostType('announcement')}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center whitespace-nowrap ${clubPostType === 'announcement' ? 'bg-white dark:bg-dark-700 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-slate-500 dark:text-zinc-500'}`}
                            >
                                <Megaphone className="w-3.5 h-3.5 mr-1.5" /> Announcement
                            </button>
                            
                            {/* FIREWALL: Only Show Signal Option if SEBI Verified */}
                            {currentUser.isSebiVerified && (
                                <button 
                                    onClick={() => setClubPostType('signal')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center whitespace-nowrap ${clubPostType === 'signal' ? 'bg-white dark:bg-dark-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-zinc-500'}`}
                                >
                                    <Target className="w-3.5 h-3.5 mr-1.5" /> Trade Signal
                                </button>
                            )}
                            
                            <button 
                                onClick={() => setClubPostType('insight')}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center whitespace-nowrap ${clubPostType === 'insight' ? 'bg-white dark:bg-dark-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-zinc-500'}`}
                            >
                                <BarChart2 className="w-3.5 h-3.5 mr-1.5" /> Insight / Education
                            </button>
                        </div>

                        {/* Signal Inputs - Only rendered if Verified and type selected */}
                        {clubPostType === 'signal' && currentUser.isSebiVerified && (
                            <div className="mb-4 bg-slate-50 dark:bg-black/40 p-3 rounded-2xl border border-slate-200 dark:border-white/5">
                                {/* SEBI Disclaimer Banner */}
                                <div className="mb-3 flex items-start space-x-2 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded-lg text-[10px] text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/20">
                                    <ShieldAlert className="w-4 h-4 shrink-0" />
                                    <p>As a SEBI Registered Analyst ({currentUser.sebiRegNo}), you are responsible for the accuracy and suitability of this advice. This will be logged for compliance.</p>
                                </div>

                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        placeholder="Ticker (e.g. INFY)" 
                                        value={signalTicker}
                                        onChange={(e) => setSignalTicker(e.target.value.toUpperCase())}
                                        className="flex-1 bg-white dark:bg-dark-700 p-3 rounded-xl text-sm font-bold border border-slate-200 dark:border-dark-600 focus:border-brand-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 min-w-0"
                                    />
                                     <div className="flex bg-white dark:bg-dark-700 rounded-xl border border-slate-200 dark:border-dark-600 overflow-hidden p-1 shrink-0">
                                        <button 
                                            onClick={() => setSignalType('BUY')}
                                            className={`px-4 text-xs font-bold rounded-lg transition-colors ${signalType === 'BUY' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400'}`}
                                        >BUY</button>
                                        <button 
                                            onClick={() => setSignalType('SELL')}
                                            className={`px-4 text-xs font-bold rounded-lg transition-colors ${signalType === 'SELL' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400'}`}
                                        >SELL</button>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 mb-2">
                                     <input type="number" placeholder="Entry" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} className="w-1/3 bg-white dark:bg-dark-700 p-3 rounded-xl text-xs border border-slate-200 dark:border-dark-600 outline-none font-medium dark:text-white min-w-0" />
                                     <input type="number" placeholder="Target" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} className="w-1/3 bg-white dark:bg-dark-700 p-3 rounded-xl text-xs border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 font-bold outline-none min-w-0" />
                                     <input type="number" placeholder="SL" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="w-1/3 bg-white dark:bg-dark-700 p-3 rounded-xl text-xs border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold outline-none min-w-0" />
                                </div>

                                <div className="flex items-center space-x-2 bg-white dark:bg-dark-700 p-2.5 rounded-xl border border-slate-200 dark:border-dark-600">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase">Timeframe:</span>
                                    <select 
                                        value={timeframe}
                                        onChange={(e) => setTimeframe(e.target.value)}
                                        className="flex-1 bg-transparent text-xs font-bold text-slate-800 dark:text-white outline-none"
                                    >
                                        <option value="Intraday">Intraday (15m)</option>
                                        <option value="Hourly">Hourly (1H)</option>
                                        <option value="Daily">Daily (1D)</option>
                                        <option value="Swing">Swing (Multi-Day)</option>
                                        <option value="Long Term">Long Term</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-3 mb-4">
                            <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-dark-700" />
                            <textarea 
                                value={clubPostContent}
                                onChange={(e) => setClubPostContent(e.target.value)}
                                placeholder={clubPostType === 'signal' ? "Add analysis for this trade..." : clubPostType === 'insight' ? "Share your market knowledge or chart breakdown..." : "Write your announcement..."}
                                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 resize-none h-32 focus:outline-none text-base font-medium"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end items-center pt-3 border-t border-slate-100 dark:border-white/5">
                            <button 
                                onClick={handleClubPostSubmit}
                                disabled={!clubPostContent.trim() && !signalTicker}
                                className="px-6 py-2.5 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center text-white active:scale-95 shadow-lg bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20"
                            >
                                Publish <Send className="w-3.5 h-3.5 ml-2" />
                            </button>
                        </div>
                    </div>
                </div>
              )}

              {/* Create Audio Room Modal */}
              {isCreateRoomModalOpen && (
                  <CreateRoomModal 
                    clubId={selectedClub.id} 
                    onClose={() => setCreateRoomModalOpen(false)} 
                  />
              )}
          </div>
      );
  }

  // --- Main List View ---

  return (
    <div className="pb-6 pt-4 px-4 h-full overflow-y-auto no-scrollbar relative bg-slate-50 dark:bg-black">
       {/* Featured Carousel */}
       <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center tracking-tight">
                <Sparkles className="w-4 h-4 mr-1.5 text-yellow-500" /> Featured Communities
            </h2>
            <div className="flex space-x-4 overflow-x-auto snap-x snap-mandatory pb-6 no-scrollbar -mx-4 px-4">
                {featuredClubs.map(club => (
                    <div 
                        key={club.id} 
                        onClick={() => handleJoinClub(club)}
                        className="snap-center shrink-0 w-[85%] h-48 rounded-3xl overflow-hidden relative cursor-pointer shadow-xl shadow-slate-200/50 dark:shadow-none active:scale-[0.98] transition-transform group"
                    >
                        <img src={club.image} alt={club.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                        <div className="absolute top-4 right-4 z-10">
                            {club.isPremium && (
                                <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider flex items-center shadow-lg">
                                    <Lock className="w-3 h-3 mr-1 fill-current" /> Premium
                                </span>
                            )}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <span className="bg-white/20 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-2 inline-block shadow-sm tracking-wide">{club.category}</span>
                            <h3 className="text-xl font-bold text-white leading-tight mb-1">{club.name}</h3>
                            <div className="flex items-center text-xs text-gray-200 font-medium">
                                <Users className="w-3.5 h-3.5 mr-1" /> {club.members.toLocaleString()} Members
                            </div>
                        </div>
                    </div>
                ))}
            </div>
       </div>

       {/* Create Club Button (Gurus only) */}
       {canCreateClub && (
           <div className="mb-6 bg-gradient-to-r from-brand-600 to-brand-700 rounded-3xl p-5 flex items-center justify-between shadow-xl shadow-brand-500/20 relative overflow-hidden">
               <div className="absolute -right-5 -top-5 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
               <div className="relative z-10">
                   <h3 className="text-white font-bold text-lg">Create a Community</h3>
                   <p className="text-xs text-brand-100 mt-1">Gather your followers in one place.</p>
               </div>
               <button 
                  onClick={() => { if(navigator.vibrate) navigator.vibrate(10); setCreateModalOpen(true); setCreateError(''); }}
                  className="bg-white text-brand-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center active:scale-95 transition-transform shadow-sm relative z-10"
               >
                   <Plus className="w-4 h-4 mr-1" /> Create
               </button>
           </div>
       )}

       {/* My Clubs Section */}
       {myClubs.length > 0 && (
           <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight">My Clubs</h2>
                <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                    {myClubs.map(club => (
                        <div key={club.id} onClick={() => setSelectedClub(club)} className="flex-shrink-0 w-32 bg-white dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden relative group cursor-pointer active:scale-95 transition-transform shadow-sm">
                            <div className="h-20 bg-slate-100 dark:bg-dark-700">
                                <img src={club.image} className="w-full h-full object-cover" alt={club.name}/>
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-xs text-slate-800 dark:text-white truncate mb-0.5">{club.name}</h3>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-500">{club.members} Members</p>
                            </div>
                            {club.ownerId === currentUser.id && (
                                <div className="absolute top-1 right-1 bg-brand-600 text-[8px] px-1.5 py-0.5 rounded text-white font-bold shadow-sm">OWNER</div>
                            )}
                        </div>
                    ))}
                </div>
           </div>
       )}

       {/* Search */}
       <div className="relative mb-6">
         <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 dark:text-zinc-500" />
         <input 
            type="text" 
            placeholder="Find new communities..." 
            className="w-full bg-white dark:bg-dark-800 text-slate-900 dark:text-white rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 border border-slate-200 dark:border-white/5 shadow-sm font-medium transition-all"
         />
       </div>

       {/* Filter Categories */}
       <div className="flex space-x-2 mb-6 overflow-x-auto no-scrollbar">
         {['All', 'Trading', 'Investing', 'Crypto', 'News'].map((cat, i) => (
            <button 
                key={i} 
                onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setFilter(cat); }}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === cat ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30' : 'bg-white dark:bg-dark-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'}`}
            >
                {cat}
            </button>
         ))}
       </div>

       {/* Discovery List */}
       <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Explore Communities</h2>
       <div className="space-y-5">
         {displayedClubs.length === 0 ? (
             <div className="text-center text-slate-400 py-10">No clubs found in this category.</div>
         ) : (
             displayedClubs.map(club => (
                 <div key={club.id} className="bg-white dark:bg-dark-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm animate-in slide-in-from-bottom-2 duration-500 group">
                     <div onClick={() => handleJoinClub(club)} className="h-32 bg-slate-100 dark:bg-dark-700 relative cursor-pointer overflow-hidden">
                        <img src={club.image} alt={club.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute top-3 left-3 flex space-x-2">
                            <span className="bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm">{club.category}</span>
                            {club.isPremium && (
                                <span className="bg-yellow-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm flex items-center">
                                    <Lock className="w-3 h-3 mr-1 fill-current" /> Premium
                                </span>
                            )}
                        </div>
                     </div>
                     <div className="p-4">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{club.name}</h3>
                            <div className="flex items-center text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full">
                                <Users className="w-3 h-3 mr-1" /> {(club.members / 1000).toFixed(1)}k
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4 line-clamp-2 leading-relaxed">{club.description}</p>
                        <button 
                            onClick={() => handleJoinClub(club)}
                            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center group active:scale-95 ${currentUser.joinedClubs.includes(club.id) ? 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10' : 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20'}`}
                        >
                            {currentUser.joinedClubs.includes(club.id) ? (
                                <span className="flex items-center">Open Club <ArrowRight className="w-4 h-4 ml-1" /></span>
                            ) : (
                                <>
                                <span className="group-hover:hidden flex items-center">View Details</span>
                                <span className="hidden group-hover:flex items-center"><Check className="w-4 h-4 mr-1"/> Join Now</span>
                                </>
                            )}
                        </button>
                     </div>
                 </div>
             ))
         )}
       </div>

       {/* Create Club Modal */}
       {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
              <button onClick={() => setCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5"/></button>
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center mb-4 text-brand-600 dark:text-brand-400">
                  <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Create Community</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-500 mb-4">Launch a dedicated space for your followers.</p>
              
              {createError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start space-x-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{createError}</span>
                </div>
              )}

              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Club Name</label>
                      <input 
                         type="text" 
                         value={newClubName} 
                         onChange={e => { setNewClubName(e.target.value); setCreateError(''); }}
                         className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-3 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all font-medium"
                         placeholder="e.g., F&O Wizards"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Category</label>
                      <select 
                         value={newClubCat} 
                         onChange={e => setNewClubCat(e.target.value as any)}
                         className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all appearance-none font-medium"
                      >
                          <option value="Trading">Trading</option>
                          <option value="Investing">Investing</option>
                          <option value="Crypto">Crypto</option>
                          <option value="News">News</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Description</label>
                      <textarea 
                         value={newClubDesc} 
                         onChange={e => { setNewClubDesc(e.target.value); setCreateError(''); }}
                         className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-3 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none h-24 resize-none transition-all font-medium"
                         placeholder="What is this club about?"
                      />
                  </div>

                  {/* PREMIUM GATING - ONLY FOR SEBI VERIFIED */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                              <Star className="w-3.5 h-3.5 mr-1.5 text-yellow-500 fill-current" />
                              Premium Paid Club
                          </label>
                          <div 
                            onClick={() => {
                                if (currentUser.isSebiVerified) setIsPremiumClub(!isPremiumClub);
                            }}
                            className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${isPremiumClub ? 'bg-yellow-500' : 'bg-slate-200 dark:bg-dark-700'} ${!currentUser.isSebiVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPremiumClub ? 'translate-x-4' : ''}`}></div>
                          </div>
                      </div>
                      
                      {!currentUser.isSebiVerified ? (
                          <div className="bg-slate-100 dark:bg-white/5 p-2 rounded-lg flex items-start space-x-2 text-[10px] text-slate-500 dark:text-zinc-500">
                              <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>Compliance Requirement: Only SEBI Registered Analysts can create paid advisory clubs.</span>
                          </div>
                      ) : isPremiumClub && (
                          <div className="animate-in slide-in-from-top-2 fade-in">
                              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Monthly Subscription Price (₹)</label>
                              <input 
                                 type="number" 
                                 value={premiumPrice} 
                                 onChange={e => setPremiumPrice(e.target.value)}
                                 className="w-full bg-slate-50 dark:bg-dark-800 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-3 text-slate-900 dark:text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all font-bold"
                                 placeholder="e.g., 999"
                              />
                          </div>
                      )}
                  </div>

                  <button 
                     onClick={handleCreateClub}
                     disabled={!newClubName.trim() || !newClubDesc.trim()}
                     className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition-all mt-2 active:scale-95 shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Launch Club
                  </button>
              </div>
           </div>
        </div>
       )}
    </div>
  );
};

export default Clubs;
