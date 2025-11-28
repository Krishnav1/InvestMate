

export type Theme = 'light' | 'dark';

export interface GuruStats {
  // 1. Community Size
  totalReach: number; // Followers + Club Members
  communityRank: 'Emerging' | 'Growing' | 'Rising' | 'Leader' | 'Influencer' | 'Super' | 'Mega';
  
  // 2. Engagement
  engagementScore: number; // Calculated algorithmically
  engagementBadge: 'High Engagement' | 'Discussion Leader' | 'Champion' | null;

  // 3. Retention
  retentionRate: number; // Percentage (0-100)
  isTrusted: boolean; // "Loyal Fanbase" badge

  // 4. Education
  educationalScore: number;
  helpfulVotes: number;
  educationBadge: 'Master Educator' | 'Charting Expert' | 'Market Teacher' | null;

  // 5. Momentum
  momentumScore: number; // Growth velocity
  isTrending: boolean; // "Fastest Growing" badge
}

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  rank: 'Novice' | 'Analyst' | 'Guru' | 'Market Wizard';
  xp: number;
  following: number;
  followers: number;
  streak: number;
  bio: string;
  badges: string[]; // IDs of earned badges
  joinedClubs: string[]; // IDs of clubs joined
  
  // COMPLIANCE & ROLES
  isSebiVerified?: boolean; // If TRUE, can post Signals/Advice
  sebiRegNo?: string; // Mandatory if verified
  
  tradingStats?: { // Verified performance only
    roi: number;
    winRate: number;
    tradesTaken: number;
  };
  guruStats?: GuruStats; // The 5-Pillar Ranking System
  isPro?: boolean; // MONETIZATION: Premium User Status
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  text: string;
  timestamp: string;
}

export type PostType = 'regular' | 'announcement' | 'signal' | 'educational';
export type TradeType = 'BUY' | 'SELL';
export type TradeStatus = 'Active' | 'Target Hit' | 'SL Hit' | 'Expired';

export interface TradeDetails {
  ticker: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  tradeType: TradeType;
  status: TradeStatus;
  pnl?: number; // percentage
  expiry?: string;
  timeframe?: string; // e.g., 'Intraday', '1D', 'Swing'
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  timestamp: string; // ISO string or relative time for display
  likes: number;
  comments: number;
  shares: number;
  hashtags: string[];
  tickers: string[];
  likedBy: string[]; // IDs of users who liked this
  sentimentVotes?: { // Community Sentiment
      bullish: string[]; // User IDs
      bearish: string[]; // User IDs
  };
  commentsList?: Comment[];
  clubId?: string; // Optional: If belongs to a club
  type?: PostType; // Type of post
  tradeDetails?: TradeDetails; // Optional: Only for 'signal' type (SEBI RAs only)
  imageUrl?: string; // Optional: Image attachment
  helpfulVotes?: number; // For Educational Rank
}

export interface ChatMessage {
  id: string;
  userId: string;
  user: User;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  history: { time: string; value: number }[];
}

export interface Club {
  id: string;
  name: string;
  category: 'Trading' | 'Investing' | 'News' | 'Crypto';
  members: number;
  description: string;
  image: string;
  ownerId?: string; // If null, it's a system club
  isPremium?: boolean; // MONETIZATION: Paid Club (Requires SEBI RA for Trading clubs)
  price?: number; // Monthly price in INR
}

export interface Story {
  id: string;
  userId: string;
  user: User;
  imageUrl: string;
  timestamp: string;
  viewed: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

// Scheduled Alerts Types
export type AlertType = 'PRE_MARKET' | 'POST_MARKET' | 'NEWS' | 'SIGNAL_REMINDER';
export type RepeatType = 'NONE' | 'DAILY' | 'WEEKLY';

export interface ScheduledAlert {
  id: string;
  userId: string;
  clubId?: string; // Target audience
  type: AlertType;
  content: string;
  scheduledTime: string; // ISO String
  repeat: RepeatType;
  status: 'PENDING' | 'SENT' | 'CANCELLED';
  aiContextEnabled: boolean;
}

// Audio Room Types
export type SpeakerRole = 'HOST' | 'SPEAKER' | 'LISTENER';

export interface AudioRoomSpeaker {
    id: string;
    userId: string;
    user: User;
    role: SpeakerRole;
    isMuted: boolean;
    isSpeaking: boolean;
    isHandRaised: boolean;
}

export interface AudioRoom {
    id: string;
    clubId: string; // Linking room to a specific club
    clubName: string;
    clubImage: string;
    title: string;
    topic: string; // e.g., "Market Opening", "Earnings"
    hostId: string;
    speakers: AudioRoomSpeaker[];
    listenerCount: number;
    status: 'LIVE' | 'ENDED';
    relatedTickers: string[]; // Context tickers
    startedAt: string;
}

export interface TranscriptSegment {
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: string;
}

export enum Tab {
  FEED = 'feed',
  CHAT = 'chat',
  CLUBS = 'clubs',
  PROFILE = 'profile',
}

// Helper to get dominant rank style
export const getDominantRankStyle = (user: User): string => {
    if (!user.guruStats) return 'border-slate-100 dark:border-dark-700'; // Default

    const gs = user.guruStats;
    
    // Priority 1: Momentum (Fire)
    if (gs.isTrending) return 'ring-2 ring-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)] border-transparent';
    
    // Priority 2: Titan (Gold)
    if (['Super', 'Mega'].includes(gs.communityRank)) return 'ring-2 ring-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] border-transparent';
    
    // Priority 3: Educator (Purple/Blue)
    if (gs.educationBadge) return 'ring-2 ring-purple-500 border-transparent';
    
    // Priority 4: Trusted (Green)
    if (gs.isTrusted) return 'ring-2 ring-green-500 border-transparent';

    return 'border-slate-100 dark:border-dark-700';
};
