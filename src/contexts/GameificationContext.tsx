import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserAchievement {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  progress?: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalCredits: number;
  totalProjects: number;
  badgesEarned: number;
  rank: number;
  score: number;
}

interface GameificationContextType {
  badges: Badge[];
  userAchievements: UserAchievement[];
  leaderboard: LeaderboardEntry[];
  getUserBadges: (userId: string) => Badge[];
  awardBadge: (userId: string, badgeId: string) => void;
  calculateUserScore: (userId: string) => number;
  getLeaderboard: () => LeaderboardEntry[];
  checkAndAwardBadges: (userId: string) => Badge[];
}

const GameificationContext = createContext<GameificationContextType | undefined>(undefined);

export const useGameification = () => {
  const context = useContext(GameificationContext);
  if (context === undefined) {
    throw new Error('useGameification must be used within a GameificationProvider');
  }
  return context;
};

export const GameificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Initialize badges
    const storedBadges = localStorage.getItem('bluecarbon_badges');
    if (!storedBadges) {
      const defaultBadges: Badge[] = [
        {
          id: 'first_project',
          name: '🌱 First Seedling',
          description: 'Upload your first restoration project',
          icon: '🌱',
          condition: 'Upload 1 project',
          rarity: 'common',
        },
        {
          id: 'mangrove_guardian',
          name: '🌿 Mangrove Guardian',
          description: 'Plant 1000+ mangrove trees',
          icon: '🌿',
          condition: 'Plant 1000 trees',
          rarity: 'rare',
        },
        {
          id: 'carbon_hero',
          name: '🌍 Carbon Hero',
          description: 'Sequester 500+ tons of CO₂',
          icon: '🌍',
          condition: 'Sequester 500 tons CO₂',
          rarity: 'epic',
        },
        {
          id: 'ocean_protector',
          name: '🐠 Ocean Protector',
          description: 'Complete 5 verified projects',
          icon: '🐠',
          condition: 'Complete 5 projects',
          rarity: 'rare',
        },
        {
          id: 'blue_carbon_master',
          name: '👑 Blue Carbon Master',
          description: 'Generate 10,000+ carbon credits',
          icon: '👑',
          condition: 'Generate 10,000 credits',
          rarity: 'legendary',
        },
        {
          id: 'community_leader',
          name: '🤝 Community Leader',
          description: 'Get 100+ upvotes on forum posts',
          icon: '🤝',
          condition: '100 forum upvotes',
          rarity: 'rare',
        },
        {
          id: 'data_pioneer',
          name: '📊 Data Pioneer',
          description: 'Upload 50+ IoT sensor readings',
          icon: '📊',
          condition: '50 IoT readings',
          rarity: 'common',
        },
        {
          id: 'marketplace_trader',
          name: '💰 Marketplace Trader',
          description: 'Complete 10 credit transactions',
          icon: '💰',
          condition: '10 transactions',
          rarity: 'rare',
        }
      ];
      localStorage.setItem('bluecarbon_badges', JSON.stringify(defaultBadges));
      setBadges(defaultBadges);
    } else {
      setBadges(JSON.parse(storedBadges));
    }

    // Load achievements
    const storedAchievements = localStorage.getItem('bluecarbon_achievements');
    if (storedAchievements) {
      setUserAchievements(JSON.parse(storedAchievements));
    }
  }, []);

  const getUserBadges = (userId: string): Badge[] => {
    const userAchievementIds = userAchievements
      .filter(achievement => achievement.userId === userId)
      .map(achievement => achievement.badgeId);
    
    return badges.filter(badge => userAchievementIds.includes(badge.id));
  };

  const awardBadge = (userId: string, badgeId: string) => {
    // Check if user already has this badge
    const existingAchievement = userAchievements.find(
      achievement => achievement.userId === userId && achievement.badgeId === badgeId
    );

    if (!existingAchievement) {
      const newAchievement: UserAchievement = {
        id: Date.now().toString(),
        userId,
        badgeId,
        earnedAt: new Date().toISOString(),
      };

      const updatedAchievements = [...userAchievements, newAchievement];
      setUserAchievements(updatedAchievements);
      localStorage.setItem('bluecarbon_achievements', JSON.stringify(updatedAchievements));
    }
  };

  const calculateUserScore = (userId: string): number => {
    const userBadges = getUserBadges(userId);
    const rarityPoints = {
      common: 10,
      rare: 25,
      epic: 50,
      legendary: 100,
    };

    return userBadges.reduce((score, badge) => score + rarityPoints[badge.rarity], 0);
  };

  const checkAndAwardBadges = (userId: string): Badge[] => {
    // This would integrate with other contexts to check conditions
    // For now, return empty array - implement with actual data checks
    return [];
  };

  const getLeaderboard = (): LeaderboardEntry[] => {
    // This would calculate from actual user data
    // For now, return sample data
    return [
      {
        userId: '2',
        username: 'GreenEarth NGO',
        totalCredits: 15000,
        totalProjects: 8,
        badgesEarned: 5,
        rank: 1,
        score: 185,
      },
      {
        userId: '1',
        username: 'admin',
        totalCredits: 5000,
        totalProjects: 3,
        badgesEarned: 3,
        rank: 2,
        score: 85,
      },
    ];
  };

  return (
    <GameificationContext.Provider
      value={{
        badges,
        userAchievements,
        leaderboard,
        getUserBadges,
        awardBadge,
        calculateUserScore,
        getLeaderboard,
        checkAndAwardBadges,
      }}
    >
      {children}
    </GameificationContext.Provider>
  );
};