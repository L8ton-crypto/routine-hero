// Badge definitions copied from ChoreQuest
export const BADGE_DEFINITIONS: Record<
  string,
  { name: string; icon: string; description: string }
> = {
  first_quest: {
    name: "First Quest",
    icon: "🌟",
    description: "Complete your first routine",
  },
  hot_streak: {
    name: "Hot Streak",
    icon: "🔥",
    description: "Complete routines 3 days in a row",
  },
  speed_runner: {
    name: "Speed Runner",
    icon: "⚡",
    description: "Complete 5 routines in one day",
  },
  level_5: {
    name: "Level 5",
    icon: "👑",
    description: "Reach level 5",
  },
  champion: {
    name: "Champion",
    icon: "🏆",
    description: "Reach level 10",
  },
  quest_master: {
    name: "Quest Master",
    icon: "🎯",
    description: "Complete 50 routines total",
  },
  collector: {
    name: "Collector",
    icon: "💎",
    description: "Earn all badge types",
  },
  helper: {
    name: "Helper",
    icon: "🤝",
    description: "Complete 10 routines",
  },
};

// Interfaces for the new features
export interface Badge {
  id: number;
  child_id: number;
  badge_type: string;
  earned_at: string;
}

export interface Reward {
  id: string;
  family_id: number;
  title: string;
  description: string;
  xp_cost: number;
  icon: string;
  created_at: string;
}

export interface RewardClaim {
  id: string;
  reward_id: string;
  child_id: number;
  claimed_at: string;
  // Joined fields from API
  reward_title?: string;
  reward_icon?: string;
  child_name?: string;
  child_avatar?: string;
}