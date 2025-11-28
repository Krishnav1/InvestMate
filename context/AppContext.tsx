

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Post, User, Club, Story, Badge, Comment, Theme, TradeDetails, PostType, ScheduledAlert, AlertType, RepeatType, AudioRoom, AudioRoomSpeaker, SpeakerRole } from '../types';
import { MOCK_POSTS, MOCK_CLUBS, MOCK_STORIES, USER_ARJUN, USER_PRIYA } from '../constants';
import { moderateContent } from '../services/geminiService';
import { sendNotification } from '../services/notificationService';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  currentUser: User;
  posts: Post[];
  clubs: Club[];
  stories: Story[];
  scheduledAlerts: ScheduledAlert[];
  
  // Audio Room State
  activeRoom: AudioRoom | null; // The room the USER is currently in
  availableRooms: AudioRoom[]; // All active rooms across clubs
  isRoomMinimized: boolean;

  // Monetization State
  isPaymentModalOpen: boolean;
  paymentTrigger: string; // Context of why payment was triggered (e.g., 'Signal Unlock', 'Club Join')
  openPaymentModal: (reason: string) => void;
  closePaymentModal: () => void;
  upgradeToPro: () => void;
  
  // Demo State
  isDemoOpen: boolean;
  openDemo: () => void;
  closeDemo: () => void;
  
  switchUser: (userId: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  addPost: (content: string, clubId?: string, type?: PostType, tradeDetails?: TradeDetails, imageUrl?: string) => Promise<boolean>;
  addStory: (imageUrl: string) => void;
  addComment: (postId: string, text: string) => void;
  toggleLike: (postId: string) => void;
  voteSentiment: (postId: string, vote: 'bullish' | 'bearish') => void;
  joinClub: (clubId: string) => void;
  leaveClub: (clubId: string) => void;
  createClub: (name: string, category: Club['category'], description: string, isPremium: boolean, price: number) => Club;
  markStoryViewed: (storyId: string) => void;
  awardXP: (amount: number) => void;
  scheduleAlert: (type: AlertType, content: string, time: string, clubId: string | undefined, repeat: RepeatType, aiContext: boolean) => void;
  cancelAlert: (alertId: string) => void;
  
  // Audio Room Actions
  createRoom: (clubId: string, title: string, topic: string) => void;
  joinRoom: (room: AudioRoom) => void;
  leaveRoom: () => void;
  endRoom: (roomId: string) => void;
  minimizeRoom: () => void;
  maximizeRoom: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light'); // Default to Light
  const [currentUser, setCurrentUser] = useState<User>(USER_ARJUN);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [clubs, setClubs] = useState<Club[]>(MOCK_CLUBS);
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [scheduledAlerts, setScheduledAlerts] = useState<ScheduledAlert[]>([]);

  // Audio Room State
  const [activeRoom, setActiveRoom] = useState<AudioRoom | null>(null);
  const [availableRooms, setAvailableRooms] = useState<AudioRoom[]>([]);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);

  // Monetization State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTrigger, setPaymentTrigger] = useState('');
  
  // Demo State
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Apply theme class to html element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // --- SCHEDULER CRON SIMULATION ---
  useEffect(() => {
      const interval = setInterval(() => {
          const now = new Date();
          
          setScheduledAlerts(prevAlerts => {
              let hasChanges = false;
              const nextAlerts = prevAlerts.map(alert => {
                  if (alert.status === 'PENDING') {
                      const scheduleTime = new Date(alert.scheduledTime);
                      
                      // Check if it's time to fire (within the last minute to avoid double firing if interval drifts)
                      if (scheduleTime <= now) {
                          hasChanges = true;
                          
                          // FIRE THE ALERT
                          fireScheduledAlert(alert);

                          // Handle Recurring Logic
                          if (alert.repeat !== 'NONE') {
                             const nextTime = new Date(scheduleTime);
                             if (alert.repeat === 'DAILY') nextTime.setDate(nextTime.getDate() + 1);
                             if (alert.repeat === 'WEEKLY') nextTime.setDate(nextTime.getDate() + 7);
                             
                             return { ...alert, scheduledTime: nextTime.toISOString() }; // Keep pending, update time
                          } else {
                             return { ...alert, status: 'SENT' as const };
                          }
                      }
                  }
                  return alert;
              });
              
              return hasChanges ? nextAlerts : prevAlerts;
          });

      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
  }, []);

  const fireScheduledAlert = (alert: ScheduledAlert) => {
      // 1. Convert to Post
      let postContent = alert.content;
      if (alert.aiContextEnabled) {
          postContent += "\n\n🤖 *AI Context Added*: Market volatility is currently average. No major red flags.";
      }

      const postType: PostType = alert.type === 'SIGNAL_REMINDER' ? 'regular' : 'announcement';

      const newPost: Post = {
        id: Date.now().toString(),
        userId: alert.userId,
        user: alert.userId === currentUser.id ? currentUser : USER_PRIYA, // Fallback mock
        content: postContent,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        shares: 0,
        hashtags: ['#scheduled', `#${alert.type.toLowerCase().replace('_','')}`],
        tickers: [],
        likedBy: [],
        type: postType,
        clubId: alert.clubId
      };

      setPosts(prev => [newPost, ...prev]);

      // 2. Send Push Notification
      const titleMap = {
          'PRE_MARKET': '☀️ Pre-Market Plan',
          'POST_MARKET': '🌙 Post-Market Summary',
          'NEWS': '📰 Upcoming News Alert',
          'SIGNAL_REMINDER': '🔔 Trade Update'
      };
      
      sendNotification(titleMap[alert.type], postContent.substring(0, 50) + "...");
  };

  const scheduleAlert = (type: AlertType, content: string, time: string, clubId: string | undefined, repeat: RepeatType, aiContext: boolean) => {
      const newAlert: ScheduledAlert = {
          id: Date.now().toString(),
          userId: currentUser.id,
          clubId,
          type,
          content,
          scheduledTime: time,
          repeat,
          status: 'PENDING',
          aiContextEnabled: aiContext
      };
      setScheduledAlerts(prev => [...prev, newAlert]);
  };

  const cancelAlert = (alertId: string) => {
      setScheduledAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'CANCELLED' } : a));
  };
  // ---------------------------------

  // --- MONETIZATION ACTIONS ---
  const openPaymentModal = (reason: string) => {
      setPaymentTrigger(reason);
      setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
      setIsPaymentModalOpen(false);
  };

  const upgradeToPro = () => {
      setCurrentUser(prev => ({ ...prev, isPro: true }));
      // In a real app, verify backend receipt here
      setIsPaymentModalOpen(false);
      sendNotification("Welcome to Pro!", "You now have full access to signals, premium clubs, and more.");
  };
  // ----------------------------
  
  // --- DEMO ACTIONS ---
  const openDemo = () => setIsDemoOpen(true);
  const closeDemo = () => setIsDemoOpen(false);
  // --------------------

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const switchUser = (userId: string) => {
    if (userId === 'u1') setCurrentUser(USER_ARJUN);
    else if (userId === 'u2') setCurrentUser(USER_PRIYA);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setCurrentUser(prev => {
        const updatedUser = { ...prev, ...updates };
        
        // Propagate changes to user's posts for immediate UI consistency
        setPosts(prevPosts => prevPosts.map(post => {
            if (post.userId === prev.id) {
                return { ...post, user: { ...post.user, ...updates } };
            }
            return post;
        }));

        // Propagate to comments (deep update simulation)
        setPosts(prevPosts => prevPosts.map(post => {
            if (post.commentsList) {
                const updatedComments = post.commentsList.map(comment => {
                    if (comment.userId === prev.id) {
                        return { ...comment, user: { ...comment.user, ...updates } };
                    }
                    return comment;
                });
                return { ...post, commentsList: updatedComments };
            }
            return post;
        }));

        return updatedUser;
    });
  };

  const addPost = async (content: string, clubId?: string, type: PostType = 'regular', tradeDetails?: TradeDetails, imageUrl?: string): Promise<boolean> => {
    // 1. Moderate Content
    const isSafe = await moderateContent(content);
    if (!isSafe) {
        alert("Your post was flagged as inappropriate by our AI moderation system.");
        return false;
    }

    // 2. Extract Metadata
    const tickers = (content.match(/\$[A-Z]+/g) || []) as string[];
    const hashtags = (content.match(/#[a-zA-Z0-9]+/g) || []) as string[];
    
    // Add ticker from trade details if missing
    if (tradeDetails && !tickers.includes(`$${tradeDetails.ticker}`)) {
        tickers.push(`$${tradeDetails.ticker}`);
    }

    const newPost: Post = {
      id: Date.now().toString(),
      userId: currentUser.id,
      user: currentUser,
      content,
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
      shares: 0,
      hashtags,
      tickers,
      likedBy: [],
      sentimentVotes: { bullish: [], bearish: [] },
      commentsList: [],
      clubId,
      type,
      tradeDetails,
      imageUrl // Attach image URL if present
    };
    setPosts([newPost, ...posts]);
    return true;
  };

  const addStory = (imageUrl: string) => {
    const newStory: Story = {
        id: Date.now().toString(),
        userId: currentUser.id,
        user: currentUser,
        imageUrl,
        timestamp: 'Just now',
        viewed: false
    };
    // Add to beginning of stories
    setStories(prev => [newStory, ...prev]);
  };

  const addComment = (postId: string, text: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      user: currentUser,
      text,
      timestamp: 'Just now'
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [newComment, ...(post.commentsList || [])]
        };
      }
      return post;
    }));
  };

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.likedBy.includes(currentUser.id);
        return {
          ...post,
          likes: isLiked ? post.likes - 1 : post.likes + 1,
          likedBy: isLiked 
            ? post.likedBy.filter(id => id !== currentUser.id) 
            : [...post.likedBy, currentUser.id]
        };
      }
      return post;
    }));
  };

  const voteSentiment = (postId: string, vote: 'bullish' | 'bearish') => {
      setPosts(prev => prev.map(post => {
          if (post.id !== postId) return post;
          
          const currentVotes = post.sentimentVotes || { bullish: [], bearish: [] };
          const userId = currentUser.id;
          
          // Remove existing vote if any
          const newBullish = currentVotes.bullish.filter(id => id !== userId);
          const newBearish = currentVotes.bearish.filter(id => id !== userId);

          // Add new vote
          if (vote === 'bullish') newBullish.push(userId);
          else newBearish.push(userId);

          return {
              ...post,
              sentimentVotes: { bullish: newBullish, bearish: newBearish }
          };
      }));
  };

  const joinClub = (clubId: string) => {
    setCurrentUser(prev => ({
      ...prev,
      joinedClubs: [...prev.joinedClubs, clubId]
    }));
    setClubs(prev => prev.map(c => c.id === clubId ? { ...c, members: c.members + 1 } : c));
  };

  const leaveClub = (clubId: string) => {
    setCurrentUser(prev => ({
      ...prev,
      joinedClubs: prev.joinedClubs.filter(id => id !== clubId)
    }));
    setClubs(prev => prev.map(c => c.id === clubId ? { ...c, members: c.members - 1 } : c));
  };

  const createClub = (name: string, category: Club['category'], description: string, isPremium: boolean, price: number) => {
    const newClub: Club = {
      id: Date.now().toString(),
      name,
      category,
      description,
      members: 1, // Start with 1 member (the owner)
      image: `https://picsum.photos/200/200?random=${Date.now()}`,
      ownerId: currentUser.id,
      isPremium,
      price: isPremium ? price : undefined
    };
    
    setClubs(prev => [newClub, ...prev]);
    
    // Auto join owner without incrementing member count again
    setCurrentUser(prev => ({
      ...prev,
      joinedClubs: [...prev.joinedClubs, newClub.id]
    }));

    return newClub;
  };

  const markStoryViewed = (storyId: string) => {
      setStories(prev => prev.map(s => s.id === storyId ? { ...s, viewed: true } : s));
  };

  const awardXP = (amount: number) => {
      setCurrentUser(prev => ({
          ...prev,
          xp: prev.xp + amount
      }));
  };

  // --- AUDIO ROOM ACTIONS ---

  const createRoom = (clubId: string, title: string, topic: string) => {
      const club = clubs.find(c => c.id === clubId);
      if (!club) return;

      const newRoom: AudioRoom = {
          id: Date.now().toString(),
          clubId,
          clubName: club.name,
          clubImage: club.image,
          title,
          topic,
          hostId: currentUser.id,
          startedAt: 'Just Now',
          listenerCount: 1,
          status: 'LIVE',
          relatedTickers: [], // could be parsed from title
          speakers: [
              { id: currentUser.id, userId: currentUser.id, user: currentUser, role: 'HOST', isMuted: false, isSpeaking: false, isHandRaised: false }
          ]
      };

      setAvailableRooms(prev => [newRoom, ...prev]);
      // Auto join the creator
      setActiveRoom(newRoom);
      setIsRoomMinimized(false);
  };

  const joinRoom = (room: AudioRoom) => {
      // Security Check: Must be a member of the club
      if (!currentUser.joinedClubs.includes(room.clubId)) {
          alert(`You must join ${room.clubName} to enter this room.`);
          return;
      }

      // Check if room is still live
      if (room.status === 'ENDED') {
          alert("This session has ended.");
          return;
      }

      // Leave current room if any
      if (activeRoom) leaveRoom();

      // Simulate adding current user as a listener
      const meAsListener: AudioRoomSpeaker = {
          id: 'me',
          userId: currentUser.id,
          user: currentUser,
          role: 'LISTENER',
          isMuted: true,
          isSpeaking: false,
          isHandRaised: false
      };
      
      // Update local view of the room (in real app, this is server synced)
      const updatedRoom = { 
          ...room, 
          speakers: [...room.speakers, meAsListener],
          listenerCount: room.listenerCount + 1
      };
      
      setActiveRoom(updatedRoom);
      setIsRoomMinimized(false);
  };

  const leaveRoom = () => {
      setActiveRoom(null);
      setIsRoomMinimized(false);
  };

  const endRoom = (roomId: string) => {
      setAvailableRooms(prev => prev.filter(r => r.id !== roomId));
      if (activeRoom?.id === roomId) {
          setActiveRoom(null);
          setIsRoomMinimized(false);
      }
      // Send notification or update UI for others via socket in real app
  };

  const minimizeRoom = () => setIsRoomMinimized(true);
  const maximizeRoom = () => setIsRoomMinimized(false);


  return (
    <AppContext.Provider value={{ 
      theme, toggleTheme,
      currentUser, posts, clubs, stories, scheduledAlerts, 
      activeRoom, availableRooms, isRoomMinimized,
      isPaymentModalOpen, paymentTrigger, openPaymentModal, closePaymentModal, upgradeToPro,
      isDemoOpen, openDemo, closeDemo,
      switchUser, updateUserProfile, addPost, addStory, addComment, toggleLike, voteSentiment, joinClub, leaveClub, createClub, markStoryViewed, awardXP,
      scheduleAlert, cancelAlert,
      createRoom, joinRoom, leaveRoom, endRoom, minimizeRoom, maximizeRoom
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
