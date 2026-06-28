export interface CommunityPost {
  id: string;
  posterName: string;
  posterAvatar: string;
  achievementType: string;
  content: string;
  timestamp: string;
  privacy: 'Public' | 'Friends Only' | 'Private';
  reactions: {
    celebrate: number;
    niceWork: number;
    inspiredMe: number;
    greatProgress: number;
    keepGoing: number;
  };
  commentsDisabled: boolean;
  comments: {
    id: string;
    commenter: string;
    commenterAvatar: string;
    text: string;
    timestamp: string;
  }[];
  isUserPost?: boolean;
}

export interface ChallengeItem {
  id: string;
  title: string;
  category: 'weekly' | 'monthly' | 'debt' | 'savings';
  description: string;
  target: string;
  rewardPoints: number;
  joined: boolean;
  progress: number;
  daysLeft: number;
  checkinsCount: number;
}

export interface SeasonalEvent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  rewardBadges: string[];
  rewardXp: number;
  duration: string;
  requirements: string;
  progressLabel: string;
  status: 'active' | 'upcoming';
  currentProgress?: number;
  targetProgress?: number;
}

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requirement: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  colorTheme: string; // e.g. 'emerald', 'amber', 'rose', 'blue', 'violet', 'gold'
  category: 'Debt' | 'Savings' | 'Community' | 'Consistency' | 'Money' | 'Holiday';
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  goalsCompleted: number;
  challengesFinished: number;
  monthlyXp: number;
  title: string;
  isUser?: boolean;
}

export const INITIAL_TITLES = [
  { name: 'Money Starter', reqLevel: 1 },
  { name: 'Budget Builder', reqLevel: 3 },
  { name: 'Smart Saver', reqLevel: 5 },
  { name: 'Debt Crusher', reqLevel: 8 },
  { name: 'Money Manager', reqLevel: 11 },
  { name: 'Financial Builder', reqLevel: 14 },
  { name: 'Financial Planner', reqLevel: 15 },
  { name: 'Goal Chaser', reqLevel: 20 },
  { name: 'Freedom Builder', reqLevel: 25 },
  { name: 'Future Planner', reqLevel: 30 },
  { name: 'Money Master', reqLevel: 40 },
  { name: 'Financial Mentor', reqLevel: 50 },
  { name: 'Freedom Champion', reqLevel: 60 },
];

