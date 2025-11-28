
import React, { useEffect, useState, useRef } from 'react';
import { BADGES } from '../constants';
import { useApp } from '../context/AppContext';
import { Trophy, Flame, MapPin, Link as LinkIcon, Target, TrendingUp, BarChart2, Zap, Rocket, Users, RefreshCw, Star, Settings, ShieldCheck, PieChart, Activity, X, Check, Calendar, Trash2, Heart, BookOpen, UserPlus, Video, Play, Pause, Wand2, Loader2, Share2, Sparkles, DollarSign, ArrowUpRight } from 'lucide-react';
import { generateGuruIntroScript } from '../services/geminiService';

const getIcon = (name: string, className: string) => {
    switch (name) {
        case 'target': return <Target className={className} />;
        case 'trending-up': return <TrendingUp className={className} />;
        case 'bar-chart': return <BarChart2 className={className} />;
        case 'zap': return <Zap className={className} />;
        case 'rocket': return <Rocket className={className} />;
        case 'users': return <Users className={className} />;
        default: return <Trophy className={className} />;
    }
};

const getRarityColor = (rarity: string) => {
    switch(rarity) {
        case 'Legendary': return 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/10';
        case 'Epic': return 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/10';
        case 'Rare': return 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10';
        default: return 'text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-dark-600 bg-white dark:bg-dark-800';
    }
};

