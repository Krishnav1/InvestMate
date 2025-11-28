import React, { useState } from 'react';
import { X, Trophy, ShieldCheck, TrendingUp, Users, Info, BookOpen, Flame, Heart, Zap } from 'lucide-react';
import { LEADERBOARD_USERS } from '../constants';
import { User } from '../types';

interface LeaderboardProps {
    onClose: () => void;
}

type LeaderboardTab = 'titans' | 'trendsetters' | 'educators' | 'engagers' | 'trusted';

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<LeaderboardTab>('titans');

    // Filter & Sort Logic based on Tab
    const getSortedUsers = () => {
        let filtered = LEADERBOARD_USERS.filter(u => u.guruStats); // Only users with guru stats
        
        switch(activeTab) {
            case 'titans': // Community Size
                return filtered.sort((a, b) => (b.guruStats?.totalReach || 0) - (a.guruStats?.totalReach || 0));
            case 'trendsetters': // Momentum
                return filtered.sort((a, b) => (b.guruStats?.momentumScore || 0) - (a.guruStats?.momentumScore || 0));
            case 'educators': // Education Score
                return filtered.sort((a, b) => (b.guruStats?.educationalScore || 0) - (a.guruStats?.educationalScore || 0));
            case 'engagers': // Engagement Score
                return filtered.sort((a, b) => (b.guruStats?.engagementScore || 0) - (a.guruStats?.engagementScore || 0));
            case 'trusted': // Retention Rate
                return filtered.sort((a, b) => (b.guruStats?.retentionRate || 0) - (a.guruStats?.retentionRate || 0));
            default:
                return filtered;
        }
    };

    const users = getSortedUsers();

    const getTabIcon = (tab: LeaderboardTab) => {
        switch(tab) {
            case 'titans': return <Users className="w-4 h-4" />;
            case 'trendsetters': return <TrendingUp className="w-4 h-4" />;
            case 'educators': return <BookOpen className="w-4 h-4" />;
            case 'engagers': return <Flame className="w-4 h-4" />;
            case 'trusted': return <Heart className="w-4 h-4" />;
        }
    };

    const getTabLabel = (tab: LeaderboardTab) => {
        switch(tab) {
            case 'titans': return 'Titans';
            case 'trendsetters': return 'Trending';
            case 'educators': return 'Educators';
            case 'engagers': return 'Engagers';
            case 'trusted': return 'Trusted';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-dark-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-dark-600 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-brand-600 to-purple-700 text-white relative shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
                    <div className="flex items-center space-x-2 mb-1">
                        <Trophy className="w-6 h-6 text-yellow-300" />
                        <h2 className="text-xl font-black uppercase tracking-wide">Guru Rankings</h2>
                    </div>
                    <p className="text-brand-100 text-xs font-medium max-w-[80%]">The top voices in the community ranked by value, not just hype.</p>
                </div>

                {/* Tabs - Scrollable */}
                <div className="flex bg-slate-100 dark:bg-dark-900 p-1.5 shrink-0 overflow-x-auto no-scrollbar">
                    {(['titans', 'trendsetters', 'educators', 'engagers', 'trusted'] as LeaderboardTab[]).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-dark-700 text-brand-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-500'}`}
                        >
                            {getTabIcon(tab)}
                            <span>{getTabLabel(tab)}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2 no-scrollbar bg-slate-50 dark:bg-dark-900">
                    <div className="space-y-2">
                        {users.map((user, index) => {
                            const gs = user.guruStats;
                            if (!gs) return null;

                            let statValue = '';
                            let statLabel = '';
                            
                            if (activeTab === 'titans') {
                                statValue = gs.totalReach.toLocaleString();
                                statLabel = 'Reach';
                            } else if (activeTab === 'trendsetters') {
                                statValue = gs.momentumScore + '%';
                                statLabel = 'Momentum';
                            } else if (activeTab === 'educators') {
                                statValue = gs.educationalScore.toLocaleString();
                                statLabel = 'Points';
                            } else if (activeTab === 'engagers') {
                                statValue = gs.engagementScore.toLocaleString();
                                statLabel = 'Score';
                            } else if (activeTab === 'trusted') {
                                statValue = gs.retentionRate + '%';
                                statLabel = 'Retention';
                            }

                            return (
                                <div key={user.id} className="bg-white dark:bg-dark-800 p-3 rounded-xl border border-slate-100 dark:border-dark-700 flex items-center shadow-sm">
                                    <div className={`w-8 h-8 flex items-center justify-center font-black text-lg mr-3 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-400' : 'text-slate-300'}`}>
                                        #{index + 1}
                                    </div>
                                    <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-200 dark:border-dark-600 object-cover" />
                                    <div className="flex-1 ml-3">
                                        <div className="flex items-center space-x-1">
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</span>
                                            {user.rank === 'Market Wizard' && <Zap className="w-3 h-3 text-yellow-500 fill-current" />}
                                        </div>
                                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-gray-400">
                                            {gs.communityRank} Guru
                                            {activeTab === 'trusted' && gs.isTrusted && (
                                                <span className="text-green-600 bg-green-100 px-1 rounded flex items-center"><ShieldCheck className="w-2.5 h-2.5 mr-0.5" /> Trusted</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-brand-600 dark:text-brand-400 font-bold text-sm">{statValue}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">{statLabel}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex items-start space-x-2 text-xs text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 mt-4">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>
                            {activeTab === 'titans' && "Ranked by total community size (Followers + Club Members)."}
                            {activeTab === 'trendsetters' && "Ranked by growth speed this week. New faces shine here!"}
                            {activeTab === 'educators' && "Ranked by helpful votes on educational content."}
                            {activeTab === 'engagers' && "Ranked by activity, replies, and liveliness of their club."}
                            {activeTab === 'trusted' && "Ranked by member retention. High retention means a happy community."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;