export const BADGES_LIST: BadgeDef[] = [
  // --- DEBT CATEGORY ---
  {
    id: 'first_debt',
    name: 'First Debt Paid',
    emoji: '👾',
    description: 'Broke the compounding teeth of a high-APR credit card or bill beast.',
    requirement: 'Bring one active account debt balance to $0',
    rarity: 'Common',
    colorTheme: 'rose',
    category: 'Debt'
  },
  {
    id: 'debt_crusher',
    name: 'Debt Crusher',
    emoji: '⚔️',
    description: 'Destroyed a major chunk of compound interest liabilities ahead of time.',
    requirement: 'Successfully crush $5,000+ of high-interest debt principal',
    rarity: 'Rare',
    colorTheme: 'rose',
    category: 'Debt'
  },
  {
    id: 'debt_free',
    name: 'Debt Free',
    emoji: '👑',
    description: 'Unlocked complete sovereign rule over 100% of your incoming paycheck pay.',
    requirement: 'Settle and clear all high-APR debts in your matrix',
    rarity: 'Legendary',
    colorTheme: 'gold',
    category: 'Debt'
  },

  // --- SAVINGS CATEGORY ---
  {
    id: 'buffer_complete',
    name: 'Buffer Fund Filled',
    emoji: '🛟',
    description: 'Established the ultimate peace-of-mind wall against unexpected hits.',
    requirement: 'Reach target safety net reserves of $1,000+',
    rarity: 'Common',
    colorTheme: 'emerald',
    category: 'Savings'
  },
  {
    id: 'vacation_ready',
    name: 'Vacation Ready',
    emoji: '🏖️',
    description: 'Fully pre-funded a leisure getaway without leaving any toxic debt debt-trail.',
    requirement: 'Complete a vacation or travel goal ahead of schedule',
    rarity: 'Rare',
    colorTheme: 'amber',
    category: 'Savings'
  },
  {
    id: 'goal_crusher',
    name: 'Goal Master',
    emoji: '🎯',
    description: 'Consistently locking in savings like an unstoppable machine.',
    requirement: 'Complete 3 or more savings goals successfully',
    rarity: 'Epic',
    colorTheme: 'blue',
    category: 'Savings'
  },
  {
    id: 'challenge_winner',
    name: 'Challenge Winner',
    emoji: '🏅',
    description: 'Rallied and completed a personal savings challenge with clean execution.',
    requirement: 'Succeed in any weekly or monthly challenge',
    rarity: 'Common',
    colorTheme: 'amber',
    category: 'Savings'
  },

  // --- COMMUNITY CATEGORY ---
  {
    id: 'community_helper',
    name: 'Helpful Member',
    emoji: '🤝',
    description: 'Offered positive encouragement to help others stay motivated.',
    requirement: 'Write 5 or more supportive comments or reactions',
    rarity: 'Common',
    colorTheme: 'emerald',
    category: 'Community'
  },
  {
    id: 'first_post',
    name: 'First Post',
    emoji: '📝',
    description: 'Shared your first milestone or celebration on the Feed to inspire peers.',
    requirement: 'Share your first milestone on the community feed',
    rarity: 'Common',
    colorTheme: 'blue',
    category: 'Community'
  },
  {
    id: 'most_celebrated',
    name: 'Most Celebrated',
    emoji: '✨',
    description: 'Stirred up positive motivation and received dozens of supportive reactions.',
    requirement: 'Receive 25+ combined reactions on your posts',
    rarity: 'Epic',
    colorTheme: 'violet',
    category: 'Community'
  },
  {
    id: 'challenge_champion',
    name: 'Challenge Champion',
    emoji: '🏆',
    description: 'Achieved ultimate progress by completing and conquering active community events.',
    requirement: 'Finish first on the monthly challenges log',
    rarity: 'Legendary',
    colorTheme: 'gold',
    category: 'Community'
  },

  // --- CONSISTENCY CATEGORY ---
  {
    id: 'streak_7',
    name: '7-Day Streak',
    emoji: '⚡',
    description: 'Stayed connected to your goals for one week straight without missing a check-in.',
    requirement: 'Maintain active financial check-ins streak for 7 days',
    rarity: 'Common',
    colorTheme: 'amber',
    category: 'Consistency'
  },
  {
    id: 'streak_30',
    name: '30-Day Streak',
    emoji: '🔥',
    description: 'Sustained bulletproof daily tracking and financial oversight for a full month.',
    requirement: 'Maintain active financial check-ins streak for 30 days',
    rarity: 'Rare',
    colorTheme: 'violet',
    category: 'Consistency'
  },
  {
    id: 'streak_100',
    name: '100-Day Streak',
    emoji: '💥',
    description: 'Consistent, bulletproof habit monitoring for one hundred days straight.',
    requirement: 'Maintain active financial check-ins streak for 100 days',
    rarity: 'Legendary',
    colorTheme: 'gold',
    category: 'Consistency'
  },

  // --- MONEY CATEGORY ---
  {
    id: 'budget_master',
    name: 'Budget Master',
    emoji: '📊',
    description: 'Kept overall discretionary spend entirely in boundaries for 30 consecutive days.',
    requirement: 'Stay completely under monthly spending limit',
    rarity: 'Rare',
    colorTheme: 'emerald',
    category: 'Money'
  },
  {
    id: 'smart_saver',
    name: 'Smart Saver',
    emoji: '🚀',
    description: 'Redirected substantial funds directly into high-yield zones.',
    requirement: 'Save 30% or more of your monthly income',
    rarity: 'Epic',
    colorTheme: 'blue',
    category: 'Money'
  },
  {
    id: 'financial_planner',
    name: 'Financial Planner',
    emoji: '📅',
    description: 'Constructed detailed pathways to escape cash-flow traps.',
    requirement: 'Build a comprehensive 12-month budget roadmap',
    rarity: 'Rare',
    colorTheme: 'violet',
    category: 'Money'
  },
  {
    id: 'financial_mentor',
    name: 'Money Mentor',
    emoji: '🧠',
    description: 'An enlightened beacon of financial wisdom within the command center.',
    requirement: 'Unlock Level 30 or guide friends with custom tips',
    rarity: 'Epic',
    colorTheme: 'violet',
    category: 'Money'
  },

  // --- HOLIDAY CATEGORY ---
  {
    id: 'holiday_saver',
    name: 'Holiday Saver',
    emoji: '❄️',
    description: 'Survived the gift-giving season without accumulating toxic credit lines.',
    requirement: 'Sustain holiday budgets without taking on new debt',
    rarity: 'Rare',
    colorTheme: 'blue',
    category: 'Holiday'
  },
  {
    id: 'summer_saver',
    name: 'Summer Saver',
    emoji: '☀️',
    description: 'Kept savings targets hot while taking clean summer getaways.',
    requirement: 'Hit all your summer saving goals during high-travel months',
    rarity: 'Common',
    colorTheme: 'amber',
    category: 'Holiday'
  },
  {
    id: 'no_spend_champ',
    name: 'No-Spend Champion',
    emoji: '🛡️',
    description: 'Maintained total discipline by zeroing out non-essential discretionary buys.',
    requirement: 'Complete a full 30-day no-spend sprint',
    rarity: 'Epic',
    colorTheme: 'emerald',
    category: 'Holiday'
  }
];

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    posterName: 'Sarah Jenkins',
    posterAvatar: 'Sarah_Jenkins',
    achievementType: 'Paid Off Debt 👾',
    content: 'Just paid off my QuickSilver card today! One less monthly payment and high APR liability to worry about. The cascade is working!',
    timestamp: '2 hours ago',
    privacy: 'Public',
    reactions: { celebrate: 12, niceWork: 8, inspiredMe: 5, greatProgress: 4, keepGoing: 9 },
    commentsDisabled: false,
    comments: [
      {
        id: 'c-1',
        commenter: 'Marcus Vance',
        commenterAvatar: 'Marcus_Vance',
        text: 'Incredible milestone! That APR was massive, getting that to $0 is an absolute power move!',
        timestamp: '1 hour ago'
      },
      {
        id: 'c-2',
        commenter: 'Sophia Chen',
        commenterAvatar: 'Sophia_Chen',
        text: 'This inspires me so much to finish paying off my retail cards. Huge congrats! 🎉',
        timestamp: '30 mins ago'
      }
    ]
  },
  {
    id: 'post-2',
    posterName: 'Marcus Vance',
    posterAvatar: 'Marcus_Vance',
    achievementType: 'Reached Savings Goal 🎯',
    content: 'My Escape Fund just passed the $2,000 threshold today! Officially ready to lock in autumn trip flights without tapping credit lines.',
    timestamp: 'Yesterday',
    privacy: 'Public',
    reactions: { celebrate: 9, niceWork: 14, inspiredMe: 7, greatProgress: 11, keepGoing: 5 },
    commentsDisabled: false,
    comments: [
      {
        id: 'c-3',
        commenter: 'Emily Stone',
        commenterAvatar: 'Emily_Stone',
        text: 'Having a vacation fully pre-funded is the ultimate stress-free holiday. Enjoy it!',
        timestamp: 'Yesterday'
      }
    ]
  },
  {
    id: 'post-3',
    posterName: 'Elena Rostova',
    posterAvatar: 'Elena_Rostova',
    achievementType: 'Stayed Within Spending Plan 💳',
    content: 'Audit complete: Stayed completely under my dining out and luxury shopping budgets for the entire month! Redirected the $180 buffer directly into my Safety Net.',
    timestamp: '2 days ago',
    privacy: 'Public',
    reactions: { celebrate: 15, niceWork: 10, inspiredMe: 6, greatProgress: 8, keepGoing: 12 },
    commentsDisabled: false,
    comments: []
  }
];

