import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Shield, Trophy, Target, Sparkles, Zap, ArrowRight } from 'lucide-react';
import UserAvatar, { AvatarConfig } from './UserAvatar';

export interface UserProfileData {
  id: string;
  name: string;
  avatar: string | AvatarConfig;
  title: string;
  level: number;
  xp: number;
  maxXp: number;
  streak: number;
  featuredBadges: Array<{ name: string; emoji: string; rarity: string; color: string }>;
  recentAchievements: Array<{ text: string; date: string; category: string; xp: number }>;
  isUser?: boolean;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileData | null;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  profile
}: UserProfileModalProps) {
  if (!isOpen || !profile) return null;

  // Determine an elegant theme background color or gradient based on their title or level
  const getProfileGradient = (lvl: number) => {
    if (lvl >= 18) return 'from-slate-900 via-indigo-950 to-purple-950 text-white';
    if (lvl >= 15) return 'from-slate-900 via-emerald-950 to-slate-950 text-white';
    if (lvl >= 10) return 'from-slate-900 via-slate-900 to-indigo-950 text-white';
    return 'from-slate-900 via-slate-950 to-slate-900 text-white';
  };

  const xpPercent = Math.min(100, Math.round((profile.xp / profile.maxXp) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" id="user-profile-modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 text-slate-100 flex flex-col max-h-[90vh]"
        id="user-profile-card-container"
      >
        {/* HEADER HERO AREA */}
        <div className={`p-6 bg-gradient-to-br ${getProfileGradient(profile.level)} relative overflow-hidden shrink-0`}>
          {/* Decorative background grid and blurs */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-slate-300 hover:text-white transition-all z-10"
            id="profile-modal-close-btn"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Gamified Card Content */}
          <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
            {/* LARGE AVATAR WITH OVERLAPPING BADGE */}
            <div className="relative shrink-0">
              <UserAvatar
                configOrUrl={profile.avatar}
                size="2xl"
                level={profile.level}
                showLevelBadge={true}
                animateLevelUp={true}
              />
            </div>

            {/* Basic detail */}
            <div className="text-center sm:text-left space-y-2 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl font-display font-black tracking-tight text-white">{profile.name}</h2>
                {profile.isUser && (
                  <span className="inline-block text-[9px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold uppercase self-center w-max mx-auto sm:mx-0">
                    You
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-mono font-semibold text-indigo-300 uppercase tracking-widest">
                  {profile.title}
                </span>
                <span className="text-slate-500">•</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500 animate-pulse" />
                  {profile.streak} Day Streak
                </span>
              </div>

              {/* LEVEL PROGRESS */}
              <div className="space-y-1 pt-1.5 max-w-xs mx-auto sm:mx-0">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>LEVEL XP PROGRESS</span>
                  <span>{profile.xp} / {profile.maxXp} XP ({xpPercent}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-950/50 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/25">
          {/* FEATURED BADGES */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Featured Showcase Badges
            </div>
            
            {profile.featuredBadges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.featuredBadges.map((badge, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center space-y-1.5 hover:border-slate-700 transition-all shadow-3xs"
                  >
                    <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{badge.emoji}</span>
                    <div>
                      <span className="block text-xs font-bold text-slate-200 line-clamp-1">{badge.name}</span>
                      <span className={`text-[8px] font-mono uppercase tracking-wider block ${
                        badge.rarity === 'Epic' ? 'text-purple-400' : badge.rarity === 'Legendary' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {badge.rarity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                No pinned badges to display in showcase.
              </div>
            )}
          </div>

          {/* RECENT ACCOMPLISHMENTS / CAMPAIGN CHRONOLOGY */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              Recent Chronology Milestones
            </div>

            {profile.recentAchievements.length > 0 ? (
              <div className="space-y-2">
                {profile.recentAchievements.map((achievement, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900/60 border border-slate-900 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-800 rounded-lg text-slate-400">
                        {achievement.category === 'level' ? (
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-200">{achievement.text}</span>
                        <span className="block text-[9px] text-slate-500 font-mono">{achievement.date}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-extrabold text-emerald-400 shrink-0 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                      +{achievement.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                No recent accomplishments recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-900 border-t border-slate-850 flex justify-between items-center shrink-0">
          <span className="text-[10px] font-mono text-slate-500">LIQUID MATRIX GAMING PROFILE</span>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            Cool <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
