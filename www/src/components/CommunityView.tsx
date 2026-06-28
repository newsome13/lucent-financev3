import { useState, useEffect, FormEvent } from 'react';
import {
  Users,
  Share2,
  MessageSquare,
  Lock,
  Globe,
  Sparkles,
  Trophy,
  CheckCircle2,
  Award,
  Plus,
  Send,
  ThumbsUp,
  Smile,
  TrendingUp,
  ShieldCheck,
  X,
  Flame,
  Compass,
  ArrowRight,
  AlertCircle,
  Star,
  Zap,
  Calendar,
  ChevronRight,
  Info,
  Heart,
  SmilePlus,
  Pin,
  Clock,
  Check,
  Bookmark,
  TrendingDown,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, Debt, Goal, PaymentHistoryItem } from '../types';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { 
  saveCommunityProfileToFirestore, 
  fetchLiveCommunityPosts, 
  createLiveCommunityPost, 
  likeLiveCommunityPost 
} from '../lib/firestoreSync';

import {
  CommunityPost,
  ChallengeItem,
  SeasonalEvent,
  BadgeDef,
  LeaderboardEntry,
  INITIAL_TITLES,
  BADGES_LIST,
  INITIAL_POSTS,
  INITIAL_CHALLENGES,
  SEASONAL_EVENTS,
  MOCK_LEADERBOARD,
  SUCCESS_STORIES,
  HELP_TIPS
} from '../data/communityData';

import UserAvatar, { 
  getDeterministicAvatarConfig, 
  AvatarConfig 
} from './UserAvatar';
import AvatarCustomizer from './AvatarCustomizer';
import UserProfileModal, { UserProfileData } from './UserProfileModal';

interface CommunityViewProps {
  accounts: Account[];
  debts: Debt[];
  goals: Goal[];
  history: PaymentHistoryItem[];
  user: User | null;
  showActualName?: boolean;
}

interface FloatingToast {
  id: string;
  message: string;
  xp?: number;
}

const PREMIUM_AVATARS = [
  'Premium_Preset_Sarah',
  'Premium_Preset_Marcus',
  'Premium_Preset_Elena',
  'Premium_Preset_Sophia',
  'Premium_Preset_Danny',
  'Premium_Preset_Claire'
];

const FRIENDLY_PROMPTS = [
  "What financial win are you celebrating today?",
  "Share your latest milestone.",
  "Inspire someone with your progress.",
  "What habit are you reinforcing today?"
];