export const INITIAL_CHALLENGES: ChallengeItem[] = [
  {
    id: 'chal-1',
    title: 'No Spend Weekend',
    category: 'weekly',
    description: 'Settle all dining, leisure, and shopping costs to $0 between Friday 6pm and Sunday night. Rely on pantry meals and free local parks.',
    target: 'Save estimated $65',
    rewardPoints: 150,
    joined: false,
    progress: 0,
    daysLeft: 2,
    checkinsCount: 0
  },
  {
    id: 'chal-2',
    title: 'Coffee & Sub Sprint',
    category: 'weekly',
    description: 'Skip premium cafe spending and cancel or pause one minor unused subscription this week. Redirect the excess cash immediately into your Emergency Cushion.',
    target: 'Save estimated $35',
    rewardPoints: 100,
    joined: false,
    progress: 0,
    daysLeft: 4,
    checkinsCount: 0
  },
  {
    id: 'chal-3',
    title: 'Emergency Cushion Buildout',
    category: 'monthly',
    description: 'Stash or rebalance extra paycheck allocations until your Emergency Safety Net reaches at least $1,500.',
    target: 'Scale Emergency reserves',
    rewardPoints: 400,
    joined: false,
    progress: 25,
    daysLeft: 23,
    checkinsCount: 1
  },
  {
    id: 'chal-4',
    title: 'Digital Spare Change Round-up',
    category: 'savings',
    description: 'Log and round up checking debits or minor bills to the nearest dollar and roll the virtual spare change directly into your sequential Freedom Pool.',
    target: 'Accumulate micro savings',
    rewardPoints: 200,
    joined: false,
    progress: 0,
    daysLeft: 12,
    checkinsCount: 0
  },
  {
    id: 'chal-5',
    title: 'APR Avalanche Blitz',
    category: 'debt',
    description: 'Contribute an additional $50 payment on top of your minimum requirements to your highest interest-rate active credit card to choke off compound interest.',
    target: 'Reduce high-APR principal',
    rewardPoints: 300,
    joined: false,
    progress: 0,
    daysLeft: 15,
    checkinsCount: 0
  }
];

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'seas-1',
    title: 'No-Spend November',
    subtitle: '🍁 Settle discretionary costs to $0',
    description: 'Cut non-essential spending on weekends completely in November. Savor home cooking, read books, and redirection buffers.',
    rewardBadges: ['Monthly Budget Master'],
    rewardXp: 250,
    duration: 'Nov 1 - Nov 30',
    requirements: 'Limit discretionary shopping, dining, and coffee runs during 4 weekends.',
    progressLabel: 'Discretionary limits respected',
    status: 'upcoming'
  },
  {
    id: 'seas-2',
    title: 'Summer Vacation Challenge',
    subtitle: '🏖️ Pre-fund holiday leisure',
    description: 'Prepare a vacation escape pool ahead of time. Build a dedicated travel goal and deposit regularly to bypass using high interest credit card debt.',
    rewardBadges: ['Vacation Ready', 'Goal Crusher'],
    rewardXp: 150,
    duration: 'Jun 1 - Aug 31',
    requirements: 'Reach at least $500 in a dedicated Travel/Leisure Savings Goal.',
    progressLabel: 'Savings accumulated',
    status: 'active',
    currentProgress: 350,
    targetProgress: 500
  },
  {
    id: 'seas-3',
    title: 'Debt-Free December',
    subtitle: '❄️ Counter the holiday retail avalanche',
    description: 'Commit to boosting your debt payments by 15% during peak shopping season. Say goodbye to post-holiday credit card hangover!',
    rewardBadges: ['First Debt Paid', 'Debt Free'],
    rewardXp: 300,
    duration: 'Dec 1 - Dec 31',
    requirements: 'Contribute an additional 15% above minimum payment lines to high-APR items.',
    progressLabel: 'Holiday debt offset logged',
    status: 'upcoming'
  }
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'l-1',
    name: 'Sarah Jenkins',
    avatar: 'Sarah_Jenkins',
    streak: 18,
    goalsCompleted: 8,
    challengesFinished: 12,
    monthlyXp: 1420,
    title: 'Debt Crusher'
  },
  {
    id: 'l-2',
    name: 'Marcus Vance',
    avatar: 'Marcus_Vance',
    streak: 15,
    goalsCompleted: 6,
    challengesFinished: 9,
    monthlyXp: 1180,
    title: 'Money Manager'
  },
  {
    id: 'l-3',
    name: 'Elena Rostova',
    avatar: 'Elena_Rostova',
    streak: 12,
    goalsCompleted: 5,
    challengesFinished: 7,
    monthlyXp: 950,
    title: 'Smart Saver'
  },
  {
    id: 'l-4',
    name: 'Sophia Chen',
    avatar: 'Sophia_Chen',
    streak: 10,
    goalsCompleted: 4,
    challengesFinished: 5,
    monthlyXp: 820,
    title: 'Budget Builder'
  }
];

