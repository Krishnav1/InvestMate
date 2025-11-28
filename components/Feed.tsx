
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import PostCard from './PostCard';
import { PenSquare, X, Image as ImageIcon, Smile, Send, Heart, RefreshCw, Plus, BarChart3, Target, Clock, TrendingUp, AlertTriangle, Trophy, Flame, MessageCircle, ArrowDownWideNarrow, Trash2, ChevronRight, Megaphone, Lock, Calendar, Mic, UserPlus, Sparkles, ShieldCheck, BookOpen, Zap, Globe, Users, Lightbulb } from 'lucide-react';
import { Story, TradeType, PostType, AudioRoom, User } from '../types';
import { getMarketPulse, MarketPulse } from '../services/geminiService';
import Leaderboard from './Leaderboard';
import SchedulerModal from './SchedulerModal';
import { USER_PRIYA, USER_ARJUN, LEADERBOARD_USERS } from '../constants';
import Avatar from './Avatar';

// Skeleton Component for loading state
const SkeletonPost = () => (
    <div className="bg-white dark:bg-dark-800 p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm mb-4 animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-slate-200 dark:bg-dark-700 rounded-full"></div>
            <div className="flex-1">
                <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-1/3 mb-2"></div>
                <div className="h-2 bg-slate-200 dark:bg-dark-700 rounded w-1/4"></div>
            </div>
        </div>
        <div className="space-y-2 mb-4">
            <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-full"></div>
            <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-5/6"></div>
            <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-4/6"></div>
        </div>
    </div>
);