const Profile: React.FC = () => {
  const { currentUser, switchUser, updateUserProfile, scheduledAlerts, cancelAlert } = useApp();
  const [animateProgress, setAnimateProgress] = useState(false);
  
  // Edit Profile State
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [editHandle, setEditHandle] = useState(currentUser.handle);

  // Scheduled Alerts Manager State
  const [isAlertsModalOpen, setAlertsModalOpen] = useState(false);

  // AI Video Gen State
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationStep, setGenerationStep] = useState(0); // 0: Idle, 1: Scripting, 2: Rendering, 3: Done
  const [generatedScript, setGeneratedScript] = useState('');
  const [isVideoModalOpen, setVideoModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
      setTimeout(() => setAnimateProgress(true), 100);
  }, []);

  const handleSwitchUser = () => {
     if (navigator.vibrate) navigator.vibrate(10);
     if (currentUser.id === 'u1') switchUser('u2');
     else switchUser('u1');
     setAnimateProgress(false);
     setTimeout(() => setAnimateProgress(true), 100);
  };

  const handleOpenEdit = () => {
      if (navigator.vibrate) navigator.vibrate(10);
      setEditName(currentUser.name);
      setEditBio(currentUser.bio);
      setEditHandle(currentUser.handle);
      setEditModalOpen(true);
  };

  const handleSaveProfile = () => {
      if (navigator.vibrate) navigator.vibrate(20);
      if (editName.trim()) {
          updateUserProfile({
              name: editName,
              bio: editBio,
              handle: editHandle.startsWith('@') ? editHandle : `@${editHandle}`
          });
          setEditModalOpen(false);
      }
  };

  const handleGenerateVideo = async () => {
      if (navigator.vibrate) navigator.vibrate(10);
      setVideoModalOpen(true);
      setIsGeneratingVideo(true);
      setGenerationStep(1);

      // Step 1: AI Scripting
      const script = await generateGuruIntroScript(currentUser);
      setGeneratedScript(script);
      
      // Step 2: Simulate Rendering
      setTimeout(() => {
          setGenerationStep(2);
      }, 2000);

      // Step 3: Done
      setTimeout(() => {
          setGenerationStep(3);
          setIsGeneratingVideo(false);
          setIsPlaying(true);
      }, 5000);
  };

  const togglePlay = () => {
      setIsPlaying(!isPlaying);
  };

  const currentLevel = Math.floor(currentUser.xp / 1000) + 1;
  const xpForNextLevel = currentLevel * 1000;
  const xpProgressPercent = Math.min(100, (currentUser.xp % 1000) / 1000 * 100);

  const myAlerts = scheduledAlerts.filter(a => a.userId === currentUser.id && a.status === 'PENDING');
  const gs = currentUser.guruStats;
  const isGuru = currentUser.rank === 'Guru' || currentUser.rank === 'Market Wizard';

  return (
    <div className="pb-6 overflow-y-auto h-full no-scrollbar bg-slate-50 dark:bg-black">
      {/* Header Banner */}
      <div className="h-44 bg-gradient-to-br from-brand-600 to-blue-800 relative shadow-lg">
        <div className="absolute top-4 right-4 flex space-x-2">
            <button 
                onClick={handleSwitchUser}
                className="bg-black/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center border border-white/10 hover:bg-black/30 transition-colors active:scale-95"
            >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                {currentUser.id === 'u1' ? 'View as Guru' : 'View as User'}
            </button>
            <button className="bg-black/20 backdrop-blur-md p-1.5 rounded-full text-white hover:bg-black/30 border border-white/10">
                <Settings className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="px-5 -mt-12 mb-6">
        <div className="flex justify-between items-end mb-4">
            <div className="relative">
                <div className="w-28 h-28 rounded-full border-4 border-slate-50 dark:border-black overflow-hidden bg-white dark:bg-dark-800 shadow-xl group">
                    <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                </div>
                <div className="absolute bottom-1 right-1 bg-brand-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border-4 border-slate-50 dark:border-black shadow-md z-10">
                    Lvl {currentLevel}
                </div>
            </div>
            
            <div className="flex space-x-2 mb-2">
                <button 
                    onClick={handleOpenEdit}
                    className="bg-brand-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-brand-500/30 active:scale-95 transition-transform hover:bg-brand-700"
                >
                    Edit Profile
                </button>
            </div>
        </div>
        
        <div className="mb-4">
            <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentUser.name}
                </h1>
                {currentUser.isSebiVerified && (
                     <div className="bg-blue-500 text-white p-1 rounded-full shadow-sm shadow-blue-500/50" title="SEBI Registered"><ShieldCheck className="w-3 h-3 fill-current"/></div>
                )}
            </div>
            
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium mb-1">
                {currentUser.handle} • <span className={`text-brand-600 dark:text-brand-400 font-bold`}>{currentUser.rank}</span>
            </p>
            
            {currentUser.isSebiVerified && currentUser.sebiRegNo && (
                <div className="inline-block border border-slate-200 dark:border-dark-600 bg-slate-50 dark:bg-white/5 rounded px-2 py-0.5 text-[10px] text-slate-400 dark:text-zinc-500 font-mono mb-2">
                    SEBI Reg: {currentUser.sebiRegNo}
                </div>
            )}
        </div>

        <p className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed mb-4 font-normal">{currentUser.bio}</p>
        
        <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-zinc-500 font-medium">
            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> Mumbai, IN</span>
            <span className="flex items-center"><LinkIcon className="w-3.5 h-3.5 mr-1" /> investmate.in</span>
        </div>
      </div>

      {/* CREATOR REVENUE DASHBOARD (Only for SEBI Verified RAs) */}
      {currentUser.isSebiVerified && (
          <div className="px-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-500" /> Creator Revenue
                  </h3>
                  <span className="text-[10px] font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded uppercase flex items-center">
                      <ArrowUpRight className="w-3 h-3 mr-1" /> +12% MoM
                  </span>
              </div>
              <div className="bg-white dark:bg-dark-800 rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase mb-1">Total Earnings</div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white">₹4.5L</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase mb-1">Subscribers</div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white">124</div>
                      </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Next Payout: ₹45,200</span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Due in 5 days</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[75%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                  </div>
              </div>
          </div>
      )}

      {/* GURU RANK DASHBOARD (If stats exist) */}
      {gs && (
        <div className="px-5 mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500 fill-current" /> Guru Rankings
            </h3>
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm space-y-5">
                
                {/* 1. Community Size */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1.5" /> Reach
                        </span>
                        <span className="text-xs font-black bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                            {gs.communityRank} Guru
                        </span>
                    </div>
                    <div className="flex items-end justify-between mb-1">
                        <span className="text-xl font-black text-slate-900 dark:text-white">{gs.totalReach.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">Total Followers</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (gs.totalReach / 50000) * 100)}%` }}></div>
                    </div>
                </div>

                {/* 2. Engagement */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide flex items-center">
                            <Flame className="w-3.5 h-3.5 mr-1.5" /> Engagement
                        </span>
                        {gs.engagementBadge && (
                             <span className="text-[10px] font-bold bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded">
                                {gs.engagementBadge}
                            </span>
                        )}
                    </div>
                     <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (gs.engagementScore / 1000) * 100)}%` }}></div>
                    </div>
                </div>

                {/* 3. Retention (Trust) */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide flex items-center">
                            <Heart className="w-3.5 h-3.5 mr-1.5" /> Retention
                        </span>
                        {gs.isTrusted && (
                             <span className="text-[10px] font-bold bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded flex items-center">
                                <ShieldCheck className="w-3 h-3 mr-1" /> Trusted
                            </span>
                        )}
                    </div>
                     <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${gs.retentionRate}%` }}></div>
                    </div>
                </div>

                {/* 4. Educational Value */}
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide flex items-center">
                            <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Education
                        </span>
                        {gs.educationBadge && (
                             <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded">
                                {gs.educationBadge}
                            </span>
                        )}
                    </div>
                     <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (gs.educationalScore / 5000) * 100)}%` }}></div>
                    </div>
                </div>

                 {/* 5. Growth Momentum */}
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide flex items-center">
                            <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Momentum
                        </span>
                        {gs.isTrending && (
                             <span className="text-[10px] font-bold bg-pink-50 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded animate-pulse">
                                Viral Growth
                            </span>
                        )}
                    </div>
                     <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: `${Math.min(100, gs.momentumScore)}%` }}></div>
                    </div>
                </div>

            </div>
        </div>
      )}

      {/* AI STUDIO - GURU EXCLUSIVE */}
      {isGuru && (
          <div className="px-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
                      <Wand2 className="w-5 h-5 mr-2 text-indigo-500" /> AI Studio
                  </h3>
                  <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded uppercase">Beta</span>
              </div>
              <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-5 border border-indigo-500/30 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-indigo-500/30 transition-all duration-700"></div>
                  
                  <div className="relative z-10">
                      <h4 className="text-lg font-bold mb-1">Generate Profile Reel</h4>
                      <p className="text-xs text-indigo-200 mb-4 max-w-[80%]">
                          Create a high-impact AI video intro using your latest stats and achievements.
                      </p>
                      
                      <button 
                        onClick={handleGenerateVideo}
                        className="bg-white text-indigo-900 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center shadow-lg active:scale-95 transition-all hover:bg-indigo-50"
                      >
                          <Video className="w-4 h-4 mr-2" />
                          Create Reel
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Guru Tools Section (Visible only for Gurus) */}
      {isGuru && (
          <div className="px-5 mb-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wide">Creator Tools</h3>
              <button 
                onClick={() => setAlertsModalOpen(true)}
                className="w-full bg-white dark:bg-dark-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex justify-between items-center active:scale-[0.98] transition-transform"
              >
                  <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400">
                          <Calendar className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                          <div className="font-bold text-slate-900 dark:text-white">Scheduled Alerts</div>
                          <div className="text-xs text-slate-500 dark:text-zinc-500">{myAlerts.length} pending updates</div>
                      </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-zinc-400">
                      Manage
                  </div>
              </button>
          </div>
      )}

      {/* Trading Performance (Verified Only) */}
      {currentUser.isSebiVerified && currentUser.tradingStats && (
          <div className="px-5 mb-6">
              <div className="flex items-center space-x-2 mb-3">
                  <Activity className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Performance (Verified)</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-3xl border border-green-100 dark:border-green-500/20 text-center">
                      <div className="text-lg font-black text-green-600 dark:text-green-400">{currentUser.tradingStats.roi}%</div>
                      <div className="text-[9px] uppercase font-bold text-green-700/60 dark:text-green-400/60 tracking-wider">ROI (All Time)</div>
                  </div>
                  <div className="bg-brand-50 dark:bg-brand-500/10 p-4 rounded-3xl border border-brand-100 dark:border-brand-500/20 text-center">
                      <div className="text-lg font-black text-brand-600 dark:text-brand-400">{currentUser.tradingStats.winRate}%</div>
                      <div className="text-[9px] uppercase font-bold text-brand-700/60 dark:text-brand-400/60 tracking-wider">Win Rate</div>
                  </div>
                  <div className="bg-white dark:bg-dark-800 p-4 rounded-3xl border border-slate-100 dark:border-white/5 text-center shadow-sm">
                      <div className="text-lg font-black text-slate-900 dark:text-white">{currentUser.tradingStats.tradesTaken}</div>
                      <div className="text-[9px] uppercase font-bold text-slate-500 dark:text-zinc-500 tracking-wider">Trades</div>
                  </div>
              </div>
              <p className="text-[9px] text-slate-400 dark:text-zinc-600 mt-2 text-center">Performance verified via Broker API. Past performance is not indicative of future results.</p>
          </div>
      )}

        {/* Level Progress */}
        <div className="px-5 mb-6">
            <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-zinc-500 mb-2 uppercase tracking-wide">
                <span>Level {currentLevel} Progress</span>
                <span>{currentUser.xp} / {xpForNextLevel} XP</span>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-brand-500 to-blue-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: animateProgress ? `${xpProgressPercent}%` : '0%' }}
                ></div>
            </div>
        </div>

        {/* Gamification Section */}
        <div className="px-5 space-y-4">
            {/* Streak */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-500/20 p-4 rounded-3xl border border-orange-200 dark:border-orange-500/20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-white dark:bg-orange-500/10 rounded-2xl text-orange-500 shadow-sm border border-orange-100 dark:border-orange-500/20">
                        <Flame className="w-6 h-6 animate-pulse-fast" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 dark:text-white">Daily Streak</div>
                        <div className="text-xs text-slate-500 dark:text-orange-200/70">Come back tomorrow!</div>
                    </div>
                </div>
                <div className="text-2xl font-black text-orange-600 dark:text-orange-500 drop-shadow-sm">{currentUser.streak} <span className="text-sm font-bold text-orange-400">Days</span></div>
            </div>

            {/* Badges Grid */}
            <div>
                 <div className="flex items-center space-x-2 mb-3 mt-6">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Achievements</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    {currentUser.badges.map((badgeId) => {
                        const badge = BADGES[badgeId];
                        if (!badge) return null;
                        const styleClass = getRarityColor(badge.rarity);
                        
                        return (
                            <div key={badge.id} className={`p-4 rounded-3xl border flex flex-col items-center text-center relative overflow-hidden group transition-all hover:shadow-md active:scale-95 ${styleClass}`}>
                                <div className="mb-3 p-3 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm shadow-sm">
                                    {getIcon(badge.icon, "w-6 h-6")}
                                </div>
                                <div className="font-bold text-sm text-slate-800 dark:text-zinc-200 mb-1">{badge.name}</div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-500 line-clamp-2 leading-tight">{badge.description}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-white/10 animate-in zoom-in-95 duration-200">
                    <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Profile</h2>
                        <button onClick={() => setEditModalOpen(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="p-6 space-y-5">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <img src={currentUser.avatar} className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-dark-700 object-cover" alt="Avatar"/>
                                <button className="absolute bottom-0 right-0 bg-brand-600 text-white p-2 rounded-full border-4 border-white dark:border-[#121212] shadow-lg">
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Display Name</label>
                            <input 
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-3 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none font-medium transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Handle</label>
                            <input 
                                type="text"
                                value={editHandle}
                                onChange={(e) => setEditHandle(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-3 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none font-medium transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Bio</label>
                            <textarea 
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-3 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none h-24 resize-none font-medium transition-all"
                            />
                        </div>

                        <button 
                            onClick={handleSaveProfile}
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/30 active:scale-95 transition-all flex items-center justify-center"
                        >
                            <Check className="w-4 h-4 mr-2" /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Scheduled Alerts Modal */}
        {isAlertsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col max-h-[80vh]">
                     <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-5 h-5 text-orange-500" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Scheduled Alerts</h2>
                        </div>
                        <button onClick={() => setAlertsModalOpen(false)} className="p-2 bg-white dark:bg-white/10 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-black/20">
                        {myAlerts.length === 0 ? (
                            <div className="text-center py-12 opacity-50">
                                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                <p className="text-sm font-medium">No alerts scheduled yet.</p>
                            </div>
                        ) : (
                            myAlerts.map(alert => {
                                const date = new Date(alert.scheduledTime);
                                return (
                                    <div key={alert.id} className="bg-white dark:bg-dark-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${alert.type === 'PRE_MARKET' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                {alert.type.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-500">
                                                {date.toLocaleDateString()} • {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-800 dark:text-zinc-300 line-clamp-2 mb-3 font-medium">
                                            {alert.content}
                                        </p>
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-white/5">
                                            <span className="text-[10px] text-slate-400 font-medium flex items-center">
                                                {alert.repeat !== 'NONE' && <RefreshCw className="w-3 h-3 mr-1" />}
                                                {alert.repeat !== 'NONE' ? `Repeats ${alert.repeat}` : 'One-time'}
                                            </span>
                                            <button 
                                                onClick={() => { if(navigator.vibrate) navigator.vibrate(10); cancelAlert(alert.id); }}
                                                className="text-red-500 text-xs font-bold flex items-center hover:bg-red-50 dark:hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* AI Video Generator / Player Modal */}
        {isVideoModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in p-4">
                <div className="w-full max-w-sm bg-black rounded-[2rem] overflow-hidden border-4 border-zinc-800 shadow-2xl relative aspect-[9/16] max-h-[80vh]">
                    <button 
                        onClick={() => { setVideoModalOpen(false); setIsPlaying(false); }}
                        className="absolute top-4 right-4 z-50 bg-black/40 backdrop-blur rounded-full p-2 text-white hover:bg-black/60"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* GENERATION STATE */}
                    {isGeneratingVideo && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-zinc-900">
                            <div className="w-20 h-20 mb-6 relative">
                                <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Creating Magic...</h3>
                            <div className="space-y-1 text-center">
                                <p className={`text-xs transition-opacity duration-500 ${generationStep >= 1 ? 'opacity-100 text-indigo-300' : 'opacity-30'}`}>• Scripting Intro</p>
                                <p className={`text-xs transition-opacity duration-500 ${generationStep >= 2 ? 'opacity-100 text-purple-300' : 'opacity-30'}`}>• Synthesizing Voice</p>
                                <p className={`text-xs transition-opacity duration-500 ${generationStep >= 2 ? 'opacity-100 text-pink-300' : 'opacity-30'}`}>• Rendering Visuals</p>
                            </div>
                        </div>
                    )}

                    {/* PLAYBACK STATE */}
                    {!isGeneratingVideo && (
                        <div className="relative w-full h-full bg-gradient-to-b from-indigo-900 to-black overflow-hidden flex flex-col">
                            {/* Video Content Simulation */}
                            <div className="flex-1 flex flex-col items-center pt-20 px-6 relative">
                                {/* Floating Particles */}
                                <div className="absolute inset-0 overflow-hidden opacity-30">
                                    <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-ping"></div>
                                    <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                    <div className="absolute bottom-20 left-1/2 w-3 h-3 bg-purple-500 rounded-full blur-sm animate-bounce"></div>
                                </div>

                                <div className={`transform transition-all duration-1000 ${isPlaying ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10 opacity-0'}`}>
                                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden mb-6 mx-auto relative z-10">
                                        <img src={currentUser.avatar} className="w-full h-full object-cover" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white text-center mb-2 drop-shadow-lg">{currentUser.name}</h2>
                                    <div className="flex justify-center space-x-2 mb-8">
                                        <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">{currentUser.rank}</span>
                                        {currentUser.isSebiVerified && <span className="bg-blue-50 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">SEBI Reg.</span>}
                                    </div>
                                </div>

                                {/* Script Caption */}
                                <div className="mt-auto mb-20 w-full bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 relative">
                                    <div className="absolute -top-3 left-4 bg-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm">AI SCRIPT</div>
                                    <p className="text-sm font-medium text-white leading-relaxed text-center">
                                        "{generatedScript}"
                                    </p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                                <div className="flex items-center justify-center space-x-6">
                                    <button className="text-white/70 hover:text-white"><Share2 className="w-6 h-6" /></button>
                                    <button 
                                        onClick={togglePlay}
                                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-xl shadow-white/20"
                                    >
                                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                    </button>
                                    <button onClick={handleGenerateVideo} className="text-white/70 hover:text-white"><RefreshCw className="w-6 h-6" /></button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default Profile;