export const SUCCESS_STORIES = [
  {
    author: 'Elena Rostova',
    quote: 'The visual Debt Boss fights completely changed how I look at payments. I managed to crush my retail lines 4 months early!',
    badge: '🏆 Debt Survivor'
  },
  {
    author: 'Marcus Vance',
    quote: 'Locking down the $1,000 Safety Net gave me the sleep confidence I haven\'t felt in a decade. I\'m pre-funding travel now!',
    badge: '🛟 Secure Cushion'
  },
  {
    author: 'Sarah Jenkins',
    quote: 'Doing No-Spend Weekends with Sophia and Marcus turned an otherwise boring chore into a funny competition. Highly recommended!',
    badge: '🌱 Habit Master'
  }
];

export const HELP_TIPS = [
  {
    title: 'Create an emergency barrier before snowballing',
    text: 'Before dumping every spare dollar into high interest debts, build an emergency buffer ($500 to $1,000). This protects your snowball plan if an unexpected cost hits.'
  },
  {
    title: 'The power of rounding up daily micro payments',
    text: 'Consistently rounding up your micro check-ins and redirecting them immediately simulates digital cash round-ups. Over a year, this can buy a holiday trip fund!'
  },
  {
    title: 'Automate savings on day one of your paycheck',
    text: 'Pay yourself first! Reallocate buffers into your savings lockbox immediately when income hits, rather than trying to save what remains at the end of the month.'
  }
];