const SuggestedGuruCard: React.FC<{ user: User }> = ({ user }) => {
    // Determine the "Why Follow" context string
    const getContext = () => {
        const gs = user.guruStats;
        if (!gs) return "Rising Star";

        if (gs.isTrending) return "🔥 Trending Fast (+20%)";
        if (gs.educationBadge) return `📚 ${gs.educationBadge}`;
        if (gs.retentionRate > 90) return "🛡️ Trusted Community";
        if (gs.communityRank === 'Super' || gs.communityRank === 'Mega') return "💎 Market Titan";
        
        return "✨ Suggested for you";
    };

    return (
        <div className="snap-center shrink-0 w-40 bg-white dark:bg-dark-800 rounded-2xl p-3 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center relative overflow-hidden group">
            {/* Context Label */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-purple-500"></div>
            
            <div className="mt-2 mb-2 relative">
                <Avatar user={user} size="lg" showBadge className="group-hover:scale-105 transition-transform duration-300" />
            </div>
            
            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate w-full text-center">{user.name}</h4>
            <p className="text-[10px] text-brand-600 dark:text-brand-400 font-bold mb-3 text-center h-8 flex items-center justify-center leading-tight">
                {getContext()}
            </p>
            
            <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform flex items-center justify-center">
                <UserPlus className="w-3 h-3 mr-1" /> Follow
            </button>
        </div>
    );
};

const Feed: React.FC = () => {
  const { posts, stories, clubs, currentUser, addPost, addStory, markStoryViewed, joinRoom } = useApp();
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  
  // Image Upload State (Post)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Story Upload State
  const storyInputRef = useRef<HTMLInputElement>(null);
  const [previewStoryImage, setPreviewStoryImage] = useState<string | null>(null);

  // Sorting State
  const [sortBy, setSortBy] = useState<'newest' | 'likes' | 'comments'>('newest');

  // Market Pulse State
  const [marketPulse, setMarketPulse] = useState<MarketPulse | null>(null);

  // Post Type State
  const [isEducational, setIsEducational] = useState(false);

  // Permissions & Data
  const canPostSpecial = currentUser.rank === 'Guru' || currentUser.rank === 'Market Wizard';
  
  // Suggested Users Logic
  const suggestedGurus = LEADERBOARD_USERS.filter(u => u.id !== currentUser.id && u.id !== 'u1');

  // Simulate initial network load
  useEffect(() => {
    const init = async () => {
        const pulse = await getMarketPulse();
        setMarketPulse(pulse);
        setIsLoading(false);
    };
    init();
  }, []);

  // Sort & Filter Posts Logic
  const displayPosts = useMemo(() => {
      // 1. FILTER: Exclude Signals and Announcements from Global Feed
      // They belong in Clubs. Include only Regular, Educational, or if it's an Announcement meant for global (rare, handled by empty clubId)
      let filtered = posts.filter(p => {
          if (p.type === 'signal' || p.type === 'announcement') {
              return false; // STRICTLY EXCLUDE from Global Feed
          }
          return true;
      });

      // 2. SORT
      switch (sortBy) {
          case 'likes':
              return filtered.sort((a, b) => b.likes - a.likes);
          case 'comments':
              return filtered.sort((a, b) => b.comments - a.comments);
          case 'newest':
          default:
              return filtered;
      }
  }, [posts, sortBy]);

  const handleRefresh = () => {
      if (navigator.vibrate) navigator.vibrate(15);
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleOpenPostModal = () => {
      if (navigator.vibrate) navigator.vibrate(10);
      setPostModalOpen(true);
  }

  // --- Post Image Handling ---
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (navigator.vibrate) navigator.vibrate(10);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
      if (navigator.vibrate) navigator.vibrate(5);
      setSelectedImage(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  // --- Story Image Handling ---
  const handleStoryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (navigator.vibrate) navigator.vibrate(15);
          const reader = new FileReader();
          reader.onloadend = () => {
              setPreviewStoryImage(reader.result as string);
              if(storyInputRef.current) storyInputRef.current.value = '';
          };
          reader.readAsDataURL(file);
      }
  };

  const confirmAddStory = () => {
      if (previewStoryImage) {
          if (navigator.vibrate) navigator.vibrate(20);
          addStory(previewStoryImage);
          setPreviewStoryImage(null);
      }
  };

  const handlePostSubmit = async () => {
    if (!newPostContent.trim() && !selectedImage) return;
    if (navigator.vibrate) navigator.vibrate(20);

    // Regular Post (Global) or Educational if tagged
    const finalType = isEducational ? 'educational' : 'regular';
    const success = await addPost(newPostContent, undefined, finalType, undefined, selectedImage || undefined);
    if (success) resetModal();
  };

  const resetModal = () => {
      setNewPostContent('');
      setSelectedImage(null);
      setIsEducational(false);
      setPostModalOpen(false);
  };

  const handleStoryClick = (story: Story) => {
    if (navigator.vibrate) navigator.vibrate(10);
    setActiveStory(story);
    markStoryViewed(story.id);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
       
       {/* Scrollable Content Container */}
       <div className="h-full overflow-y-auto no-scrollbar pb-24 pt-1">
           {/* Story/Status Bar */}
           <div className="flex space-x-3 overflow-x-auto px-4 py-3 mb-2 no-scrollbar bg-transparent w-full">
              <div className="flex-shrink-0 w-16 text-center cursor-pointer group relative" onClick={() => storyInputRef.current?.click()}>
                <input type="file" ref={storyInputRef} className="hidden" accept="image/*" onChange={handleStoryPick} />
                <div className="relative w-16 h-16 mx-auto mb-1.5 p-[2px]">
                    <img src={currentUser.avatar} alt="My Story" className="w-full h-full rounded-full object-cover border-2 border-slate-100 dark:border-dark-700 opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-white dark:border-black shadow-sm group-active:scale-90 transition-transform">
                         <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-zinc-400">Your Story</span>
              </div>
              
              {stories.map((story) => (
                 <div key={story.id} className="flex-shrink-0 w-16 text-center cursor-pointer transition-transform active:scale-95" onClick={() => handleStoryClick(story)}>
                    <div className={`w-16 h-16 rounded-full p-[2px] mx-auto mb-1.5 ${story.viewed ? 'bg-slate-200 dark:bg-dark-700' : 'bg-gradient-to-tr from-yellow-400 via-orange-500 to-purple-600'}`}>
                       <div className="w-full h-full rounded-full bg-white dark:bg-black border-2 border-white dark:border-black overflow-hidden relative">
                         <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
                       </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-zinc-400 truncate w-full block">{story.user.name.split(' ')[0]}</span>
                 </div>
              ))}
           </div>

           {/* Composer Row */}
           <div className="px-4 mb-4 flex space-x-3 w-full">
               <div className="flex-1 bg-white dark:bg-dark-800 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-white/5 flex items-center space-x-3 cursor-pointer active:scale-[0.99] transition-transform min-w-0" onClick={handleOpenPostModal}>
                   <img src={currentUser.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" />
                   <div className="flex-1 text-slate-400 dark:text-zinc-500 text-sm font-medium truncate">
                       Start a discussion...
                   </div>
               </div>
               
               <button 
                   onClick={() => { if(navigator.vibrate) navigator.vibrate(10); setShowLeaderboard(true); }}
                   className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl w-12 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-transform shrink-0"
               >
                   <Trophy className="w-5 h-5" />
               </button>
           </div>

           {/* Market Pulse */}
            {marketPulse && (
                <div className="px-4 mb-5 w-full">
                    <div className="bg-slate-900 dark:bg-black rounded-xl p-3 shadow-md border border-slate-800 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${marketPulse.sentiment === 'Bullish' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">AI Market Pulse</span>
                                <span className="text-xs font-medium text-white truncate w-full">{marketPulse.newsSummary}</span>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ml-2 shrink-0 ${marketPulse.sentiment === 'Bullish' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                            {marketPulse.sentiment}
                        </span>
                    </div>
                </div>
            )}

           {/* Feed Header */}
           <div className="px-4 mb-3 flex items-center justify-between w-full">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center tracking-tight">
                    Feed
                </h3>
                <div className="flex space-x-2">
                     <button 
                        onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setSortBy('newest'); }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${sortBy === 'newest' ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-400'}`}
                    >
                        Latest
                    </button>
                    <button 
                        onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setSortBy('likes'); }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${sortBy === 'likes' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'text-slate-400'}`}
                    >
                        Top Rated
                    </button>
                </div>
           </div>

           {/* Posts */}
          <div className="px-4 min-h-[500px] w-full">
            {isLoading ? (
                <>
                    <SkeletonPost />
                    <SkeletonPost />
                </>
            ) : (
                <>
                {displayPosts.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm font-medium">No posts in global feed yet.</p>
                        <p className="text-xs">Join a club to see Signals & Announcements.</p>
                    </div>
                )}
                {displayPosts.slice(0, 2).map(post => (
                    <PostCard key={post.id} post={post} />
                ))}

                {/* Suggested Gurus */}
                {suggestedGurus.length > 0 && (
                    <div className="mb-6 -mx-4 py-4 bg-slate-50 dark:bg-white/5 border-y border-slate-100 dark:border-white/5">
                        <div className="px-4 mb-3 flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-yellow-500 fill-current" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">Rising Gurus</h3>
                        </div>
                        <div className="flex space-x-4 overflow-x-auto no-scrollbar px-4 snap-x">
                            {suggestedGurus.map(user => (
                                <SuggestedGuruCard key={user.id} user={user} />
                            ))}
                        </div>
                    </div>
                )}

                {displayPosts.slice(2).map(post => (
                    <PostCard key={post.id} post={post} />
                ))}
                </>
            )}
          </div>
       </div>

      {/* FAB */}
      <button 
        onClick={handleOpenPostModal}
        className="absolute bottom-6 right-5 w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-brand-500/40 active:scale-90 transition-transform z-40 hover:scale-105 animate-pop hover:shadow-2xl hover:shadow-brand-500/60 border border-white/20"
        style={{ position: 'absolute' }}
      >
        <PenSquare className="w-6 h-6" />
      </button>

      {/* Create Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-white/10 slide-in-from-bottom-10 animate-in duration-300 relative mx-auto">
            
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-white/5 pb-3">
               <h3 className="font-bold text-lg text-slate-800 dark:text-white">Create Post</h3>
               <button onClick={resetModal} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white active:scale-95 transition-transform"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="mb-4 flex items-center text-xs text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-white/5 p-2 rounded-lg justify-between">
                <div className="flex items-center">
                    <Globe className="w-3.5 h-3.5 mr-2" />
                    Posting to: <span className="font-bold ml-1 text-slate-700 dark:text-zinc-300">Global Feed (Public)</span>
                </div>
                {canPostSpecial && (
                    <button 
                        onClick={() => setIsEducational(!isEducational)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${isEducational ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'}`}
                    >
                        Mark as Educational
                    </button>
                )}
            </div>

            <div className="flex space-x-3 mb-4">
              <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-dark-700 shrink-0" />
              <textarea 
                 value={newPostContent}
                 onChange={(e) => setNewPostContent(e.target.value)}
                 placeholder={isEducational ? "Share your chart analysis or market lesson..." : "Share market insights, news, or analysis..."}
                 className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 resize-none h-24 focus:outline-none text-base pt-2 font-medium min-w-0"
                 autoFocus
              />
            </div>

            {/* Image Preview */}
            {selectedImage && (
                <div className="mb-4 ml-14 relative inline-block group">
                    <img src={selectedImage} alt="Preview" className="h-24 w-auto rounded-xl border border-slate-200 dark:border-white/10 object-cover" />
                    <button 
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 shadow-md hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
            
            {/* Tag Helpers */}
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                <button className="px-3 py-1.5 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-xs font-bold border border-brand-100 dark:border-brand-500/20 active:scale-95 transition-transform whitespace-nowrap">#bullish</button>
                <button className="px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-full text-xs font-bold border border-red-100 dark:border-red-500/20 active:scale-95 transition-transform whitespace-nowrap">#bearish</button>
                <button className="px-3 py-1.5 bg-slate-100 text-slate-600 dark:bg-dark-700 dark:text-zinc-400 rounded-full text-xs font-bold border border-slate-200 dark:border-dark-600 active:scale-95 transition-transform whitespace-nowrap">$NIFTY</button>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5">
               <div className="flex space-x-3 text-brand-500">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImagePick}
                  />
                  <ImageIcon 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-6 h-6 cursor-pointer hover:text-brand-600 transition-colors bg-brand-50 dark:bg-brand-500/10 p-1 rounded-xl box-content active:scale-90"
                  />
                  <BarChart3 className="w-6 h-6 cursor-pointer hover:text-brand-600 transition-colors bg-brand-50 dark:bg-brand-500/10 p-1 rounded-xl box-content active:scale-90"/>
                  
                  {canPostSpecial && (
                      <Calendar 
                        onClick={() => { setPostModalOpen(false); setShowScheduler(true); }}
                        className="w-6 h-6 cursor-pointer hover:text-brand-600 transition-colors bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 p-1 rounded-xl box-content active:scale-90"
                      />
                  )}
               </div>
               <button 
                 onClick={handlePostSubmit}
                 disabled={!newPostContent.trim() && !selectedImage}
                 className="bg-brand-600 text-white px-6 py-2.5 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all flex items-center active:scale-95"
               >
                 Post <Send className="w-3.5 h-3.5 ml-2" />
               </button>
            </div>
          </div>
        </div>
      )}
      
      {showScheduler && <SchedulerModal onClose={() => setShowScheduler(false)} />}
      {previewStoryImage && (
          <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-300">
              <div className="absolute top-4 left-0 w-full p-4 flex justify-between items-center z-10 mt-safe-top">
                  <button onClick={() => setPreviewStoryImage(null)} className="p-2 bg-black/40 rounded-full backdrop-blur-md text-white"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 flex items-center justify-center bg-black">
                  <img src={previewStoryImage} className="max-h-full max-w-full object-contain" alt="Story Preview" />
              </div>
              <div className="absolute bottom-10 w-full px-6 flex justify-between items-center z-10">
                  <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                      <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-white/50" />
                      <span className="text-white font-bold text-sm">Your Story</span>
                  </div>
                  <button onClick={confirmAddStory} className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl shadow-blue-500/30 active:scale-90 transition-all">
                      <ChevronRight className="w-8 h-8" />
                  </button>
              </div>
          </div>
      )}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      {activeStory && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-300">
           <div className="h-1 bg-white/20 w-full mt-safe-top">
             <div className="h-full bg-white animate-[progress_5s_linear_forwards]" onAnimationEnd={() => setActiveStory(null)}></div>
           </div>
           <div className="absolute top-4 left-0 w-full p-4 flex justify-between items-center z-10 mt-safe-top">
              <div className="flex items-center space-x-3">
                 <img src={activeStory.user.avatar} className="w-9 h-9 rounded-full border border-white/30"/>
                 <div className="flex flex-col">
                    <span className="text-white font-bold text-sm shadow-sm">{activeStory.user.name}</span>
                    <span className="text-zinc-300 text-xs shadow-sm">{activeStory.timestamp}</span>
                 </div>
              </div>
              <button onClick={() => setActiveStory(null)} className="p-2 bg-black/20 rounded-full backdrop-blur-md active:scale-90 transition-transform"><X className="text-white w-6 h-6 drop-shadow-md" /></button>
           </div>
           <div className="flex-1 relative flex items-center justify-center bg-black" onClick={() => setActiveStory(null)}>
             <img src={activeStory.imageUrl} className="max-h-full max-w-full object-contain" alt="Story" />
           </div>
           <div className="p-4 absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/40 to-transparent pb-12 pt-10">
              <div className="flex space-x-4 items-center">
                 <input type="text" placeholder="Send message..." className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-3 text-white placeholder-white/60 focus:outline-none focus:bg-white/20 transition-all font-medium" />
                 <button className="text-white p-2 hover:scale-110 active:scale-90 transition-transform"><Heart className="w-7 h-7" /></button>
                 <button className="text-white p-2 hover:scale-110 active:scale-90 transition-transform"><Send className="w-7 h-7" /></button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
