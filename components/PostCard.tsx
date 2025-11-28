
import React, { useState, memo, useMemo, useEffect, useRef } from 'react';
import { Post } from '../types';
import { useApp } from '../context/AppContext';
import { analyzePostSentiment } from '../services/geminiService';
import StockChart from './StockChart';
import Avatar from './Avatar';
import { Heart, MessageCircle, Share2, Sparkles, X, Send, Check, Megaphone, MoreHorizontal, Target, Clock, AlertTriangle, ArrowRight, ShieldAlert, Timer, TrendingUp, TrendingDown, BookOpen, Lightbulb, Lock, BarChart2 } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

const MAX_COMMENT_LENGTH = 500;

const PostCard: React.FC<PostCardProps> = memo(({ post }) => {
  const { toggleLike, currentUser, addComment, voteSentiment, awardXP, openPaymentModal } = useApp();
  const [analysis, setAnalysis] = useState<{ sentiment: string; risk: string; summary: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showHelpfulPrompt, setShowHelpfulPrompt] = useState(false);
  const [hasVotedHelpful, setHasVotedHelpful] = useState(false);
  
  const isLiked = post.likedBy.includes(currentUser.id);
  const isAnnouncement = post.type === 'announcement';
  const isSignal = post.type === 'signal' && post.tradeDetails;
  const isEducational = post.type === 'educational';
  const isLongText = post.content.length > 200;

  // GATING LOGIC: Is the signal locked for this user?
  const isLockedSignal = isSignal && !currentUser.isPro && post.userId !== currentUser.id;

  const cardRef = useRef<HTMLDivElement>(null);

  // Smart "Helpful" Prompt Logic
  useEffect(() => {
    if (!isEducational || hasVotedHelpful || !isLongText) return;

    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // User is reading... wait 4 seconds
                    timer = setTimeout(() => {
                        setShowHelpfulPrompt(true);
                    }, 4000);
                } else {
                    clearTimeout(timer);
                    setShowHelpfulPrompt(false);
                }
            });
        },
        { threshold: 0.6 } // 60% of card visible
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => {
        observer.disconnect();
        clearTimeout(timer);
    };
  }, [isEducational, hasVotedHelpful, isLongText]);

  // Sentiment Voting State
  const bullishVotes = post.sentimentVotes?.bullish.length || 0;
  const bearishVotes = post.sentimentVotes?.bearish.length || 0;
  const totalVotes = bullishVotes + bearishVotes;
  const userVotedBullish = post.sentimentVotes?.bullish.includes(currentUser.id);
  const userVotedBearish = post.sentimentVotes?.bearish.includes(currentUser.id);
  const bullishPercent = totalVotes > 0 ? (bullishVotes / totalVotes) * 100 : 50;

  const handleLike = () => {
      if (navigator.vibrate) navigator.vibrate(isLiked ? 10 : 20); // Heavier vibration for like
      toggleLike(post.id);
      if (!isLiked) {
          setShowHeartBurst(true);
          setTimeout(() => setShowHeartBurst(false), 800);
      }
  };

  const handleVoteHelpful = () => {
      if (navigator.vibrate) navigator.vibrate(20);
      setHasVotedHelpful(true);
      setShowHelpfulPrompt(false);
      awardXP(10); // Reward user for engaging
      // In real app, call API to increment user's educational score
  };

  const handleVote = (type: 'bullish' | 'bearish') => {
      if (navigator.vibrate) navigator.vibrate(15);
      voteSentiment(post.id, type);
  };

  const handleAnalyze = async () => {
    if (navigator.vibrate) navigator.vibrate(15);
    setIsAnalyzing(true);
    const result = await analyzePostSentiment(post.content);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleUnlockClick = () => {
      if (navigator.vibrate) navigator.vibrate(20);
      openPaymentModal(`Unlock ${post.tradeDetails?.ticker} Trade Signal`);
  };

  const handleShare = async () => {
    if (navigator.vibrate) navigator.vibrate(10);
    const mockUrl = `https://investmate.app/posts/${post.id}`;
    
    const shareData = {
      title: `InvestMate Post by ${post.user.name}`,
      text: `${post.content}\n\nShared via InvestMate App`,
      url: mockUrl, 
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Clipboard failed', err);
      }
    }
  };

  const isOverLimit = commentText.length > MAX_COMMENT_LENGTH;

  const handlePostComment = () => {
    if (!commentText.trim() || isOverLimit) return;
    if (navigator.vibrate) navigator.vibrate(10);
    addComment(post.id, commentText);
    setCommentText('');
  };

  // Calculate Expiry Status
  const expiryInfo = useMemo(() => {
    if (!post.tradeDetails?.expiry) return null;
    try {
        const expiryDate = new Date(post.tradeDetails.expiry);
        const now = new Date();
        const diffMs = expiryDate.getTime() - now.getTime();
        const hoursLeft = diffMs / (1000 * 60 * 60);
        
        if (diffMs < 0) return { label: 'Expired', isUrgent: false, isExpired: true };
        if (hoursLeft <= 24) return { label: `${Math.ceil(hoursLeft)}h Left`, isUrgent: true, isExpired: false };
        const daysLeft = Math.ceil(hoursLeft / 24);
        return { label: `${daysLeft}d Left`, isUrgent: false, isExpired: false };
    } catch (e) { return null; }
  }, [post.tradeDetails]);

  const renderContent = (content: string) => {
    return content.split(' ').map((word, index) => {
      if (word.startsWith('$')) {
        return <span key={index} className="text-brand-600 dark:text-brand-400 font-bold cursor-pointer hover:underline mr-1">{word}</span>;
      }
      if (word.startsWith('#')) {
        return <span key={index} className="text-blue-500 dark:text-blue-400 cursor-pointer mr-1 hover:underline">{word}</span>;
      }
      return <span key={index} className="mr-1">{word}</span>;
    });
  };

  return (
    <div ref={cardRef} className={`bg-white dark:bg-dark-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 animate-fade-in-up duration-500 relative group mb-4 transition-all w-full overflow-hidden
        ${isAnnouncement ? 'border-l-4 border-l-yellow-500 dark:border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/5' : ''}
        ${isSignal ? 'border-t-4 border-t-brand-500 dark:border-t-brand-500' : ''}
        ${isEducational ? 'border-l-4 border-l-purple-500 dark:border-l-purple-500 bg-purple-50/20 dark:bg-purple-900/5' : ''}
    `}>
      
      {/* Heart Burst Animation Overlay */}
      {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <Heart className="w-24 h-24 text-red-500 fill-current animate-heart-burst drop-shadow-2xl" />
          </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {isAnnouncement && (
            <div className="flex items-center space-x-1 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold uppercase bg-yellow-100 dark:bg-yellow-500/20 px-2 py-1 rounded-lg w-fit border border-yellow-200 dark:border-yellow-500/30">
                <Megaphone className="w-3 h-3" />
                <span>Official Announcement</span>
            </div>
        )}
        {isSignal && (
            <div className="flex items-center space-x-1 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded-lg w-fit">
                <Target className="w-3 h-3" />
                <span>Trade Signal</span>
            </div>
        )}
        {isEducational && (
            <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded-lg w-fit">
                <BarChart2 className="w-3 h-3" />
                <span>Market Insight</span>
            </div>
        )}
        {post.user.isSebiVerified && (
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg w-fit border border-blue-200 dark:border-blue-900/30">
                <ShieldAlert className="w-3 h-3" />
                <span>SEBI Reg. RA</span>
            </div>
        )}
      </div>

      <div className="flex items-start justify-between mb-3 w-full">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar user={post.user} size="md" showBadge />
            <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight truncate max-w-full">{post.user.name}</span>
                    {post.user.guruStats?.isTrending && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 font-bold uppercase tracking-wider flex items-center">
                            <TrendingUp className="w-2.5 h-2.5 mr-1" /> Trending
                        </span>
                    )}
                </div>
                <div className="flex items-center text-xs text-slate-500 dark:text-zinc-500 font-medium truncate">
                   <span>{post.user.handle}</span>
                   <span className="mx-1">•</span>
                   <span>{post.timestamp}</span>
                </div>
            </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:text-zinc-600 dark:hover:text-zinc-300 ml-2">
            <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4 text-slate-800 dark:text-zinc-200 text-[15px] leading-relaxed font-normal break-words">
        {renderContent(post.content)}
      </div>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm">
            <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
        </div>
      )}

      {/* SIGNAL CARD UI - Enhanced Display */}
      {isSignal && post.tradeDetails && (
          <div className={`bg-slate-50 dark:bg-[#1c1c1e] rounded-2xl border ${expiryInfo?.isUrgent ? 'border-red-200 dark:border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-slate-200 dark:border-white/5'} mb-5 overflow-hidden shadow-sm relative transition-all duration-300 w-full group-hover:shadow-md`}>
             
             {/* Urgent Expiry Flash Background */}
             {expiryInfo?.isUrgent && (
                 <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10 animate-pulse z-0 pointer-events-none"></div>
             )}

             <div className="p-4 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                                {post.tradeDetails.ticker}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm shrink-0 ${post.tradeDetails.tradeType === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`}>
                                {post.tradeDetails.tradeType}
                            </span>
                        </div>
                        
                        <div className="flex items-center mt-1 space-x-3 flex-wrap">
                            {post.tradeDetails.timeframe && (
                                <div className="flex items-center text-slate-500 dark:text-zinc-400">
                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                    <span className="text-[11px] font-bold uppercase tracking-wide">{post.tradeDetails.timeframe}</span>
                                </div>
                            )}

                            {expiryInfo && (
                                <div className={`flex items-center ${expiryInfo.isUrgent ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-500 dark:text-zinc-400'}`}>
                                    <Timer className={`w-3.5 h-3.5 mr-1 ${expiryInfo.isUrgent ? 'animate-pulse' : ''}`} />
                                    <span className="text-[11px] font-bold uppercase tracking-wide">{expiryInfo.label}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Locked Status Badge */}
                    {isLockedSignal ? (
                        <div className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/10 dark:text-yellow-500 uppercase tracking-wider shrink-0 flex items-center">
                            <Lock className="w-3 h-3 mr-1" /> Premium
                        </div>
                    ) : (
                        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider shrink-0 ${post.tradeDetails.status === 'Active' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 'bg-gray-100 text-gray-500'}`}>
                            {post.tradeDetails.status}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3 relative">
                     {/* OVERLAY FOR LOCKED SIGNAL */}
                     {isLockedSignal && (
                         <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/20">
                             <button 
                                onClick={handleUnlockClick}
                                className="bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-full font-bold text-xs shadow-xl shadow-slate-900/20 active:scale-95 transition-transform flex items-center animate-in zoom-in"
                             >
                                 <Lock className="w-3 h-3 mr-1.5" /> Unlock Signal
                             </button>
                         </div>
                     )}

                     {/* Entry Box */}
                     <div className={`bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border-l-4 border-slate-400 dark:border-slate-500 flex flex-col justify-between shadow-sm min-w-0 ${isLockedSignal ? 'blur-sm select-none' : ''}`}>
                         <div className="flex items-center space-x-1.5 mb-2 opacity-70">
                             <ArrowRight className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                             <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase font-bold tracking-wider truncate">Entry</span>
                         </div>
                         <div className="font-mono font-bold text-slate-800 dark:text-white text-lg truncate">₹{post.tradeDetails.entryPrice}</div>
                     </div>
                     
                     {/* Target Box */}
                     <div className={`bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border-l-4 border-emerald-500 flex flex-col justify-between shadow-sm min-w-0 ${isLockedSignal ? 'blur-sm select-none' : ''}`}>
                         <div className="flex items-center space-x-1.5 mb-2 opacity-80">
                             <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                             <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider truncate">Target</span>
                         </div>
                         <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-lg truncate">₹{post.tradeDetails.targetPrice}</div>
                     </div>
                     
                     {/* SL Box */}
                     <div className={`bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border-l-4 border-rose-500 flex flex-col justify-between shadow-sm min-w-0 ${isLockedSignal ? 'blur-sm select-none' : ''}`}>
                         <div className="flex items-center space-x-1.5 mb-2 opacity-80">
                             <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                             <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold tracking-wider truncate">Stop</span>
                         </div>
                         <div className="font-mono font-bold text-rose-700 dark:text-rose-400 text-lg truncate">₹{post.tradeDetails.stopLoss}</div>
                     </div>
                </div>

                {/* Legal Disclaimer for Signals - MANDATORY FOR SEBI COMPLIANCE */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-start space-x-2">
                    <AlertTriangle className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 leading-tight">
                        <span className="font-bold">Disclaimer:</span> 
                        {post.user.isSebiVerified 
                           ? ` Issued by SEBI Reg. Analyst (${post.user.sebiRegNo}). InvestMate is a technology platform and does not provide advice.` 
                           : " Educational purposes only. Not financial advice."}
                    </div>
                </div>
             </div>
          </div>
      )}

      {/* Render Charts for Detected Tickers - Locked if signal is locked */}
      {post.tickers.length > 0 && !isSignal && (
          <div className="mb-4 -mx-2">
            {post.tickers.map(ticker => (
                <StockChart key={ticker} ticker={ticker} />
            ))}
          </div>
      )}

      {/* Sentiment Voting Section */}
      {!isAnnouncement && (
          <div className="mb-4 bg-slate-50 dark:bg-black/30 rounded-xl p-3 border border-slate-100 dark:border-white/5">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Community Sentiment</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-600">{totalVotes} Votes</span>
              </div>
              
              {/* Meter */}
              <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex mb-3">
                   <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${bullishPercent}%` }}></div>
                   <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${100 - bullishPercent}%` }}></div>
              </div>

              <div className="flex space-x-2">
                  <button 
                    onClick={() => handleVote('bullish')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${userVotedBullish ? 'bg-green-500 text-white shadow-md' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:bg-green-50 dark:hover:bg-green-500/20'}`}
                  >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Bullish {Math.round(bullishPercent)}%</span>
                  </button>
                  <button 
                    onClick={() => handleVote('bearish')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${userVotedBearish ? 'bg-red-500 text-white shadow-md' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/20'}`}
                  >
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Bearish {Math.round(100 - bullishPercent)}%</span>
                  </button>
              </div>
          </div>
      )}

      {/* AI Analysis Section */}
      {analysis && (
        <div className="bg-gradient-to-br from-brand-50 to-white dark:from-[#1A1A1A] dark:to-[#121212] rounded-2xl p-4 mb-4 border border-brand-100 dark:border-white/10 shadow-inner animate-scale-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            
            <div className="flex items-center space-x-2 mb-3 relative z-10">
                <div className="bg-brand-100 dark:bg-brand-500/20 p-1.5 rounded-lg">
                    <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <span className="text-sm font-bold text-brand-800 dark:text-brand-200 tracking-tight">AI Market Insight</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm mb-3 relative z-10">
                <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5 shadow-sm">
                    <span className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Sentiment</span>
                    <span className={`font-bold text-base ${analysis.sentiment === 'Bullish' ? 'text-green-500' : analysis.sentiment === 'Bearish' ? 'text-red-500' : 'text-slate-600 dark:text-zinc-300'}`}>
                        {analysis.sentiment}
                    </span>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5 shadow-sm">
                    <span className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Risk</span>
                    <span className={`font-bold text-base ${analysis.risk === 'High' ? 'text-red-500' : analysis.risk === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                        {analysis.risk}
                    </span>
                </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 italic relative z-10 border-l-2 border-brand-300 dark:border-brand-500/50 pl-3 leading-relaxed">"{analysis.summary}"</p>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 relative">
        <div className="flex items-center space-x-1">
            <button 
                onClick={handleLike}
                aria-label={isLiked ? "Unlike post" : "Like post"}
                className={`flex items-center space-x-1.5 text-sm p-2 rounded-xl transition-all active:scale-90 duration-200 group ${isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500 dark:text-zinc-400'}`}
            >
                <div className={`p-1.5 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-500/10 transition-colors ${isLiked ? 'bg-red-50 dark:bg-red-500/10' : ''}`}>
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className="font-semibold text-xs">{post.likes}</span>
            </button>
            <button 
                onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setShowComments(true); }}
                aria-label="View comments"
                className="flex items-center space-x-1.5 text-sm p-2 rounded-xl text-slate-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400 transition-colors active:scale-90 group"
            >
                <div className="p-1.5 rounded-full group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                </div>
                <span className="font-semibold text-xs">{post.comments}</span>
            </button>
            <button 
                onClick={handleShare}
                aria-label={copied ? "Link copied" : "Share post"}
                className={`flex items-center space-x-1.5 text-sm p-2 rounded-xl transition-colors active:scale-90 group relative ${copied ? 'text-green-600' : 'text-slate-500 hover:text-green-600 dark:text-zinc-400'}`}
            >
                <div className="p-1.5 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-500/10 transition-colors">
                    {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                </div>
                {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap z-30">
                        Copied!
                    </span>
                )}
            </button>

            {/* EDUCATIONAL POST "HELPFUL" BUTTON */}
            {isEducational && (
                 <button 
                    onClick={handleVoteHelpful}
                    disabled={hasVotedHelpful}
                    className={`flex items-center space-x-1.5 text-sm p-2 rounded-xl transition-all active:scale-90 duration-200 group ${hasVotedHelpful ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-zinc-400 hover:text-purple-600'}`}
                 >
                    <div className={`p-1.5 rounded-full group-hover:bg-purple-50 dark:group-hover:bg-purple-500/10 transition-colors ${hasVotedHelpful ? 'bg-purple-50 dark:bg-purple-500/10' : ''}`}>
                         <Lightbulb className={`w-5 h-5 ${hasVotedHelpful ? 'fill-current' : ''}`} />
                    </div>
                 </button>
            )}
        </div>
        
        {!analysis && !isLockedSignal && (
            <button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                aria-label="Analyze post with AI"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-300 text-[11px] font-bold hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-white/10 transition-colors active:scale-95"
            >
                {isAnalyzing ? (
                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
                ) : (
                    <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                )}
                <span>Analyze</span>
            </button>
        )}

        {/* SMART HELPFUL PROMPT (Toast) */}
        {showHelpfulPrompt && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[90%] bg-slate-900 dark:bg-white text-white dark:text-black p-3 rounded-2xl shadow-xl animate-in slide-in-from-bottom-2 flex items-center justify-between z-20">
                <div className="text-xs font-medium pr-2">
                    Found this useful? Upvote {post.user.name.split(' ')[0]}!
                </div>
                <div className="flex space-x-2">
                     <button onClick={() => setShowHelpfulPrompt(false)} className="p-1 rounded-full hover:bg-white/20 dark:hover:bg-black/10">
                        <X className="w-4 h-4" />
                     </button>
                     <button 
                        onClick={handleVoteHelpful}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center shadow-lg shadow-purple-500/30"
                     >
                         <Lightbulb className="w-3 h-3 mr-1 fill-current" /> Helpful
                     </button>
                </div>
                {/* Little Tail */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 dark:bg-white rotate-45"></div>
            </div>
        )}
      </div>

      {/* Comments Bottom Sheet Modal - Constrained to phone width */}
      {showComments && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
                onClick={() => setShowComments(false)}
            ></div>
            
            <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 relative z-10 flex flex-col max-h-[85vh] mx-auto">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <div className="w-10"></div> {/* Spacer */}
                    <div className="w-12 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full mb-1"></div>
                    <button onClick={() => setShowComments(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full text-slate-500 dark:text-zinc-400" aria-label="Close comments"><X className="w-5 h-5"/></button>
                </div>
                
                <h3 className="text-center font-bold text-slate-800 dark:text-white py-2 text-sm tracking-wide uppercase">Comments ({post.comments})</h3>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                    {post.commentsList && post.commentsList.length > 0 ? (
                        post.commentsList.map(comment => (
                            <div key={comment.id} className="flex space-x-3">
                                <Avatar user={comment.user} size="sm" />
                                <div className="flex-1 bg-slate-50 dark:bg-white/5 rounded-2xl rounded-tl-none p-3 border border-slate-100 dark:border-white/5 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{comment.user.name}</span>
                                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 whitespace-nowrap ml-2">{comment.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-zinc-300 break-words">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 flex flex-col items-center justify-center opacity-60">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-zinc-500">No comments yet. Start the conversation!</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#121212] safe-area-bottom pb-8">
                    <div className={`flex items-center space-x-2 bg-slate-100 dark:bg-black rounded-full px-2 py-1.5 border transition-all ${isOverLimit ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent'}`}>
                        <img src={currentUser.avatar} className="w-8 h-8 rounded-full ml-1 shrink-0" />
                        <input 
                            type="text" 
                            value={commentText}
                            autoFocus
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none px-2 min-w-0"
                            onKeyDown={(e) => e.key === 'Enter' && !isOverLimit && handlePostComment()}
                            aria-label="Write a comment"
                        />
                         {commentText.length > 0 && (
                             <span className={`text-[10px] font-medium mr-2 whitespace-nowrap ${isOverLimit ? 'text-red-500' : 'text-slate-400 dark:text-zinc-500'}`}>
                                {commentText.length}/{MAX_COMMENT_LENGTH}
                             </span>
                        )}
                        <button 
                            onClick={handlePostComment}
                            disabled={!commentText.trim() || isOverLimit}
                            className="p-2 rounded-full bg-brand-600 text-white disabled:bg-slate-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors shrink-0"
                            aria-label="Send comment"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
});

export default PostCard;
