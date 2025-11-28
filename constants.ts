

import { User, Post, Club, ChatMessage, Badge, Story } from './types';

export const BADGES: Record<string, Badge> = {
  'early_adopter': { id: 'early_adopter', name: 'Early Adopter', description: 'Joined during the beta phase.', icon: 'rocket', rarity: 'Legendary' },
  'sniper': { id: 'sniper', name: 'Sniper', description: 'Successfully predicted 5 breakouts.', icon: 'target', rarity: 'Epic' },
  'bull': { id: 'bull', name: 'Bull', description: 'Maintained a bullish sentiment streak.', icon: 'trending-up', rarity: 'Rare' },
  'analyst': { id: 'analyst', name: 'Analyst', description: 'Posted 10 detailed analyses.', icon: 'bar-chart', rarity: 'Common' },
  'wizard': { id: 'wizard', name: 'Market Wizard', description: 'Reached top 1% of XP leaderboard.', icon: 'zap', rarity: 'Legendary' },
  'social': { id: 'social', name: 'Social Butterfly', description: 'Commented on 50 posts.', icon: 'users', rarity: 'Common' },
};

// TRACK 1: EDUCATOR (Non-Registered)
// Arjun is a Swing Trader/Educator. He cannot post signals or charge for signals.
export const USER_ARJUN: User = {
  id: 'u1',
  name: 'Arjun Mehta',
  handle: '@arjun_invests',
  avatar: 'https://picsum.photos/100/100?random=1',
  rank: 'Analyst',
  xp: 4500,
  following: 124,
  followers: 892,
  streak: 12,
  bio: 'Swing trader | Educator | Tech Enthusiast',
  badges: ['early_adopter', 'analyst', 'bull'],
  joinedClubs: [],
  isSebiVerified: false, // NOT REGISTERED -> No Signal Posting Access
  isPro: false,
  guruStats: {
    totalReach: 892,
    communityRank: 'Growing',
    engagementScore: 45,
    engagementBadge: null,
    retentionRate: 65,
    isTrusted: false,
    educationalScore: 120,
    helpfulVotes: 34,
    educationBadge: null,
    momentumScore: 12,
    isTrending: false
  }
};

// TRACK 2: REGISTERED ANALYST (RA)
// Priya is SEBI Verified. She CAN post Signals and has a Premium Club.
export const USER_PRIYA: User = {
  id: 'u2',
  name: 'Priya Sharma',
  handle: '@priya_trades',
  avatar: 'https://picsum.photos/100/100?random=2',
  rank: 'Guru',
  xp: 15000,
  following: 500,
  followers: 12000,
  streak: 45,
  bio: 'SEBI Reg. RA | F&O Expert',
  badges: ['sniper', 'wizard'],
  joinedClubs: ['c1', 'c2', 'c3'],
  isSebiVerified: true, // REGISTERED -> Full Access
  sebiRegNo: 'INA000123456',
  tradingStats: {
    roi: 24.5,
    winRate: 72,
    tradesTaken: 340
  },
  isPro: true,
  guruStats: {
    totalReach: 27400,
    communityRank: 'Super',
    engagementScore: 890,
    engagementBadge: 'Champion',
    retentionRate: 92,
    isTrusted: true,
    educationalScore: 4500,
    helpfulVotes: 2100,
    educationBadge: 'Master Educator',
    momentumScore: 85,
    isTrending: true
  }
};

export const CURRENT_USER = USER_ARJUN; // Default start as Non-Registered to test restrictions

export const LEADERBOARD_USERS: User[] = [
    USER_PRIYA,
    USER_ARJUN,
    {
        id: 'u3', name: 'Crypto King', handle: '@btc_king', avatar: 'https://picsum.photos/100/100?random=3', rank: 'Market Wizard', xp: 50000, following: 20, followers: 50000, streak: 100, bio: 'Crypto maximalist', badges: ['wizard'], joinedClubs: [],
        isSebiVerified: false,
        guruStats: {
            totalReach: 73000,
            communityRank: 'Mega',
            engagementScore: 1200,
            engagementBadge: 'Discussion Leader',
            retentionRate: 45,
            isTrusted: false,
            educationalScore: 300,
            helpfulVotes: 120,
            educationBadge: null,
            momentumScore: 98,
            isTrending: true
        }
    },
    {
        id: 'u4', name: 'Vikram Singh', handle: '@vikram_v', avatar: 'https://picsum.photos/100/100?random=4', rank: 'Guru', xp: 12000, following: 100, followers: 8000, streak: 30, bio: 'Value Investor', badges: ['analyst'], joinedClubs: [],
        isSebiVerified: true, sebiRegNo: 'INA000987654', tradingStats: { roi: 18.2, winRate: 65, tradesTaken: 120 },
        guruStats: {
            totalReach: 16200,
            communityRank: 'Influencer',
            engagementScore: 400,
            engagementBadge: null,
            retentionRate: 98,
            isTrusted: true,
            educationalScore: 2200,
            helpfulVotes: 890,
            educationBadge: 'Market Teacher',
            momentumScore: 15,
            isTrending: false
        }
    },
    {
        id: 'u5', name: 'Neha Gupta', handle: '@neha_g', avatar: 'https://picsum.photos/100/100?random=5', rank: 'Analyst', xp: 8000, following: 200, followers: 2000, streak: 60, bio: 'Charts & Coffee', badges: ['social'], joinedClubs: [],
        isSebiVerified: false,
        guruStats: {
            totalReach: 2000,
            communityRank: 'Rising',
            engagementScore: 600,
            engagementBadge: 'High Engagement',
            retentionRate: 88,
            isTrusted: true,
            educationalScore: 1500,
            helpfulVotes: 560,
            educationBadge: 'Charting Expert',
            momentumScore: 92,
            isTrending: true
        }
    }
];

