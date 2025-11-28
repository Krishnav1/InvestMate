
import React from 'react';
import { User, getDominantRankStyle } from '../types';
import { Flame, Zap, ShieldCheck, BookOpen } from 'lucide-react';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 'md', showBadge = false, className = '' }) => {
  const rankStyle = getDominantRankStyle(user);
  
  let sizeClass = 'w-10 h-10';
  let badgeSize = 'w-3.5 h-3.5';
  
  if (size === 'sm') { sizeClass = 'w-8 h-8'; badgeSize = 'w-3 h-3'; }
  if (size === 'lg') { sizeClass = 'w-14 h-14'; badgeSize = 'w-5 h-5'; }
  if (size === 'xl') { sizeClass = 'w-24 h-24'; badgeSize = 'w-6 h-6'; }

  const getRankIcon = () => {
     if (!user.guruStats) return null;
     if (user.guruStats.isTrending) return <Flame className="w-full h-full text-white fill-current" />;
     if (['Super', 'Mega'].includes(user.guruStats.communityRank)) return <Zap className="w-full h-full text-white fill-current" />;
     if (user.guruStats.educationBadge) return <BookOpen className="w-full h-full text-white" />;
     if (user.guruStats.isTrusted) return <ShieldCheck className="w-full h-full text-white" />;
     return null;
  };

  const badgeIcon = getRankIcon();
  const badgeColor = user.guruStats?.isTrending ? 'bg-pink-500' : 
                     ['Super', 'Mega'].includes(user.guruStats?.communityRank || '') ? 'bg-yellow-500' :
                     user.guruStats?.educationBadge ? 'bg-purple-500' : 
                     user.guruStats?.isTrusted ? 'bg-green-500' : 'hidden';

  return (
    <div className={`relative inline-block ${className}`}>
      <img 
        src={user.avatar} 
        alt={user.name} 
        className={`${sizeClass} rounded-full object-cover border-2 ${rankStyle} p-0.5`} 
      />
      {showBadge && badgeIcon && (
          <div className={`absolute -bottom-0.5 -right-0.5 ${badgeSize} rounded-full ${badgeColor} p-0.5 flex items-center justify-center border-2 border-white dark:border-black shadow-sm`}>
              {badgeIcon}
          </div>
      )}
    </div>
  );
};

export default Avatar;