export default function CommunityView({
  accounts,
  debts,
  goals,
  history,
  user,
  showActualName = false
}: CommunityViewProps) {
  // --- OPT-IN GATE ---
  const [isOptedIn, setIsOptedIn] = useState<boolean>(() => {
    return localStorage.getItem('finance_community_opt_in') === 'true';
  });

  const [showJoinProfileWizard, setShowJoinProfileWizard] = useState(false);
  const [wizardUsername, setWizardUsername] = useState(() => {
    return localStorage.getItem('finance_community_username') || '';
  });
  const [wizardAvatarIndex, setWizardAvatarIndex] = useState(() => {
    return Number(localStorage.getItem('finance_avatar_idx') || '0');
  });
  const [customUsername, setCustomUsername] = useState(() => {
    return localStorage.getItem('finance_community_username') || '';
  });

  // --- TOP SEGMENTED NAVIGATION TABS ---
  // Tabs: Feed, Challenges, Achievements, Leaderboard, Profile
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'achievements' | 'leaderboard' | 'profile'>('feed');

  // --- XP & LEVELING STATE ---
  const [level, setLevel] = useState<number>(() => Number(localStorage.getItem('finance_xp_level') || '18'));
  const [xp, setXp] = useState<number>(() => Number(localStorage.getItem('finance_xp_current') || '1245'));
  const [lifetimeXp, setLifetimeXp] = useState<number>(() => Number(localStorage.getItem('finance_xp_lifetime') || '18245'));
  const [weeklyXp, setWeeklyXp] = useState<number>(() => Number(localStorage.getItem('finance_xp_weekly') || '180'));
  const [monthlyXp, setMonthlyXp] = useState<number>(() => Number(localStorage.getItem('finance_xp_monthly') || '540'));
  
  const [selectedTitle, setSelectedTitle] = useState<string>(() => localStorage.getItem('finance_selected_title') || 'Financial Builder');
  const [unlockedTitles, setUnlockedTitles] = useState<string[]>(() => {
    const cached = localStorage.getItem('finance_unlocked_titles');
    return cached ? JSON.parse(cached) : ['Money Starter', 'Budget Builder', 'Smart Saver', 'Debt Crusher', 'Money Manager', 'Financial Builder'];
  });

  const [streakCount, setStreakCount] = useState<number>(() => Number(localStorage.getItem('finance_streak_count') || '12'));
  const [streakCheckins, setStreakCheckins] = useState<{ [key: string]: boolean }>(() => {
    const cached = localStorage.getItem('finance_streak_checkins');
    return cached ? JSON.parse(cached) : {
      dailyCheckin: true,
      weeklyBudget: false,
      monthlyGoal: true,
      debtPayment: false,
      savingsContribution: false,
    };
  });

  const [earnedBadges, setEarnedBadges] = useState<string[]>(() => {
    const cached = localStorage.getItem('finance_earned_badges');
    return cached ? JSON.parse(cached) : ['first_debt', 'buffer_complete', 'vacation_ready', 'streak_7', 'first_post'];
  });

  const [pinnedBadges, setPinnedBadges] = useState<string[]>(() => {
    const cached = localStorage.getItem('finance_pinned_badges');
    return cached ? JSON.parse(cached) : ['first_debt', 'buffer_complete', 'vacation_ready'];
  });

  const [claimedXpMilestones, setClaimedXpMilestones] = useState<string[]>(() => {
    const cached = localStorage.getItem('finance_claimed_xp_milestones');
    return cached ? JSON.parse(cached) : [];
  });

  const [socialXpToday, setSocialXpToday] = useState<number>(() => Number(localStorage.getItem('finance_social_xp_today') || '12'));
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    const cached = localStorage.getItem('finance_avatar_config');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    // Fallback: Use deterministic illustration based on name
    const initialName = customUsername || (showActualName && user?.displayName ? user.displayName : 'Chief Commander');
    return getDeterministicAvatarConfig(initialName);
  });
  const [toasts, setToasts] = useState<FloatingToast[]>([]);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ oldLevel: number; newLevel: number; title: string }>({ oldLevel: 18, newLevel: 18, title: 'Financial Builder' });
  const [levelUpAnim, setLevelUpAnim] = useState(false);

  // --- DETAILED GAMING PROFILE DIALOG ---
  const [selectedProfile, setSelectedProfile] = useState<UserProfileData | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // --- TAB STATE: FEED ---
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [postContent, setPostContent] = useState('');
  const [postAchievementType, setPostAchievementType] = useState('Custom Update');
  const [postBadgeId, setPostBadgeId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [expandedComments, setExpandedComments] = useState<{ [postId: string]: boolean }>({});
  const [followedUsers, setFollowedUsers] = useState<string[]>(['Sarah Jenkins']);

  // --- TAB STATE: CHALLENGES ---
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<string[]>(() => {
    const cached = localStorage.getItem('finance_joined_seasonal_events');
    return cached ? JSON.parse(cached) : ['seas-2'];
  });

  // --- TAB STATE: LEADERBOARD ---
  const [leaderboardOptIn, setLeaderboardOptIn] = useState<boolean>(() => localStorage.getItem('finance_leaderboard_opt_in') !== 'false');
  const [leaderboardCategory, setLeaderboardCategory] = useState<'xp' | 'streak' | 'goals' | 'challenges'>('xp');

  // --- OTHER ---
  const currentUserAvatar = JSON.stringify(avatarConfig);
  const currentUserName = customUsername || (showActualName && user?.displayName ? user.displayName : 'Chief Commander');

  const getXPForLevel = (lvl: number) => lvl * 100 + 100;

  const handleViewProfile = (name: string, title?: string, avatar?: string, levelVal?: number, streakVal?: number, xpVal?: number) => {
    if (name === currentUserName) {
      const profile: UserProfileData = {
        id: 'user',
        name: currentUserName,
        avatar: avatarConfig,
        title: selectedTitle,
        level: level,
        xp: xp,
        maxXp: getXPForLevel(level),
        streak: streakCount,
        featuredBadges: pinnedBadges.map(badgeName => {
          const found = BADGES_LIST.find(b => b.name === badgeName);
          return {
            name: badgeName,
            emoji: found?.emoji || '🏆',
            rarity: found?.rarity || 'Common',
            color: 'text-indigo-400'
          };
        }),
        recentAchievements: earnedBadges.slice(0, 3).map(badge => ({
          text: `Earned "${badge.name}"`,
          date: badge.date || 'Recent',
          category: 'badge',
          xp: 250
        })),
        isUser: true
      };
      setSelectedProfile(profile);
      setIsProfileModalOpen(true);
      return;
    }

    const mockMembers: Record<string, Partial<UserProfileData>> = {
      'Sarah Jenkins': {
        title: 'Debt Crusher',
        level: 18,
        streak: 18,
        xp: 1420,
        maxXp: 2500,
        featuredBadges: [
          { name: 'Debt Crusher', emoji: '⚔️', rarity: 'Epic', color: 'text-purple-400' },
          { name: 'Streak Hero', emoji: '🔥', rarity: 'Rare', color: 'text-amber-400' }
        ],
        recentAchievements: [
          { text: 'Crushed Credit Line Interest APR', date: '2 days ago', category: 'debt', xp: 500 },
          { text: 'Logged Daily Budget Margin', date: '3 days ago', category: 'budget', xp: 150 }
        ]
      },
      'Marcus Vance': {
        title: 'Money Manager',
        level: 15,
        streak: 15,
        xp: 1180,
        maxXp: 2000,
        featuredBadges: [
          { name: 'Secure Cushion', emoji: '🛟', rarity: 'Rare', color: 'text-indigo-400' }
        ],
        recentAchievements: [
          { text: 'Filled $1,000 Emergency Fund', date: '4 days ago', category: 'goals', xp: 400 },
          { text: 'Check-in consistency streak', date: '5 days ago', category: 'streak', xp: 100 }
        ]
      },
      'Elena Rostova': {
        title: 'Smart Saver',
        level: 14,
        streak: 12,
        xp: 950,
        maxXp: 1800,
        featuredBadges: [
          { name: 'Saver Pro', emoji: '💰', rarity: 'Rare', color: 'text-emerald-400' }
        ],
        recentAchievements: [
          { text: 'Contributed 20% Discretionary Savings', date: '1 week ago', category: 'budget', xp: 300 }
        ]
      },
      'Sophia Chen': {
        title: 'Budget Builder',
        level: 10,
        streak: 10,
        xp: 820,
        maxXp: 1500,
        featuredBadges: [
          { name: 'Budget Builder', emoji: '🧱', rarity: 'Common', color: 'text-slate-400' }
        ],
        recentAchievements: [
          { text: 'Unlocked Level 10 Badge', date: '5 days ago', category: 'level', xp: 150 }
        ]
      },
      'Danny Cole': {
        title: 'Debt Crusher',
        level: 12,
        streak: 8,
        xp: 750,
        maxXp: 1600,
        featuredBadges: [
          { name: 'Debt Crusher', emoji: '⚔️', rarity: 'Epic', color: 'text-purple-400' }
        ],
        recentAchievements: [
          { text: 'Paid off credit card balance', date: '3 days ago', category: 'debt', xp: 350 }
        ]
      },
      'Claire Zhao': {
        title: 'Smart Saver',
        level: 16,
        streak: 14,
        xp: 1150,
        maxXp: 2200,
        featuredBadges: [
          { name: 'Saver Pro', emoji: '💰', rarity: 'Rare', color: 'text-emerald-400' }
        ],
        recentAchievements: [
          { text: 'Passed Milestone Gold Target', date: '2 days ago', category: 'goals', xp: 300 }
        ]
      }
    };

    const defaults = mockMembers[name] || {
      title: title || 'Accountability Partner',
      level: levelVal || 12,
      streak: streakVal || 8,
      xp: xpVal || 600,
      maxXp: 1500,
      featuredBadges: [
        { name: 'Accountability Spark', emoji: '✨', rarity: 'Common', color: 'text-indigo-400' }
      ],
      recentAchievements: [
        { text: 'Joined accountability dashboard', date: 'Recently', category: 'social', xp: 200 }
      ]
    };

    const profile: UserProfileData = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      avatar: avatar || name,
      title: defaults.title!,
      level: defaults.level!,
      xp: defaults.xp!,
      maxXp: defaults.maxXp!,
      streak: defaults.streak!,
      featuredBadges: defaults.featuredBadges || [],
      recentAchievements: defaults.recentAchievements || [],
      isUser: false
    };

    setSelectedProfile(profile);
    setIsProfileModalOpen(true);
  };

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('finance_xp_level', level.toString());
    localStorage.setItem('finance_xp_current', xp.toString());
    localStorage.setItem('finance_xp_lifetime', lifetimeXp.toString());
    localStorage.setItem('finance_xp_weekly', weeklyXp.toString());
    localStorage.setItem('finance_xp_monthly', monthlyXp.toString());
    localStorage.setItem('finance_selected_title', selectedTitle);
    localStorage.setItem('finance_unlocked_titles', JSON.stringify(unlockedTitles));
    localStorage.setItem('finance_streak_count', streakCount.toString());
    localStorage.setItem('finance_earned_badges', JSON.stringify(earnedBadges));
    localStorage.setItem('finance_pinned_badges', JSON.stringify(pinnedBadges));
    localStorage.setItem('finance_claimed_xp_milestones', JSON.stringify(claimedXpMilestones));
    localStorage.setItem('finance_streak_checkins', JSON.stringify(streakCheckins));
    localStorage.setItem('finance_social_xp_today', socialXpToday.toString());
    localStorage.setItem('finance_avatar_config', JSON.stringify(avatarConfig));
    window.dispatchEvent(new Event('finance_avatar_changed'));
    localStorage.setItem('finance_leaderboard_opt_in', leaderboardOptIn ? 'true' : 'false');
    localStorage.setItem('finance_joined_seasonal_events', JSON.stringify(joinedEvents));
  }, [level, xp, lifetimeXp, weeklyXp, monthlyXp, selectedTitle, unlockedTitles, streakCount, earnedBadges, pinnedBadges, claimedXpMilestones, streakCheckins, socialXpToday, avatarConfig, leaderboardOptIn, joinedEvents]);

  // --- INITIAL LOADS ---
  useEffect(() => {
    const loadLivePosts = async () => {
      try {
        const livePosts = await fetchLiveCommunityPosts();
        if (livePosts && livePosts.length > 0) {
          // Format Firestore posts back to local structure if necessary
          const formatted = livePosts.map((p: any) => ({
            id: p.id,
            posterName: p.authorName,
            posterAvatar: p.authorAvatar,
            achievementType: p.achievementType,
            content: p.content,
            timestamp: p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'Just now',
            privacy: 'Public',
            reactions: { celebrate: p.likes?.length || 0, niceWork: 0, inspiredMe: 0, greatProgress: 0, keepGoing: 0 },
            commentsDisabled: false,
            comments: [],
            isUserPost: p.authorId === user?.uid
          }));
          setPosts(formatted as any);
        } else {
          const cachedPosts = localStorage.getItem('finance_community_posts_v2');
          if (cachedPosts) {
            setPosts(JSON.parse(cachedPosts));
          } else {
            setPosts(INITIAL_POSTS);
            localStorage.setItem('finance_community_posts_v2', JSON.stringify(INITIAL_POSTS));
          }
        }
      } catch (err) {
        console.error('Firestore community fetch failed, using local cache:', err);
        const cachedPosts = localStorage.getItem('finance_community_posts_v2');
        if (cachedPosts) {
          setPosts(JSON.parse(cachedPosts));
        } else {
          setPosts(INITIAL_POSTS);
        }
      }
    };

    loadLivePosts();

    const cachedChallenges = localStorage.getItem('finance_community_challenges_v2');
    if (cachedChallenges) {
      setChallenges(JSON.parse(cachedChallenges));
    } else {
      setChallenges(INITIAL_CHALLENGES);
      localStorage.setItem('finance_community_challenges_v2', JSON.stringify(INITIAL_CHALLENGES));
    }

    // Pick a random starting prompt
    setCurrentPromptIdx(Math.floor(Math.random() * FRIENDLY_PROMPTS.length));
  }, []);

  const savePostsToCache = (newPosts: CommunityPost[]) => {
    setPosts(newPosts);
    localStorage.setItem('finance_community_posts_v2', JSON.stringify(newPosts));
  };

  const saveChallengesToCache = (newChals: ChallengeItem[]) => {
    setChallenges(newChals);
    localStorage.setItem('finance_community_challenges_v2', JSON.stringify(newChals));
  };

  // --- XP ENGINE ---
  const addXP = (amount: number, reason: string, isSocial: boolean = false) => {
    if (isSocial) {
      if (socialXpToday >= 50) {
        triggerToast(`${reason} (XP limit reached for social today)`);
        return;
      }
      const remainingLimit = 50 - socialXpToday;
      const actualGrant = Math.min(amount, remainingLimit);
      if (actualGrant <= 0) return;
      setSocialXpToday(prev => prev + actualGrant);
      amount = actualGrant;
    }

    triggerToast(`+${amount} XP: ${reason}`, amount);

    let newXp = xp + amount;
    let newLevel = level;
    let currentThreshold = getXPForLevel(newLevel);
    let levelUpOccurred = false;

    while (newXp >= currentThreshold) {
      newXp -= currentThreshold;
      newLevel += 1;
      currentThreshold = getXPForLevel(newLevel);
      levelUpOccurred = true;
    }

    setXp(newXp);
    setLifetimeXp(prev => prev + amount);
    setWeeklyXp(prev => prev + amount);
    setMonthlyXp(prev => prev + amount);

    if (levelUpOccurred) {
      const newlyUnlocked: string[] = [];
      INITIAL_TITLES.forEach(t => {
        if (t.reqLevel <= newLevel && !unlockedTitles.includes(t.name)) {
          newlyUnlocked.push(t.name);
        }
      });

      if (newlyUnlocked.length > 0) {
        setUnlockedTitles(prev => [...prev, ...newlyUnlocked]);
      }

      const matchingTitle = INITIAL_TITLES.slice().reverse().find(t => t.reqLevel <= newLevel)?.name || 'Money Starter';

      setLevelUpData({
        oldLevel: level,
        newLevel: newLevel,
        title: matchingTitle
      });
      setLevel(newLevel);
      setShowLevelUpModal(true);
      setLevelUpAnim(true);
      setTimeout(() => setLevelUpAnim(false), 3000);

      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.5 }
      });
    }
  };

  // --- FLOATING TOASTS ---
  const triggerToast = (msg: string, xpAmt?: number) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message: msg, xp: xpAmt }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- STREAK CHECK-IN ---
  const handleStreakCheckin = (key: string, xpReward: number, label: string) => {
    if (streakCheckins[key]) {
      triggerToast(`Already logged consistency: ${label} today!`);
      return;
    }

    const updatedCheckins = { ...streakCheckins, [key]: true };
    setStreakCheckins(updatedCheckins);
    addXP(xpReward, `Streak Check-in: ${label}`);

    const allDone = Object.values(updatedCheckins).every(v => v === true);
    if (allDone) {
      addXP(100, 'Weekly Consistency Mastery Bonus!');
      setStreakCount(prev => prev + 1);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
      unlockBadge('streak_7');
    }
  };

  // --- BADGE REWARDS & SYSTEM ---
  const unlockBadge = (badgeId: string) => {
    if (earnedBadges.includes(badgeId)) return;
    setEarnedBadges(prev => [...prev, badgeId]);
    const badge = BADGES_LIST.find(b => b.id === badgeId);
    if (badge) {
      addXP(150, `Unlocked "${badge.name}" Badge!`);
      triggerToast(`🎉 New Badge Unlocked: ${badge.name}!`);
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.8 }
      });
    }
  };

  // --- PIN OR UNPIN BADGE ---
  const handleTogglePinBadge = (badgeId: string) => {
    if (!earnedBadges.includes(badgeId)) {
      triggerToast(`You must earn this badge first to pin it!`);
      return;
    }

    if (pinnedBadges.includes(badgeId)) {
      setPinnedBadges(prev => prev.filter(id => id !== badgeId));
      triggerToast(`Unpinned badge.`);
    } else {
      if (pinnedBadges.length >= 3) {
        triggerToast(`You can pin a maximum of 3 featured badges!`);
        return;
      }
      setPinnedBadges(prev => [...prev, badgeId]);
      triggerToast(`Pinned badge to your main profile header!`);
    }
  };

  // --- QUICK SHARE TEMPLATES ---
  const handleQuickShare = (type: string) => {
    setPostAchievementType(type);
    
    switch (type) {
      case 'Paid Off Debt':
        setPostContent("🚀 Celebrating a huge financial win: I just officially paid off an active debt balance! Compounding interest defeated. Let's keep the snowball rolling! 👾");
        setPostBadgeId('first_debt');
        break;
      case 'Reached a Goal':
        setPostContent("🎯 Milestone Unlocked: I just reached my savings goal target! Every deposit is building a secure foundation. On to the next target! 💖");
        setPostBadgeId('goal_crusher');
        break;
      case 'Savings Milestone':
        setPostContent("💰 Financial win: Just completed a major savings contribution and stashed extra cash-flow buffers! Building consistency day by day. ⚡");
        setPostBadgeId('buffer_complete');
        break;
      case 'Challenge Completed':
        setPostContent("🏆 Personal victory: I officially conquered the active weekly finance challenge! Consistency pays off. Who else is in on the next one? 🏅");
        setPostBadgeId('challenge_winner');
        break;
      case 'Custom Update':
      default:
        setPostContent("");
        setPostBadgeId(null);
        break;
    }

    triggerToast(`Loaded template for "${type}"!`);
  };

  // --- POST SUBMISSION ---
  const handleCreatePostSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const newPost: CommunityPost = {
      id: `user-post-${Date.now()}`,
      posterName: currentUserName,
      posterAvatar: currentUserAvatar,
      achievementType: postAchievementType === 'Custom Update' ? 'Milestone Celebration ✨' : `${postAchievementType} 🎉`,
      content: postContent,
      timestamp: 'Just now',
      privacy: 'Public',
      reactions: { celebrate: 0, niceWork: 0, inspiredMe: 0, greatProgress: 0, keepGoing: 0 },
      commentsDisabled: false,
      comments: [],
      isUserPost: true
    };

    // Save to Firestore
    createLiveCommunityPost({
      id: newPost.id,
      authorId: user?.uid || 'anonymous',
      authorName: newPost.posterName,
      authorAvatar: newPost.posterAvatar,
      authorTitle: selectedTitle,
      authorLevel: level,
      content: newPost.content,
      achievementType: newPost.achievementType,
      badgeId: postBadgeId,
      timestamp: new Date().toISOString(),
      likes: [],
      commentsCount: 0
    }).catch(err => {
      console.error('Could not upload post to Firestore:', err);
    });

    const updatedPosts = [newPost, ...posts];
    savePostsToCache(updatedPosts);
    setPostContent('');
    setPostAchievementType('Custom Update');
    setPostBadgeId(null);

    // Reward for active community contribution
    addXP(25, 'Published a milestone to the feed', true);
    unlockBadge('first_post');

    // Cycle prompt index for next time
    setCurrentPromptIdx(prev => (prev + 1) % FRIENDLY_PROMPTS.length);

    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
  };

  // --- REACTION ACTIONS ---
  const handleReaction = (postId: string, reactionType: keyof CommunityPost['reactions']) => {
    const key = `reacted-${postId}-${reactionType}`;
    const alreadyReacted = localStorage.getItem(key) === 'true';

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const increment = alreadyReacted ? -1 : 1;
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [reactionType]: Math.max(0, post.reactions[reactionType] + increment)
          }
        };
      }
      return post;
    });

    savePostsToCache(updatedPosts);

    if (alreadyReacted) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, 'true');
      addXP(5, 'Reacted to community peer', true);
      unlockBadge('community_helper');
    }
  };

  // --- POST COMMENT ACTIONS ---
  const handleAddComment = (postId: string, e: FormEvent) => {
    e.preventDefault();
    const txt = commentInputs[postId];
    if (!txt || !txt.trim()) return;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: `c-user-${Date.now()}`,
              commenter: currentUserName,
              commenterAvatar: currentUserAvatar,
              text: txt.trim(),
              timestamp: 'Just now'
            }
          ]
        };
      }
      return post;
    });

    savePostsToCache(updatedPosts);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    addXP(10, 'Offered encouraging advice', true);
    unlockBadge('community_helper');
  };

  // --- SHARE SIMULATOR ---
  const handleShareSimulate = (post: CommunityPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Check out ${post.posterName}'s milestone: "${post.content}"`);
    }
    addXP(15, 'Shared milestone link with friends', true);
    triggerToast('Copied milestone link! +15 XP rewarded.');
  };

  // --- CHALLENGE SPRINT ACTIONS ---
  const handleJoinChallenge = (chalId: string) => {
    const updated = challenges.map(c => {
      if (c.id === chalId) {
        return { ...c, joined: !c.joined };
      }
      return c;
    });
    saveChallengesToCache(updated);
    
    const targetChal = challenges.find(c => c.id === chalId);
    if (targetChal) {
      if (!targetChal.joined) {
        addXP(30, `Joined "${targetChal.title}" Challenge!`);
      } else {
        triggerToast(`Withdrew from challenge.`);
      }
    }
  };

  const handleSimulateChallengeIncrement = (chalId: string) => {
    const updated = challenges.map(c => {
      if (c.id === chalId) {
        const nextProgress = Math.min(100, c.progress + 25);
        const checkins = c.checkinsCount + 1;
        
        if (nextProgress >= 100 && c.progress < 100) {
          setTimeout(() => {
            addXP(c.rewardPoints, `Completed Challenge: ${c.title}!`);
            unlockBadge('challenge_winner');
          }, 100);
        }
        
        return {
          ...c,
          progress: nextProgress,
          checkinsCount: checkins
        };
      }
      return c;
    });
    saveChallengesToCache(updated);
    triggerToast('Logged incremental sprint target! +25% progress.');
  };

  // --- CHANGE TITLE ---
  const handleChangeTitle = (newTitle: string) => {
    setSelectedTitle(newTitle);
    triggerToast(`Updated active title to: ${newTitle}`);
  };

  // --- SCANNING METRICS FROM DASHBOARD DATA FOR REAL CELEBRATIONS ---
  const totalDebtsPaid = debts.filter(d => d.balance === 0 || d.status === 'Paid').length;
  const totalGoalsReached = goals.filter(g => g.targetAmount > 0 && g.currentAmount >= g.targetAmount).length;
  const activeStreak = streakCount;

  // --- DYNAMIC TIMELINE ENTRIES ---
  const getTimelineEntries = () => {
    const items: { id: string; title: string; desc: string; date: string; icon: string; category: string }[] = [];

    // 1. Earned Badges
    earnedBadges.forEach(id => {
      const b = BADGES_LIST.find(x => x.id === id);
      if (b) {
        items.push({
          id: `t-badge-${id}`,
          title: `Unlocked "${b.name}"`,
          desc: b.requirement,
          date: 'Completed milestone',
          icon: b.emoji,
          category: 'badge'
        });
      }
    });

    // 2. Level milestones
    INITIAL_TITLES.forEach(t => {
      if (t.reqLevel <= level) {
        items.push({
          id: `t-level-${t.reqLevel}`,
          title: `Promoted to Lv. ${t.reqLevel}`,
          desc: `Unlocked title "${t.name}" through dynamic savings progress!`,
          date: `Completed level up`,
          icon: '👑',
          category: 'level'
        });
      }
    });

    // 3. Real indicators
    if (totalDebtsPaid > 0) {
      items.push({
        id: 't-debt-clear',
        title: `${totalDebtsPaid} Debt Balance Paid Off`,
        desc: 'Crushed principal balance to $0 in your financial snowball.',
        date: 'Active milestone',
        icon: '⚔️',
        category: 'debt'
      });
    }

    if (totalGoalsReached > 0) {
      items.push({
        id: 't-goal-clear',
        title: `${totalGoalsReached} Savings Target Reached`,
        desc: 'Pre-funded capital objectives without leaving a debt trail.',
        date: 'Active milestone',
        icon: '🎯',
        category: 'savings'
      });
    }

    // Default historical anchors
    items.push({
      id: 't-anchor-1',
      title: 'Joined Finance Command Center',
      desc: 'Configured your liquid money matrix, checking buffers, and debt prioritizations.',
      date: 'Day 1 of Journey',
      icon: '🛸',
      category: 'system'
    });

    return items.reverse(); // Newest first
  };

  // --- FRIEND SUGGESTIONS (Simulated) ---
  const [suggestedFriends, setSuggestedFriends] = useState([
    { name: 'Danny Cole', title: 'Debt Crusher', avatar: 'Danny_Cole', level: 12, added: false },
    { name: 'Claire Zhao', title: 'Smart Saver', avatar: 'Claire_Zhao', level: 16, added: false },
  ]);

  const handleAddFriend = (name: string) => {
    setSuggestedFriends(prev => prev.map(f => f.name === name ? { ...f, added: true } : f));
    setFollowedUsers(prev => [...prev, name]);
    addXP(20, `Connected with ${name}!`, true);
    triggerToast(`Added ${name}! They are now part of your supportive feed circle.`);
  };

  // If opted out, show opt-in gate or join profile wizard
  if (!isOptedIn) {
    if (showJoinProfileWizard) {
      return (
        <div className="max-w-md mx-auto px-4 py-8 bg-white border border-slate-200/60 rounded-3xl shadow-xl space-y-6" id="community-join-profile-wizard">
          <div className="text-center space-y-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-indigo-100 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-display font-bold text-slate-800">Create Community Profile</h2>
            <p className="text-xs text-slate-450 leading-relaxed">Join the accountability matrix! Setup your public alias below.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Public Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                <input
                  type="text"
                  value={wizardUsername}
                  onChange={(e) => setWizardUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="money_architect"
                  className="w-full pl-7 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
              <p className="text-[9px] text-slate-400">Alphanumeric characters and underscores only.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Choose Avatar</label>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {PREMIUM_AVATARS.map((avatar, idx) => {
                  const isSel = wizardAvatarIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setWizardAvatarIndex(idx)}
                      className={`relative rounded-full overflow-hidden transition-all shrink-0 ${
                        isSel ? 'ring-2 ring-indigo-600 ring-offset-2 scale-105' : 'hover:scale-102 opacity-70'
                      }`}
                    >
                      <div className="w-11 h-11 shrink-0">
                        <UserAvatar configOrUrl={avatar} size="md" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[10px] text-indigo-700 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-500" />
              <span>We never share account balances, dollar amounts, or credit details. Accountability is centered entirely on habits, streaks, and achievements.</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinProfileWizard(false)}
              className="flex-1 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!wizardUsername.trim()}
              onClick={() => {
                const finalUsername = wizardUsername.trim() || 'Chief_Commander';
                setIsOptedIn(true);
                localStorage.setItem('finance_community_opt_in', 'true');
                localStorage.setItem('finance_community_username', finalUsername);
                localStorage.setItem('finance_avatar_idx', wizardAvatarIndex.toString());
                const presetSeed = PREMIUM_AVATARS[wizardAvatarIndex] || 'Chief_Commander';
                setAvatarConfig(getDeterministicAvatarConfig(presetSeed));
                setCustomUsername(finalUsername);
                
                // Firestore sync
                if (user) {
                  saveCommunityProfileToFirestore(user.uid, {
                    uid: user.uid,
                    username: finalUsername,
                    displayName: user.displayName || finalUsername,
                    photoURL: PREMIUM_AVATARS[wizardAvatarIndex],
                    level,
                    xp,
                    lifetimeXp,
                    weeklyXp,
                    monthlyXp,
                    selectedTitle,
                    unlockedTitles,
                    streakCount,
                    earnedBadges,
                    pinnedBadges,
                    optedIn: true
                  }).catch(e => console.error('Cloud profile registration issue:', e));
                }

                addXP(50, 'Activated Community Peer Network!');
                triggerToast('Welcome to the Accountability Matrix! +50 XP!');
              }}
              className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Join network
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6" id="community-opt-in-gate">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-indigo-100 shadow-xs animate-pulse">
          <Users className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-display font-bold text-slate-800">Supportive Peer Network</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Ready to gamify your habits? Connect with other builders to stay accountable. We NEVER show actual dollars, account balances, or credit details. Connect on streaks, milestones, and challenge wins!
          </p>
        </div>
        <button
          onClick={() => {
            const defaultUser = user?.displayName?.replace(/[^a-zA-Z0-9_]/g, '') || '';
            setWizardUsername(defaultUser);
            setShowJoinProfileWizard(true);
          }}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-xs font-semibold shadow-md hover:opacity-90 transition-opacity cursor-pointer"
          id="btn-opt-in-community"
        >
          Activate Supportive Network (+50 XP)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24 space-y-6 animate-fade-in" id="community-hub-container">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Accountability Matrix
            </span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-slate-800 tracking-tight mt-1">Community Hub</h1>
          <p className="text-xs text-slate-500">Celebrate wins, collect rare achievement badges, and conquer sprints alongside other builders.</p>
        </div>

        {/* OPT-OUT & CONTROL */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm("Would you like to turn off community view and go private? You will still keep your level progress.")) {
                setIsOptedIn(false);
                localStorage.setItem('finance_community_opt_in', 'false');
              }
            }}
            className="text-[10px] font-sans font-medium text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Leave Network
          </button>
        </div>
      </div>

      {/* TOP SEGMENTED NAVIGATION */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl max-w-2xl mx-auto flex items-center justify-between shadow-xs border border-slate-200/40 relative z-10" id="community-tabs-segmented">
        {(['feed', 'challenges', 'achievements', 'leaderboard', 'profile'] as const).map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 text-xs font-semibold rounded-xl text-center relative transition-all capitalize"
              id={`community-tab-btn-${tab}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCommunityTabPill"
                  className="absolute inset-0 bg-white rounded-xl border border-slate-200/50 shadow-xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-200 ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}>
                {tab}
              </span>
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* ==================== TAB 1: FEED ==================== */}
            {activeTab === 'feed' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="tab-community-feed">
                
                {/* LEFT/CENTER 2 COLUMNS: PROFILE + CREATE POST + FEED */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* COMPACT PROFILE SUMMARY CARD */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.035)] relative overflow-hidden" id="feed-profile-summary">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -mr-12 -mt-12 -z-10" />
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                      
                      {/* Avatar & Basic Info */}
                      <div className="flex items-center gap-4">
                        {/* Avatar Wrapper with Overlapping Badge */}
                        <div 
                          onClick={() => handleViewProfile(currentUserName)}
                          className="relative shrink-0 cursor-pointer hover:scale-105 transition-transform duration-200"
                        >
                          <UserAvatar
                            configOrUrl={avatarConfig}
                            size="xl"
                            level={level}
                            showLevelBadge={true}
                            animateLevelUp={levelUpAnim}
                          />
                        </div>

                        {/* Name and Title */}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-display font-bold text-base text-slate-800">{currentUserName}</h3>
                            <span className="flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold px-1.5 py-0.5 rounded-md">
                              <Flame className="w-3 h-3 fill-amber-500 stroke-amber-600" /> {streakCount} Days
                            </span>
                          </div>
                          <p className="text-xs font-mono font-medium text-indigo-600 uppercase tracking-wider">{selectedTitle}</p>
                          <p className="text-[10px] text-slate-400">Streak Check-ins Completed: {Object.values(streakCheckins).filter(v => v).length}/5</p>
                        </div>
                      </div>

                      {/* Stat Counters */}
                      <div className="flex items-center gap-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 w-full md:w-auto">
                        <div className="text-center bg-slate-50 border border-slate-100 px-3 py-2 rounded-2xl flex-1 md:flex-none">
                          <span className="block text-lg font-bold font-mono text-slate-700">{earnedBadges.length}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider">Badges Earned</span>
                        </div>
                        <div className="text-center bg-slate-50 border border-slate-100 px-3 py-2 rounded-2xl flex-1 md:flex-none">
                          <span className="block text-lg font-bold font-mono text-slate-700">+{lifetimeXp}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider">Lifetime XP</span>
                        </div>
                      </div>
                    </div>

                    {/* XP PROGRESS BAR */}
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>XP PROGRESSION</span>
                        <span className="font-bold text-slate-600">{xp} / {getXPForLevel(level)} XP</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(xp / getXPForLevel(level)) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* FEATURED/PINNED BADGES SECTION */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Pin className="w-3 h-3 rotate-45 text-indigo-500" /> Featured Milestones ({pinnedBadges.length}/3)
                        </span>
                        <button
                          onClick={() => setActiveTab('achievements')}
                          className="text-[10px] text-indigo-600 font-bold hover:underline"
                        >
                          Customize Pins
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {pinnedBadges.length === 0 ? (
                          <button
                            onClick={() => setActiveTab('achievements')}
                            className="text-xs text-slate-400 border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-2xl flex items-center gap-1 w-full justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Pin up to three favorite collectible badges
                          </button>
                        ) : (
                          <div className="grid grid-cols-3 gap-2.5 w-full">
                            {pinnedBadges.map(badgeId => {
                              const badge = BADGES_LIST.find(b => b.id === badgeId);
                              if (!badge) return null;
                              return (
                                <div
                                  key={badgeId}
                                  className="flex items-center gap-2 bg-indigo-50/40 border border-indigo-100/60 p-2 rounded-2xl shadow-xs relative group"
                                >
                                  <span className="text-xl shrink-0">{badge.emoji}</span>
                                  <div className="truncate">
                                    <span className="block text-[10px] font-bold text-slate-700 truncate">{badge.name}</span>
                                    <span className="block text-[8px] font-mono font-medium text-slate-400 truncate uppercase">{badge.rarity}</span>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Empty Placeholders if less than 3 */}
                            {Array.from({ length: 3 - pinnedBadges.length }).map((_, i) => (
                              <button
                                key={`placeholder-${i}`}
                                onClick={() => setActiveTab('achievements')}
                                className="border border-dashed border-slate-200 rounded-2xl p-2 flex items-center justify-center text-slate-300 hover:text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* IMPROVED "CREATE POST" CARD */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.035)] space-y-4" id="create-post-card">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <SmilePlus className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-800">
                          {FRIENDLY_PROMPTS[currentPromptIdx]}
                        </span>
                      </div>
                      
                      {/* Dropdown or Active Share selection tag */}
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                        {postAchievementType}
                      </span>
                    </div>

                    <form onSubmit={handleCreatePostSubmit} className="space-y-3">
                      <div className="relative">
                        <textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="Celebrate a debt paid off, goal reached, or custom progress milestone..."
                          className="w-full text-xs text-slate-700 placeholder-slate-400 bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 rounded-2xl p-3 h-20 outline-hidden transition-all resize-none"
                          maxLength={350}
                        />
                        <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-300 font-mono">
                          {postContent.length}/350
                        </div>
                      </div>

                      {/* QUICK SHARE BUTTONS */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-400">Quick Share Milestone:</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { label: 'Paid Off Debt', action: 'Paid Off Debt', emoji: '👾' },
                            { label: 'Reached a Goal', action: 'Reached a Goal', emoji: '🎯' },
                            { label: 'Savings Milestone', action: 'Savings Milestone', emoji: '💰' },
                            { label: 'Challenge Completed', action: 'Challenge Completed', emoji: '🏆' },
                            { label: 'Custom Update', action: 'Custom Update', emoji: '✨' }
                          ].map(btn => {
                            const isSelected = postAchievementType === btn.action;
                            return (
                              <button
                                type="button"
                                key={btn.action}
                                onClick={() => handleQuickShare(btn.action)}
                                className={`text-[10px] font-sans font-medium px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <span>{btn.emoji}</span> {btn.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* SUBMIT ROW */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Posting to supportive peer network
                        </span>
                        
                        <button
                          type="submit"
                          disabled={!postContent.trim()}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            postContent.trim()
                              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                              : 'bg-slate-100 text-slate-350 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-3 h-3" /> Post Winner
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* MODERN COMMUNITY FEED */}
                  <div className="space-y-4" id="feed-cards-timeline">
                    <div className="flex items-center justify-between pb-1">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-500" /> Supportive Activity Feed
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">Updated just now</span>
                    </div>

                    <AnimatePresence>
                      {posts.map(post => {
                        const commentsExpanded = expandedComments[post.id] || false;
                        const posterBadge = BADGES_LIST.find(b => post.achievementType.toLowerCase().includes(b.name.toLowerCase()));
                        
                        return (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.035)]"
                            id={`feed-card-${post.id}`}
                          >
                            {/* Card Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {/* Profile photo */}
                                <div 
                                  onClick={() => handleViewProfile(
                                    post.posterName, 
                                    post.posterName === 'Sarah Jenkins' ? 'Debt Crusher' : 'Smart Saver', 
                                    post.posterAvatar,
                                    post.posterName === 'Sarah Jenkins' ? 18 : 15
                                  )}
                                  className="relative cursor-pointer hover:scale-105 transition-transform duration-200"
                                >
                                  <UserAvatar
                                    configOrUrl={post.posterAvatar}
                                    size="lg"
                                    level={post.posterName === 'Sarah Jenkins' ? 18 : 15}
                                    showLevelBadge={true}
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 
                                      onClick={() => handleViewProfile(
                                        post.posterName, 
                                        post.posterName === 'Sarah Jenkins' ? 'Debt Crusher' : 'Smart Saver', 
                                        post.posterAvatar,
                                        post.posterName === 'Sarah Jenkins' ? 18 : 15
                                      )}
                                      className="font-display font-bold text-sm text-slate-800 cursor-pointer hover:text-indigo-600 transition-colors"
                                    >
                                      {post.posterName}
                                    </h4>
                                    {followedUsers.includes(post.posterName) && (
                                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-medium">Friend</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <span>{post.posterName === 'Sarah Jenkins' ? 'Debt Crusher' : 'Smart Saver'}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {post.timestamp}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Celebration Header Type */}
                              <span className="text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/40 px-2.5 py-0.5 rounded-full">
                                {post.achievementType}
                              </span>
                            </div>

                            {/* Post Text */}
                            <p className="text-xs text-slate-600 leading-relaxed font-sans">{post.content}</p>

                            {/* Attached collectible card illustration if applicable */}
                            {posterBadge && (
                              <div className="bg-indigo-50/20 border border-indigo-150 rounded-2xl p-3 flex items-center gap-3">
                                <span className="text-3xl">{posterBadge.emoji}</span>
                                <div>
                                  <span className="block text-[11px] font-bold text-slate-800">Earned "${posterBadge.name}" Badge!</span>
                                  <span className="block text-[9px] text-slate-500 leading-tight">{posterBadge.requirement}</span>
                                </div>
                              </div>
                            )}

                            {/* REACTIONS ROW */}
                            <div className="flex flex-wrap items-center gap-1 md:gap-2 border-y border-slate-50 py-2.5">
                              {[
                                { key: 'celebrate', label: '🎉 Celebrate' },
                                { key: 'niceWork', label: '👏 Nice Work' },
                                { key: 'inspiredMe', label: '💡 Inspired' },
                                { key: 'greatProgress', label: '📈 Progress' },
                                { key: 'keepGoing', label: '🔥 Keep Going' }
                              ].map(reaction => {
                                const count = post.reactions[reaction.key as keyof CommunityPost['reactions']] || 0;
                                const hasReacted = localStorage.getItem(`reacted-${post.id}-${reaction.key}`) === 'true';
                                
                                return (
                                  <button
                                    key={reaction.key}
                                    onClick={() => handleReaction(post.id, reaction.key as keyof CommunityPost['reactions'])}
                                    className={`text-[10px] font-medium px-2 py-1 rounded-full transition-all flex items-center gap-1 ${
                                      hasReacted 
                                        ? 'bg-amber-100/80 text-amber-800 border border-amber-200' 
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-transparent'
                                    }`}
                                  >
                                    <span>{reaction.label}</span>
                                    {count > 0 && <span className="font-mono font-bold bg-white px-1 py-0.1 rounded text-slate-600 text-[9px]">{count}</span>}
                                  </button>
                                );
                              })}

                              {/* Simulated share */}
                              <button
                                onClick={() => handleShareSimulate(post)}
                                className="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
                                title="Share outside application"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Comments Button Drawer */}
                            <div className="flex items-center justify-between text-xs">
                              <button
                                onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !commentsExpanded }))}
                                className="text-[11px] text-slate-400 hover:text-indigo-600 font-semibold flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> 
                                {post.comments.length === 0 ? 'Be the first to reply' : `${post.comments.length} supportive replies`}
                              </button>
                            </div>

                            {/* Threaded Comments Content */}
                            {commentsExpanded && (
                              <div className="space-y-3 pt-2 pl-2 border-l border-slate-100">
                                {post.comments.map(c => (
                                  <div key={c.id} className="flex items-start gap-3 text-xs bg-slate-50/50 p-3 rounded-2xl border border-slate-100/60">
                                    <div 
                                      onClick={() => handleViewProfile(c.commenter, undefined, c.commenterAvatar)}
                                      className="cursor-pointer hover:scale-105 transition-transform mt-0.5 shrink-0"
                                    >
                                      <UserAvatar configOrUrl={c.commenterAvatar} size="md" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span 
                                          onClick={() => handleViewProfile(c.commenter, undefined, c.commenterAvatar)}
                                          className="font-bold text-slate-800 cursor-pointer hover:text-indigo-600 transition-colors"
                                        >
                                          {c.commenter}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-mono">• {c.timestamp}</span>
                                      </div>
                                      <p className="text-slate-600 leading-normal">{c.text}</p>
                                    </div>
                                  </div>
                                ))}

                                {/* Inline reply box */}
                                <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center gap-2 mt-2">
                                  <input
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    placeholder="Write an encouraging reply..."
                                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 placeholder-slate-400 border border-slate-200 focus:border-indigo-300 rounded-full px-3 py-1.5 outline-hidden outline-hidden outline-none transition-all"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!(commentInputs[post.id] || '').trim()}
                                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 text-white disabled:text-slate-300 rounded-full shadow-xs transition-colors"
                                  >
                                    <Send className="w-3 h-3" />
                                  </button>
                                </form>
                              </div>
                            )}

                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                </div>

                {/* RIGHT COLUMN: SIDEBAR (TRENDING ACHIEVEMENTS + COMMUNITY CHALLENGES + SUGGESTED FRIENDS) */}
                <div className="space-y-6">

                  {/* TRENDING ACHIEVEMENTS */}
                  <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Trending Achievements</h3>
                    </div>

                    <div className="space-y-3">
                      {[
                        { badgeId: 'streak_30', count: 124, name: '30-Day Streak', emoji: '🔥', rarity: 'Rare', bg: 'bg-violet-50 text-violet-700 border-violet-100' },
                        { badgeId: 'debt_crusher', count: 89, name: 'Debt Crusher', emoji: '⚔️', rarity: 'Rare', bg: 'bg-rose-50 text-rose-700 border-rose-100' },
                        { badgeId: 'buffer_complete', count: 245, name: 'Buffer Fund Filled', emoji: '🛟', rarity: 'Common', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
                      ].map(item => (
                        <div
                          key={item.badgeId}
                          onClick={() => {
                            setActiveTab('achievements');
                            triggerToast(`Reviewing "${item.name}" requirement details!`);
                          }}
                          className="flex items-center justify-between bg-slate-50/50 hover:bg-slate-100 border border-slate-150 p-2.5 rounded-2xl cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl shrink-0">{item.emoji}</span>
                            <div>
                              <span className="block text-xs font-bold text-slate-800">{item.name}</span>
                              <span className="block text-[9px] text-slate-400 font-mono font-medium uppercase">{item.rarity}</span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                            {item.count} players earned
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COMMUNITY SPRINT EVENTS */}
                  <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                      <div className="flex items-center gap-1.5 text-indigo-600">
                        <Trophy className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Active Sprints</h3>
                      </div>
                      <button onClick={() => setActiveTab('challenges')} className="text-[10px] text-indigo-600 font-bold hover:underline">
                        View All
                      </button>
                    </div>

                    <div className="space-y-3">
                      {SEASONAL_EVENTS.slice(0, 2).map(event => {
                        const isJoined = joinedEvents.includes(event.id);
                        return (
                          <div key={event.id} className="space-y-2 border border-slate-150 bg-slate-50/30 p-3 rounded-2xl">
                            <div>
                              <span className="text-[9px] font-mono font-bold uppercase text-indigo-600">{event.subtitle}</span>
                              <h4 className="text-xs font-bold text-slate-800">{event.title}</h4>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{event.description}</p>
                            
                            <div className="flex items-center justify-between pt-1 text-[10px]">
                              <span className="text-slate-400">{event.duration}</span>
                              <button
                                onClick={() => {
                                  if (isJoined) {
                                    setJoinedEvents(prev => prev.filter(id => id !== event.id));
                                    triggerToast(`Withdrew from ${event.title}`);
                                  } else {
                                    setJoinedEvents(prev => [...prev, event.id]);
                                    addXP(50, `Joined Seasonal Sprint: ${event.title}`);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-full font-bold transition-colors ${
                                  isJoined 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                              >
                                {isJoined ? '✓ Joined Sprint' : 'Join Sprint (+50 XP)'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SUGGESTED FRIENDS CARDS */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.035)] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <Users className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Suggested Friends</h3>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {suggestedFriends.map(friend => (
                        <div key={friend.name} className="flex items-center justify-between gap-2 border border-slate-100 bg-slate-50/30 p-3 rounded-2xl">
                          <div 
                            onClick={() => handleViewProfile(friend.name, friend.title, friend.avatar, friend.level)}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <div className="transition-transform group-hover:scale-105 shrink-0">
                              <UserAvatar
                                configOrUrl={friend.avatar}
                                size="md"
                                level={friend.level}
                                showLevelBadge={true}
                              />
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{friend.name}</span>
                              <span className="block text-[9px] text-slate-400 font-mono uppercase">Lv.{friend.level} • {friend.title}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddFriend(friend.name)}
                            disabled={friend.added}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-0.5 ${
                              friend.added 
                                ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {friend.added ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" /> Linked
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" /> Link
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ANONYMOUS STAT CARD */}
                  <div className="bg-gradient-to-br from-indigo-900 to-purple-950 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl -mr-6 -mt-6" />
                    <div className="space-y-3">
                      <div className="p-2 bg-white/10 rounded-xl w-fit">
                        <ShieldCheck className="w-5 h-5 text-indigo-300" />
                      </div>
                      <h4 className="text-sm font-bold tracking-tight">Zero Financial Leak Guarantee</h4>
                      <p className="text-[10px] text-indigo-200 leading-relaxed">
                        To maintain a pure stress-free environment, we NEVER share real monetary data. Your net savings deposits, cash positions, and debt balances are fully private. We only sync consistency milestones!
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ==================== TAB 2: CHALLENGES ==================== */}
            {activeTab === 'challenges' && (
              <div className="space-y-6" id="tab-community-challenges">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {challenges.map(chal => {
                    const progressVal = chal.progress;
                    const isCompleted = progressVal >= 100;
                    
                    return (
                      <div
                        key={chal.id}
                        className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden ${
                          chal.joined ? 'border-indigo-300 ring-1 ring-indigo-300/30' : 'border-slate-200/60'
                        }`}
                        id={`challenge-card-${chal.id}`}
                      >
                        {chal.joined && (
                          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-2xl">
                            ACTIVE SPRINT
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase text-indigo-500">
                            <Zap className="w-3 h-3" /> {chal.category} sprint
                          </div>
                          
                          <h3 className="font-display font-bold text-sm text-slate-800">{chal.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{chal.description}</p>
                          
                          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[10px] space-y-1">
                            <span className="block text-slate-400 uppercase font-bold tracking-wider">TARGET EXPECTATION:</span>
                            <span className="block text-slate-700 font-mono font-bold">{chal.target}</span>
                          </div>
                        </div>

                        {/* Progress and Actions */}
                        <div className="space-y-3 pt-2">
                          {chal.joined && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                <span>Sprint Progress</span>
                                <span className="font-bold text-slate-600">{progressVal}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${progressVal}%` }} />
                              </div>
                              <p className="text-[9px] text-slate-400 text-right">Sprint Check-ins logged: {chal.checkinsCount}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 text-xs">
                            <button
                              onClick={() => handleJoinChallenge(chal.id)}
                              className={`flex-1 py-1.5 rounded-full font-bold transition-colors ${
                                chal.joined
                                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              {chal.joined ? 'Leave Sprint' : `Join Sprint (+${chal.rewardPoints} XP)`}
                            </button>

                            {chal.joined && !isCompleted && (
                              <button
                                onClick={() => handleSimulateChallengeIncrement(chal.id)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-full font-bold text-[10px] flex items-center gap-1"
                              >
                                Log Progress +25%
                              </button>
                            )}

                            {isCompleted && (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                Completed!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SEASONAL EVENTS EXTENDED ROW */}
                <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Seasonal Sprints & Sagas</h3>
                    <p className="text-xs text-slate-500">Major community-wide monthly objectives. Settle budget boundaries to survive peak holiday seasons together.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {SEASONAL_EVENTS.map(event => {
                      const isJoined = joinedEvents.includes(event.id);
                      return (
                        <div key={event.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md uppercase">{event.subtitle}</span>
                              <span className={`font-bold px-2 py-0.5 rounded-md uppercase ${
                                event.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>{event.status}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">{event.title}</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{event.description}</p>
                          </div>

                          <div className="space-y-2 text-[10px] border-t border-slate-50 pt-3">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Requirement:</span>
                              <span className="text-slate-600 font-semibold">{event.requirements}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Duration:</span>
                              <span className="text-slate-600 font-semibold font-mono">{event.duration}</span>
                            </div>

                            <button
                              onClick={() => {
                                if (isJoined) {
                                  setJoinedEvents(prev => prev.filter(id => id !== event.id));
                                  triggerToast(`Left sprint: ${event.title}`);
                                } else {
                                  setJoinedEvents(prev => [...prev, event.id]);
                                  addXP(50, `Joined Seasonal Sprint: ${event.title}`);
                                }
                              }}
                              className={`w-full py-1.5 rounded-full font-bold mt-2 transition-colors ${
                                isJoined 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
                              }`}
                            >
                              {isJoined ? '✓ Enrolled in Sprint' : `Enroll in Sprint (+${event.rewardXp} XP)`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ==================== TAB 3: ACHIEVEMENTS & TIMELINE ==================== */}
            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="tab-community-achievements">
                
                {/* LEFT 2 COLUMNS: COLLECTIBLE BADGES GALLERY */}
                <div className="lg:col-span-2 space-y-6">
                  
                  <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                        <Award className="w-5 h-5 text-indigo-500" /> Collectible Badges Collection
                      </h2>
                      <p className="text-xs text-slate-500">Uncover beautiful high-contrast accomplishment badges. Pin up to three badges to feature them on your primary activity feed card.</p>
                    </div>

                    {/* BADGES GALLERY GROUPED BY CATEGORIES */}
                    {['Debt', 'Savings', 'Community', 'Consistency', 'Money', 'Holiday'].map(cat => {
                      const catBadges = BADGES_LIST.filter(b => b.category === cat);
                      
                      return (
                        <div key={cat} className="space-y-3 pt-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1">{cat} Milestones</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {catBadges.map(badge => {
                              const isEarned = earnedBadges.includes(badge.id);
                              const isPinned = pinnedBadges.includes(badge.id);
                              
                              // Category specific gradients and rarity color styles
                              const isLegendary = badge.rarity === 'Legendary';
                              const isEpic = badge.rarity === 'Epic';
                              const isRare = badge.rarity === 'Rare';
                              
                              let cardBg = "bg-slate-50/50 border-slate-200 text-slate-700";
                              let rarityBadge = "bg-slate-100 text-slate-500";
                              
                              if (isEarned) {
                                if (isLegendary) {
                                  cardBg = "bg-gradient-to-br from-amber-50 to-amber-100/40 border-amber-300 text-amber-900 shadow-sm ring-1 ring-amber-300/30";
                                  rarityBadge = "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse font-extrabold";
                                } else if (isEpic) {
                                  cardBg = "bg-gradient-to-br from-fuchsia-50 to-pink-50 border-fuchsia-250 text-fuchsia-950 shadow-xs";
                                  rarityBadge = "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200 font-bold";
                                } else if (isRare) {
                                  cardBg = "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 text-indigo-950 shadow-xs";
                                  rarityBadge = "bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold";
                                } else {
                                  cardBg = "bg-gradient-to-br from-emerald-50 to-slate-50 border-emerald-200 text-emerald-950";
                                  rarityBadge = "bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium";
                                }
                              } else {
                                cardBg = "bg-slate-50/40 border-slate-200/50 text-slate-400 grayscale opacity-70";
                              }

                              return (
                                <div
                                  key={badge.id}
                                  className={`border p-4 rounded-3xl flex items-start gap-3 relative transition-all ${cardBg}`}
                                  id={`badge-gallery-card-${badge.id}`}
                                >
                                  {/* Pin Button for earned badges */}
                                  {isEarned && (
                                    <button
                                      onClick={() => handleTogglePinBadge(badge.id)}
                                      className={`absolute top-3 right-3 p-1 rounded-full transition-all ${
                                        isPinned 
                                          ? 'bg-indigo-600 text-white shadow-xs' 
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600'
                                      }`}
                                      title={isPinned ? "Unpin from profile" : "Pin to featured profile slots"}
                                    >
                                      <Pin className={`w-3 h-3 ${isPinned ? 'rotate-45' : ''}`} />
                                    </button>
                                  )}

                                  <div className="text-4xl shrink-0 p-1.5 bg-white/80 rounded-2xl border border-slate-100 shadow-2xs">
                                    {badge.emoji}
                                  </div>

                                  <div className="space-y-1 pr-4">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-display font-black text-xs">{badge.name}</span>
                                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded-md font-bold ${rarityBadge}`}>
                                        {badge.rarity}
                                      </span>
                                    </div>
                                    <p className="text-[10px] leading-tight text-slate-500">{badge.description}</p>
                                    
                                    <div className="text-[9px] font-mono pt-1.5 text-slate-400">
                                      <span className="font-bold text-slate-500">How to Unlock:</span> {badge.requirement}
                                    </div>

                                    {/* Unlocked stamp indicator */}
                                    {isEarned ? (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded mt-1">
                                        ✓ UNLOCKED
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.2 rounded mt-1">
                                        🔒 LOCKED
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                  </div>

                </div>

                {/* RIGHT COLUMN: ACHIEVEMENT TIMELINE CHRONOLOGY */}
                <div className="space-y-6">
                  
                  <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-500" /> Journey Timeline
                      </h3>
                      <p className="text-[11px] text-slate-400">A scrolling chronological map of level-ups, completed targets, and badge awards earned over your cycle.</p>
                    </div>

                    {/* Timeline List Scrollable Container */}
                    <div className="relative border-l border-slate-200/80 pl-4 ml-2.5 space-y-5 py-2 max-h-[700px] overflow-y-auto pr-1">
                      {getTimelineEntries().map((entry, index) => (
                        <div key={entry.id || index} className="relative">
                          {/* Chronological node dot icon */}
                          <span className="absolute -left-[27px] top-0 bg-white rounded-full w-5 h-5 border border-slate-200 flex items-center justify-center text-xs shadow-xs">
                            {entry.icon}
                          </span>

                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-800">{entry.title}</span>
                              <span className="text-[8px] font-mono font-medium text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded uppercase">{entry.category}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal">{entry.desc}</p>
                            <span className="block text-[8px] font-mono text-slate-400">{entry.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SAVINGS STORY */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                    <span className="text-[9px] font-mono font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">COMMUNITY INSPIRATION</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      "Completing my Vacation pre-fund goal ahead of time saved me over $180 in finance fees compared to my usual getaway debt lines! The streak consistency pays back!"
                    </p>
                    <span className="block text-[10px] font-bold text-slate-600 text-right">— Marcus Vance, Lv.15</span>
                  </div>

                </div>

              </div>
            )}

            {/* ==================== TAB 4: LEADERBOARD ==================== */}
            {activeTab === 'leaderboard' && (
              <div className="max-w-3xl mx-auto space-y-6" id="tab-community-leaderboard">
                
                {/* Control card */}
                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display font-semibold text-slate-800 text-sm">Wealth-Neutral Friendly Rankings</h3>
                      <p className="text-xs text-slate-400">Rankings are calculated solely based on check-ins, consistency, weekly XP, and challenges completed.</p>
                    </div>

                    {/* Opt-In toggle */}
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-150">
                      <span className="text-xs text-slate-500 font-medium">Appear on Leaderboard:</span>
                      <button
                        onClick={() => {
                          setLeaderboardOptIn(!leaderboardOptIn);
                          triggerToast(leaderboardOptIn ? 'Opted out of rankings.' : 'Enrolled in leaderboard!');
                        }}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          leaderboardOptIn ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`absolute top-0.5 bg-white w-4 h-4 rounded-full transition-all ${
                          leaderboardOptIn ? 'left-5.5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Leaderboard filters */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3">
                    {[
                      { id: 'xp', label: 'Monthly XP' },
                      { id: 'streak', label: 'Streak Flames' },
                      { id: 'goals', label: 'Goals Conquered' },
                      { id: 'challenges', label: 'Sprints Won' }
                    ].map(cat => {
                      const isSel = leaderboardCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setLeaderboardCategory(cat.id as any)}
                          className={`text-[11px] font-sans font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                            isSel 
                              ? 'bg-slate-900 text-white border-slate-950 shadow-xs' 
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rank Listing */}
                {leaderboardOptIn ? (
                  <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono text-[9px] uppercase">
                        <tr>
                          <th className="py-3 px-4 text-center w-12">Rank</th>
                          <th className="py-3 px-4">Builder</th>
                          <th className="py-3 px-4 text-center">Flame Streak</th>
                          <th className="py-3 px-4 text-center">Monthly XP</th>
                          <th className="py-3 px-4 text-right pr-6">Conquered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Insert User into custom ranked entries */}
                        {[
                          {
                            id: 'user',
                            name: currentUserName,
                            avatar: currentUserAvatar,
                            streak: streakCount,
                            monthlyXp: monthlyXp,
                            goalsCompleted: totalGoalsReached,
                            title: selectedTitle,
                            isUser: true
                          },
                          ...MOCK_LEADERBOARD
                        ]
                        .sort((a, b) => {
                          if (leaderboardCategory === 'xp') return b.monthlyXp - a.monthlyXp;
                          if (leaderboardCategory === 'streak') return b.streak - a.streak;
                          if (leaderboardCategory === 'goals') return b.goalsCompleted - a.goalsCompleted;
                          return b.monthlyXp - a.monthlyXp;
                        })
                        .map((entry, idx) => {
                          const isCurrentUser = entry.isUser;
                          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                          
                          return (
                            <tr
                              key={entry.id}
                              className={`hover:bg-slate-50/50 transition-colors ${
                                isCurrentUser ? 'bg-indigo-50/20 font-bold' : ''
                              }`}
                            >
                              <td className="py-3.5 px-4 text-center font-mono font-extrabold text-slate-500">
                                {medal ? <span className="text-base">{medal}</span> : idx + 1}
                              </td>

                              <td className="py-3.5 px-4">
                                <div 
                                  onClick={() => handleViewProfile(entry.name, entry.title, entry.avatar, entry.isUser ? level : undefined, entry.streak, entry.monthlyXp)}
                                  className="flex items-center gap-2.5 cursor-pointer group"
                                >
                                  <div className="transition-transform group-hover:scale-105 shrink-0">
                                    <UserAvatar
                                      configOrUrl={entry.avatar}
                                      size="md"
                                      level={entry.isUser ? level : (entry.name === 'Sarah Jenkins' ? 18 : entry.name === 'Marcus Vance' ? 15 : entry.name === 'Elena Rostova' ? 14 : entry.name === 'Sophia Chen' ? 10 : 12)}
                                      showLevelBadge={true}
                                    />
                                  </div>
                                  <div>
                                    <span className="block text-slate-800 text-xs font-semibold group-hover:text-indigo-600 transition-colors">
                                      {entry.name} {isCurrentUser && '(You)'}
                                    </span>
                                    <span className="block text-[9px] text-slate-400 font-mono uppercase">{entry.title}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center gap-0.5 font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
                                  🔥 {entry.streak}d
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                                {entry.monthlyXp} XP
                              </td>

                              <td className="py-3.5 px-4 text-right pr-6 font-mono font-medium text-slate-500">
                                {entry.goalsCompleted} Goals
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center space-y-3">
                    <Lock className="w-8 h-8 text-slate-300 mx-auto" />
                    <h3 className="font-bold text-slate-700">Rankings Hidden</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      You are currently private. Turn on the Leaderboard display toggle to challenge yourself alongside friends.
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* ==================== TAB 5: PROFILE SETTINGS ==================== */}
            {activeTab === 'profile' && (
              <div className="max-w-3xl mx-auto space-y-6" id="tab-community-profile">
                
                {/* PUBLIC IDENTITY SETTINGS */}
                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 font-display">Public Identity Settings</h3>
                    <p className="text-xs text-slate-400 font-sans">Control what appears publicly across social feeds, comments, and accountability leaderboards.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Editable Public Alias</label>
                      <div className="relative max-w-sm">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                        <input
                          type="text"
                          value={customUsername}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                            setCustomUsername(val);
                            localStorage.setItem('finance_community_username', val);
                            if (user) {
                              saveCommunityProfileToFirestore(user.uid, { username: val }).catch(err => console.error(err));
                            }
                          }}
                          placeholder="money_starter"
                          className="w-full pl-7 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* TITLE SELECTOR */}
                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Unlocked Financial Titles</h3>
                    <p className="text-xs text-slate-400">Unlock more professional financial titles by leveling up your dashboard experience.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {INITIAL_TITLES.map(title => {
                      const isUnlocked = level >= title.reqLevel || unlockedTitles.includes(title.name);
                      const isSelected = selectedTitle === title.name;
                      
                      return (
                        <button
                          key={title.name}
                          disabled={!isUnlocked}
                          onClick={() => handleChangeTitle(title.name)}
                          className={`p-3 rounded-2xl border text-left text-xs transition-all flex flex-col justify-between h-20 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : isUnlocked
                                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                                : 'bg-slate-100 text-slate-350 cursor-not-allowed border-transparent grayscale'
                          }`}
                        >
                          <span className="font-bold block truncate">{title.name}</span>
                          <span className="text-[9px] font-mono opacity-80 block">
                            {isUnlocked ? 'Unlocked ✓' : `Requires Level ${title.reqLevel}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STREAK CONSISTENCY CHECKINS */}
                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Weekly Consistency Check-ins</h3>
                    <p className="text-xs text-slate-400">Build habits by logging daily/weekly activities. Clear all 5 check-ins to receive the massive streak multiplier bonus!</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'dailyCheckin', label: 'Daily Capital Check-in', reward: 15, desc: 'Logged into dashboard to audit capital zones' },
                      { key: 'weeklyBudget', label: 'Weekly Budget Clearance', reward: 40, desc: 'Cleared discretionary margins under bounds' },
                      { key: 'monthlyGoal', label: 'Target Contribution Met', reward: 50, desc: 'Deposited savings into high-yield zones' },
                      { key: 'debtPayment', label: 'Liabilities Snowball Deposit', reward: 50, desc: 'Contributed extra payment against APR targets' },
                      { key: 'savingsContribution', label: 'Safety Net Rebalance Check', reward: 35, desc: 'Verified emergency cushion threshold' }
                    ].map(item => {
                      const isChecked = (streakCheckins as any)[item.key];
                      return (
                        <div
                          key={item.key}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                            isChecked
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                              : 'bg-slate-50 border-slate-200/80 text-slate-600'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="block text-xs font-bold">{item.label}</span>
                            <span className="block text-[10px] text-slate-400 leading-normal">{item.desc}</span>
                            <span className="block text-[9px] font-mono text-indigo-600">+{item.reward} XP Award</span>
                          </div>

                          <button
                            onClick={() => handleStreakCheckin(item.key, item.reward, item.label)}
                            disabled={isChecked}
                            className={`p-1.5 rounded-full border transition-all shrink-0 ${
                              isChecked
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white hover:bg-slate-100 text-slate-300 border-slate-200 hover:text-slate-500'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PROFILE PHOTO CHANGER */}
                <AvatarCustomizer
                  config={avatarConfig}
                  onChange={(updated) => {
                    setAvatarConfig(updated);
                    triggerToast('Profile avatar updated successfully!');
                  }}
                  level={level}
                />

              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* FLOAT FLOATING TOAST NOTIFICATIONS */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-slate-900/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-800/50 flex items-center gap-2.5 max-w-sm backdrop-blur-md pointer-events-auto"
            >
              <div className="bg-indigo-500/20 text-indigo-400 p-1 rounded-lg shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span>{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* LEVEL UP CELEBRATION MODAL */}
      <AnimatePresence>
        {showLevelUpModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl relative border border-slate-150 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full w-20 h-20 mx-auto flex items-center justify-center border border-indigo-100 shadow-sm mb-4">
                <Trophy className="w-10 h-10 text-indigo-600 animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-indigo-600">LEVEL UP CONQUERED!</span>
                <h3 className="text-xl font-display font-black text-slate-800">Promoted to Level {levelUpData.newLevel}!</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Your consistent tracking habits, savings targets deposits, and debt snowballs have promoted your financial standing.
                </p>
              </div>

              {/* Title upgrade announcement */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-wider">Unveiled Rank Title:</span>
                <span className="block text-sm font-display font-extrabold text-indigo-600">{levelUpData.title}</span>
              </div>

              <button
                onClick={() => {
                  setShowLevelUpModal(false);
                  addXP(50, 'Level-up milestone check-in reward');
                }}
                className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-md transition-colors"
              >
                Claim Level Up Reward (+50 XP)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GAMIFIED PROFILE DETAIL POPUP */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfile(null);
        }}
        profile={selectedProfile}
      />

    </div>
  );
}