export const MOCK_CLUBS: Club[] = [
  { 
      id: 'c1', 
      name: 'F&O Snipers', 
      category: 'Trading', 
      members: 15400, 
      description: 'Official Premium Advisory by Priya Sharma (SEBI RA). Intraday F&O Signals.', 
      image: 'https://picsum.photos/200/200?random=10', 
      ownerId: 'u2',
      isPremium: true, // Only allowed because Owner U2 is SEBI Verified
      price: 999 
  },
  { id: 'c2', name: 'Value Investors India', category: 'Investing', members: 8200, description: 'Long term wealth creation through fundamental analysis.', image: 'https://picsum.photos/200/200?random=11' },
  { id: 'c3', name: 'Crypto Corner', category: 'Crypto', members: 23000, description: 'Everything Blockchain, BTC, and ETH.', image: 'https://picsum.photos/200/200?random=12' },
];

const getFutureDate = (hours: number) => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date.toISOString();
};

export const MOCK_POSTS: Post[] = [
  {
    id: 's1',
    userId: 'u2',
    user: USER_PRIYA,
    content: "Strong breakout pattern on Tata Motors. Volume confirms the move. Risk/Reward 1:3.",
    timestamp: '1h ago',
    likes: 342,
    comments: 45,
    shares: 22,
    hashtags: ['#tatamotors', '#breakout'],
    tickers: ['$TATAMOTORS'],
    likedBy: [],
    type: 'signal', // Allowed because User is Verified
    tradeDetails: {
      ticker: 'TATAMOTORS',
      entryPrice: 945.50,
      targetPrice: 980.00,
      stopLoss: 930.00,
      tradeType: 'BUY',
      status: 'Active',
      timeframe: 'Swing',
      expiry: getFutureDate(18)
    }
  },
  {
    id: 'p1',
    userId: 'u2',
    user: USER_PRIYA,
    content: "Understanding Open Interest (OI) is crucial for Options Trading. High Call OI indicates resistance, while High Put OI indicates support. Here is a chart explaining the PCR ratio.",
    timestamp: '2m ago',
    likes: 540,
    comments: 89,
    shares: 120,
    hashtags: ['#education', '#options'],
    tickers: [],
    likedBy: [],
    type: 'educational', 
    helpfulVotes: 245
  },
  {
    id: 'p2',
    userId: 'u3',
    user: LEADERBOARD_USERS[2],
    content: "Market sentiment is extremely bearish on $INFY after the earnings report. Be careful catching falling knives! #bearish #earnings",
    timestamp: '15m ago',
    likes: 890,
    comments: 156,
    shares: 89,
    hashtags: ['#bearish', '#earnings'],
    tickers: ['$INFY'],
    likedBy: ['u1'],
    type: 'regular'
  },
  // Club Specific Posts
  {
    id: 'cp1',
    userId: 'u2',
    user: USER_PRIYA,
    clubId: 'c1',
    content: "🚨 OFFICIAL ANNOUNCEMENT: We are observing a Bullish Harami pattern on $BANKNIFTY 15m timeframe. Keep an eye on 44,500 CE levels. Wait for confirmation candle.",
    timestamp: '1h ago',
    likes: 240,
    comments: 45,
    shares: 20,
    hashtags: ['#banknifty'],
    tickers: ['$BANKNIFTY'],
    likedBy: [],
    type: 'announcement'
  },
  {
    id: 'cp2',
    userId: 'u1',
    user: USER_ARJUN,
    clubId: 'c1',
    content: "Has anyone tried the Iron Condor strategy for this expiry? Premium decay seems low today.",
    timestamp: '2h ago',
    likes: 12,
    comments: 4,
    shares: 0,
    hashtags: [],
    tickers: [],
    likedBy: [],
    type: 'regular'
  }
];

export const MOCK_STORIES: Story[] = [
    { id: 's1', userId: 'u2', user: USER_PRIYA, imageUrl: 'https://picsum.photos/400/800?random=100', timestamp: '1h ago', viewed: false },
    { id: 's2', userId: 'u3', user: LEADERBOARD_USERS[2], imageUrl: 'https://picsum.photos/400/800?random=101', timestamp: '3h ago', viewed: false },
];

export const INITIAL_CHAT: ChatMessage[] = [
  { id: 'm1', userId: 'u4', user: { ...USER_ARJUN, name: 'Trader Joe', id: 'u4' }, text: 'BankNifty looking weak at 44500 resistance.', timestamp: '10:00 AM' },
  { id: 'm2', userId: 'u2', user: USER_PRIYA, text: 'Agreed, I am seeing heavy call writing there.', timestamp: '10:01 AM' },
  { id: 'm3', userId: 'u5', user: { ...USER_ARJUN, name: 'Ravi K', id: 'u5' }, text: 'Anyone tracking $RELIANCE? Moving fast.', timestamp: '10:02 AM' },
];
