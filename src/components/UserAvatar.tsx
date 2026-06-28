import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Award, Crown, Gift, Calendar, Lock } from 'lucide-react';

export interface AvatarConfig {
  useCustomPhoto: boolean;
  customPhotoUrl?: string;
  hairStyle: string;
  hairColor: string;
  facialHair: string;
  skinTone: string;
  eyeColor: string;
  glasses: string;
  hat: string;
  accessories: string;
  expression: string;
  shirtColor: string;
  bgColor: string;
  accentColor: string;
  frameId: string;
}

// Constant lists for customization
export const SKIN_TONES = [
  { id: 'pale', name: 'Pale Snow', value: '#FCD7C4', shadow: '#E4A992' },
  { id: 'fair', name: 'Fair Peach', value: '#FCD1B6', shadow: '#E6A382' },
  { id: 'peach', name: 'Warm Peach', value: '#F9C2A4', shadow: '#DC8E6D' },
  { id: 'olive', name: 'Mediterranean Olive', value: '#E1B382', shadow: '#B38150' },
  { id: 'bronze', name: 'Golden Bronze', value: '#C68B59', shadow: '#905E32' },
  { id: 'deep_bronze', name: 'Deep Bronze', value: '#8A5A36', shadow: '#623E21' },
  { id: 'cocoa', name: 'Rich Cocoa', value: '#5C3826', shadow: '#3E2519' }
];

export const HAIR_STYLES = [
  { id: 'short_crop', name: 'Short Crop' },
  { id: 'buzzcut', name: 'Buzzcut' },
  { id: 'crew_cut', name: 'Crew Cut' },
  { id: 'wavy_flow', name: 'Wavy Flow' },
  { id: 'long_locks', name: 'Long Locks' },
  { id: 'top_knot', name: 'Top Knot' },
  { id: 'curly_afro', name: 'Curly Afro' },
  { id: 'pixie', name: 'Pixie Cut' },
  { id: 'bob', name: 'Classic Bob' },
  { id: 'slick_back', name: 'Slick Back' },
  { id: 'side_part', name: 'Side Part' },
  { id: 'dreadlocks', name: 'Dreadlocks' },
  { id: 'bald', name: 'Sleek Bald' }
];

export const HAIR_COLORS = [
  { id: 'black', name: 'Midnight Black', value: '#1A1A1A' },
  { id: 'dark_brown', name: 'Espresso Brown', value: '#4A3728' },
  { id: 'golden_blonde', name: 'Golden Blonde', value: '#D4AF37' },
  { id: 'auburn_red', name: 'Auburn Red', value: '#B22222' },
  { id: 'silver_gray', name: 'Silver Slate', value: '#8A9597' },
  { id: 'platinum_blue', name: 'Electric Blue', value: '#1E90FF' },
  { id: 'emerald_green', name: 'Cyber Emerald', value: '#00FA9A' },
  { id: 'violet_purple', name: 'Neon Orchid', value: '#DA70D6' }
];

export const FACIAL_HAIR_OPTIONS = [
  { id: 'none', name: 'Clean Shaven' },
  { id: 'stubble', name: 'Light Stubble' },
  { id: 'full_beard', name: 'Full Beard' },
  { id: 'mustache', name: 'Classic Mustache' },
  { id: 'goatee', name: 'Sleek Goatee' }
];

export const EYE_COLORS = [
  { id: 'dark_brown', name: 'Deep Mocha', value: '#3E2723' },
  { id: 'emerald_green', name: 'Emerald Green', value: '#2E7D32' },
  { id: 'sapphire_blue', name: 'Sapphire Blue', value: '#1565C0' },
  { id: 'warm_amber', name: 'Warm Amber', value: '#EF6C00' },
  { id: 'hazel', name: 'Vibrant Hazel', value: '#6D4C41' }
];

export const GLASSES_OPTIONS = [
  { id: 'none', name: 'No Glasses' },
  { id: 'round', name: 'Classic Round' },
  { id: 'square', name: 'Modern Square' },
  { id: 'wireframe', name: 'Stylish Wireframe' },
  { id: 'cat_eye', name: 'Trendy Cat-Eye' },
  { id: 'sunglasses', name: 'Cool Sunglasses' }
];

export const HAT_OPTIONS = [
  { id: 'none', name: 'No Hat' },
  { id: 'beanie', name: 'Cozy Beanie' },
  { id: 'snapback', name: 'Sporty Snapback' },
  { id: 'sun_hat', name: 'Floppy Sun Hat' },
  { id: 'fedora', name: 'Classic Fedora' }
];

export const ACCESSORY_OPTIONS = [
  { id: 'none', name: 'No Accessory' },
  { id: 'airpods', name: 'Wireless Earbuds' },
  { id: 'studs', name: 'Silver Studs' },
  { id: 'hoops', name: 'Elegant Gold Hoops' },
  { id: 'bandage', name: 'Cheek Band-Aid' },
  { id: 'headset', name: 'Pro Gaming Headset' }
];

export const EXPRESSIONS = [
  { id: 'smile', name: 'Cheerful Smile' },
  { id: 'smirk', name: 'Confident Smirk' },
  { id: 'neutral', name: 'Neutral Calm' },
  { id: 'laugh', name: 'Excited Laugh' },
  { id: 'wink', name: 'Cute Wink' }
];

export const SHIRT_COLORS = [
  { id: 'indigo', name: 'Royal Indigo', value: '#4F46E5', shadow: '#3730A3' },
  { id: 'coral', name: 'Vibrant Coral', value: '#F87171', shadow: '#B91C1C' },
  { id: 'emerald', name: 'Forest Emerald', value: '#10B981', shadow: '#065F46' },
  { id: 'amber', name: 'Sunset Amber', value: '#F59E0B', shadow: '#92400E' },
  { id: 'crimson', name: 'Crimson Wine', value: '#DC2626', shadow: '#7F1D1D' },
  { id: 'sky_blue', name: 'Sky Blue', value: '#38BDF8', shadow: '#075985' },
  { id: 'charcoal', name: 'Sleek Charcoal', value: '#4B5563', shadow: '#1F2937' },
  { id: 'plum', name: 'Orchid Plum', value: '#8B5CF6', shadow: '#5B21B6' }
];

export const BG_COLORS = [
  { id: 'lavender', name: 'Dreamy Lavender', value: '#E0E7FF' },
  { id: 'peach', name: 'Sweet Peach', value: '#FFEDD5' },
  { id: 'mint', name: 'Cool Mint', value: '#D1FAE5' },
  { id: 'sky', name: 'Pale Sky', value: '#E0F2FE' },
  { id: 'sand', name: 'Warm Sand', value: '#FEF3C7' },
  { id: 'slate', name: 'Slate Gray', value: '#F1F5F9' },
  { id: 'cosmic', name: 'Cosmic Blue', value: '#312E81' }
];

export const ACCENT_COLORS = [
  { id: 'purple', name: 'Neon Purple', value: '#A855F7' },
  { id: 'gold', name: 'Sunlight Gold', value: '#FBBF24' },
  { id: 'pink', name: 'Rose Pink', value: '#F43F5E' },
  { id: 'blue', name: 'Electric Blue', value: '#3B82F6' },
  { id: 'mint_green', name: 'Mint Green', value: '#34D399' }
];

export const ACHIEVEMENT_FRAMES = [
  { id: 'none', name: 'Classic Frame', class: 'border-slate-200/80' },
  { id: 'gold', name: 'Gold Frame', class: 'border-amber-400 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]', icon: Sparkles, color: 'text-amber-500' },
  { id: 'emerald', name: 'Emerald Frame', class: 'border-emerald-500 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]', icon: Shield, color: 'text-emerald-500' },
  { id: 'ocean', name: 'Ocean Wave', class: 'border-cyan-500 bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-600 shadow-[0_0_10px_rgba(6,182,212,0.5)]', icon: Award, color: 'text-cyan-500' },
  { id: 'sunset', name: 'Sunset Aura', class: 'border-rose-400 bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]', icon: Sparkles, color: 'text-rose-500' },
  { id: 'champion', name: 'Champion Crown', class: 'border-purple-600 bg-gradient-to-r from-purple-600 via-violet-400 to-indigo-600 shadow-[0_0_12px_rgba(139,92,246,0.6)]', icon: Crown, color: 'text-purple-600' },
  { id: 'debt_free', name: 'Debt Free Guard', class: 'border-emerald-600 bg-gradient-to-r from-emerald-600 via-green-400 to-teal-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]', icon: Lock, color: 'text-emerald-600' },
  { id: 'challenge_winner', name: 'Challenge Winner', class: 'border-yellow-500 bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-600 shadow-[0_0_12px_rgba(234,179,8,0.6)]', icon: Award, color: 'text-yellow-600' },
  { id: 'holiday', name: 'Holiday Cheer', class: 'border-red-500 bg-gradient-to-r from-red-500 via-orange-300 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]', icon: Gift, color: 'text-red-500' },
  { id: 'anniversary', name: 'Anniversary Laurel', class: 'border-indigo-500 bg-gradient-to-r from-indigo-500 via-sky-300 to-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]', icon: Calendar, color: 'text-indigo-500' }
];

export function getDeterministicAvatarConfig(seed: string): AvatarConfig {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const abs = Math.abs(hash);

  const select = (list: any[], offset: number) => list[(abs + offset) % list.length];

  return {
    useCustomPhoto: false,
    skinTone: select(SKIN_TONES, 1).id,
    hairStyle: select(HAIR_STYLES, 2).id,
    hairColor: select(HAIR_COLORS, 3).id,
    facialHair: select(FACIAL_HAIR_OPTIONS, 4).id,
    eyeColor: select(EYE_COLORS, 5).id,
    glasses: select(GLASSES_OPTIONS, 6).id,
    hat: select(HAT_OPTIONS, 7).id,
    accessories: select(ACCESSORY_OPTIONS, 8).id,
    expression: select(EXPRESSIONS, 9).id,
    shirtColor: select(SHIRT_COLORS, 10).id,
    bgColor: select(BG_COLORS, 11).id,
    accentColor: select(ACCENT_COLORS, 12).id,
    frameId: select(ACHIEVEMENT_FRAMES, 13).id
  };
}

interface UserAvatarProps {
  configOrUrl?: string | AvatarConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  level?: number;
  showLevelBadge?: boolean;
  animateLevelUp?: boolean;
  className?: string;
}

export default function UserAvatar({
  configOrUrl,
  size = 'md',
  level,
  showLevelBadge = false,
  animateLevelUp = false,
  className = ''
}: UserAvatarProps) {
  // Determine standard width & height based on size scale
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8 text-[9px]',
    md: 'w-10 h-10 text-[10px]',
    lg: 'w-14 h-14 text-xs',
    xl: 'w-20 h-20 text-sm',
    '2xl': 'w-28 h-28 text-base'
  };

  const badgeSizeClasses = {
    xs: 'h-3 px-1 text-[6px] -bottom-0.5 -right-0.5',
    sm: 'h-4 px-1 text-[7px] -bottom-0.5 -right-0.5',
    md: 'h-4.5 px-1.5 text-[8px] -bottom-1 -right-1',
    lg: 'h-5 px-1.5 text-[9px] -bottom-1 -right-1',
    xl: 'h-6 px-2 text-[10px] -bottom-1 -right-1',
    '2xl': 'h-7 px-2.5 text-[11px] -bottom-1.5 -right-1.5'
  };

  // Setup config
  let config: AvatarConfig;
  if (typeof configOrUrl === 'object' && configOrUrl !== null) {
    config = configOrUrl;
  } else if (typeof configOrUrl === 'string' && configOrUrl.startsWith('{')) {
    try {
      config = JSON.parse(configOrUrl);
    } catch {
      config = getDeterministicAvatarConfig(configOrUrl || 'default_seed');
    }
  } else if (typeof configOrUrl === 'string' && (configOrUrl.startsWith('http') || configOrUrl.startsWith('data:'))) {
    config = {
      useCustomPhoto: true,
      customPhotoUrl: configOrUrl,
      hairStyle: 'short_crop',
      hairColor: 'black',
      facialHair: 'none',
      skinTone: 'peach',
      eyeColor: 'dark_brown',
      glasses: 'none',
      hat: 'none',
      accessories: 'none',
      expression: 'smile',
      shirtColor: 'indigo',
      bgColor: 'lavender',
      accentColor: 'purple',
      frameId: 'none'
    };
  } else {
    config = getDeterministicAvatarConfig(typeof configOrUrl === 'string' ? configOrUrl : 'finance_player_default');
  }

  const selectedSkin = SKIN_TONES.find(s => s.id === config.skinTone) || SKIN_TONES[2];
  const selectedHairCol = HAIR_COLORS.find(h => h.id === config.hairColor) || HAIR_COLORS[1];
  const selectedEyeCol = EYE_COLORS.find(e => e.id === config.eyeColor) || EYE_COLORS[0];
  const selectedShirt = SHIRT_COLORS.find(s => s.id === config.shirtColor) || SHIRT_COLORS[0];
  const selectedBg = BG_COLORS.find(b => b.id === config.bgColor) || BG_COLORS[5];
  const selectedAccent = ACCENT_COLORS.find(a => a.id === config.accentColor) || ACCENT_COLORS[0];
  const selectedFrame = ACHIEVEMENT_FRAMES.find(f => f.id === config.frameId) || ACHIEVEMENT_FRAMES[0];

  // Dynamic 3D lighting background gradients mapping
  const bgGradients: Record<string, { start: string; end: string }> = {
    lavender: { start: '#F5F7FF', end: '#B5C2FB' },
    peach: { start: '#FFF8F0', end: '#FCA5A5' },
    mint: { start: '#F0FDF4', end: '#86EFAC' },
    sky: { start: '#F0F9FF', end: '#7DD3FC' },
    sand: { start: '#FFFDF5', end: '#FCD34D' },
    slate: { start: '#FAFAFA', end: '#94A3B8' },
    cosmic: { start: '#4F46E5', end: '#1E1B4B' }
  };
  const activeBgGrad = bgGradients[config.bgColor] || { start: '#F8FAFC', end: '#CBD5E1' };

  // Dynamic skin highlights and shadows for 3D modeling
  const skinGradients: Record<string, { highlight: string; base: string; shadow: string }> = {
    pale: { highlight: '#FFF5F1', base: '#FCD7C4', shadow: '#E4A992' },
    fair: { highlight: '#FFF1E8', base: '#FCD1B6', shadow: '#E6A382' },
    peach: { highlight: '#FFF0E4', base: '#F9C2A4', shadow: '#DC8E6D' },
    olive: { highlight: '#F5E2CC', base: '#E1B382', shadow: '#B38150' },
    bronze: { highlight: '#DEC5AF', base: '#C68B59', shadow: '#905E32' },
    deep_bronze: { highlight: '#AA8467', base: '#8A5A36', shadow: '#623E21' },
    cocoa: { highlight: '#7C5744', base: '#5C3826', shadow: '#3E2519' }
  };
  const activeSkinGrad = skinGradients[config.skinTone] || { highlight: '#FFF0E4', base: '#F9C2A4', shadow: '#DC8E6D' };

  // Dynamic 3D hair luster and volume gradients
  const hairGradients: Record<string, { highlight: string; base: string; shadow: string }> = {
    black: { highlight: '#475569', base: '#1E293B', shadow: '#0F172A' },
    dark_brown: { highlight: '#78350F', base: '#451A03', shadow: '#1C1917' },
    golden_blonde: { highlight: '#FDE047', base: '#EAB308', shadow: '#78350F' },
    auburn_red: { highlight: '#EF4444', base: '#991B1B', shadow: '#450A0A' },
    silver_gray: { highlight: '#CBD5E1', base: '#64748B', shadow: '#334155' },
    platinum_blue: { highlight: '#38BDF8', base: '#0284C7', shadow: '#0369A1' },
    emerald_green: { highlight: '#34D399', base: '#059669', shadow: '#064E3B' },
    violet_purple: { highlight: '#C084FC', base: '#7C3AED', shadow: '#4C1D95' }
  };
  const activeHairGrad = hairGradients[config.hairColor] || { highlight: '#475569', base: '#1E293B', shadow: '#0F172A' };

  // Dynamic iris radial gradient setup for stunning Pixar-like depth
  const eyeGradients: Record<string, { center: string; edge: string }> = {
    dark_brown: { center: '#B45309', edge: '#451A03' },
    emerald_green: { center: '#34D399', edge: '#064E3B' },
    sapphire_blue: { center: '#38BDF8', edge: '#1E3A8A' },
    warm_amber: { center: '#FBBF24', edge: '#78350F' },
    hazel: { center: '#A16207', edge: '#27272A' }
  };
  const activeEyeGrad = eyeGradients[config.eyeColor] || { center: '#B45309', edge: '#451A03' };

  // Dynamic 3D lighting on apparel
  const shirtGradients: Record<string, { start: string; end: string }> = {
    indigo: { start: '#818CF8', end: '#312E81' },
    coral: { start: '#FCA5A5', end: '#B91C1C' },
    emerald: { start: '#34D399', end: '#065F46' },
    amber: { start: '#FDE047', end: '#78350F' },
    crimson: { start: '#F87171', end: '#7F1D1D' },
    sky_blue: { start: '#7DD3FC', end: '#0369A1' },
    charcoal: { start: '#94A3B8', end: '#1F2937' },
    plum: { start: '#C084FC', end: '#4C1D95' }
  };
  const activeShirtGrad = shirtGradients[config.shirtColor] || { start: '#818CF8', end: '#312E81' };

  const renderIllustratedAvatar = () => {
    const renderBackHair = () => {
      switch (config.hairStyle) {
        case 'wavy_flow':
          return (
            <path d="M 23 52 C 18 65, 18 80, 24 86 C 30 80, 28 65, 27 52 Z M 77 52 C 82 65, 82 80, 76 86 C 70 80, 72 65, 73 52 Z" fill="url(#hair-grad)" />
          );
        case 'long_locks':
          return (
            <g fill="url(#hair-grad)">
              <path d="M 25 50 C 14 65, 10 88, 20 98 C 27 98, 31 82, 30 50 Z" />
              <path d="M 75 50 C 86 65, 90 88, 80 98 C 73 98, 69 82, 70 50 Z" />
            </g>
          );
        case 'bob':
          return (
            <path d="M 23 50 C 22 64, 25 74, 28 75 C 29 65, 28 52, 28 50 Z M 77 50 C 78 64, 75 74, 72 75 C 71 65, 72 52, 72 50 Z" fill="url(#hair-grad)" />
          );
        case 'dreadlocks':
          return (
            <g fill="url(#hair-grad)">
              <rect x="22" y="45" width="4" height="28" rx="2" transform="rotate(12 22 45)" />
              <rect x="27" y="45" width="4.5" height="34" rx="2.2" transform="rotate(6 27 45)" />
              <rect x="68" y="45" width="4.5" height="34" rx="2.2" transform="rotate(-6 68 45)" />
              <rect x="73" y="45" width="4" height="28" rx="2" transform="rotate(-12 73 45)" />
            </g>
          );
        default:
          return null;
      }
    };

    const renderFrontHair = () => {
      switch (config.hairStyle) {
        case 'short_crop':
          return (
            <path d="M 24 50 C 23 32, 33 22, 50 20 C 67 22, 77 32, 76 50 C 72 41, 62 38, 50 40 C 38 38, 28 41, 24 50 Z" fill="url(#hair-grad)" />
          );
        case 'buzzcut':
          return (
            <path d="M 27 52 C 27 34, 34 24, 50 24 C 66 24, 73 34, 73 52 Z" fill="url(#hair-grad)" opacity="0.8" />
          );
        case 'crew_cut':
          return (
            <g fill="url(#hair-grad)">
              <path d="M 27 48 C 27 34, 34 24, 50 24 C 66 24, 73 34, 73 48 Z" />
              <path d="M 33 24 L 37 16 L 41 24 L 45 15 L 49 24 L 53 15 L 57 24 L 61 16 L 65 24 Z" />
            </g>
          );
        case 'wavy_flow':
          return (
            <path d="M 22 52 C 20 28, 30 18, 50 16 C 70 18, 80 28, 78 52 C 72 40, 60 36, 50 38 C 40 36, 28 40, 22 52 Z" fill="url(#hair-grad)" />
          );
        case 'long_locks':
          return (
            <path d="M 24 50 C 23 28, 33 18, 50 18 C 67 18, 77 28, 76 50 C 72 40, 65 38, 50 40 C 35 38, 28 40, 24 50 Z" fill="url(#hair-grad)" />
          );
        case 'top_knot':
          return (
            <g fill="url(#hair-grad)">
              <path d="M 27 48 C 27 34, 34 24, 50 24 C 66 24, 73 34, 73 48 Z" />
              <circle cx="50" cy="16" r="8" />
            </g>
          );
        case 'curly_afro':
          return (
            <g fill="url(#hair-grad)">
              <ellipse cx="50" cy="38" rx="26" ry="24" />
              <circle cx="28" cy="38" r="9" />
              <circle cx="72" cy="38" r="9" />
              <circle cx="34" cy="24" r="10" />
              <circle cx="66" cy="24" r="10" />
              <circle cx="50" cy="18" r="12" />
            </g>
          );
        case 'pixie':
          return (
            <path d="M 25 48 C 24 30, 32 20, 50 18 C 68 20, 76 30, 75 48 L 71 42 L 62 46 L 50 38 L 40 44 L 32 38 Z" fill="url(#hair-grad)" />
          );
        case 'bob':
          return (
            <path d="M 23 50 C 24 22, 76 22, 77 50 C 79 66, 75 75, 73 75 C 71 60, 70 52, 68 48 C 50 40, 32 48, 30 52 C 28 60, 27 75, 25 75 C 23 75, 21 66, 23 50 Z" fill="url(#hair-grad)" />
          );
        case 'slick_back':
          return (
            <g fill="url(#hair-grad)">
              <path d="M 26 46 C 28 26, 35 22, 50 22 C 65 22, 72 26, 74 46 Q 60 36, 50 36 Q 40 36, 26 46 Z" />
              <path d="M 35 24 Q 40 34 45 24 M 48 24 Q 50 34 52 24 M 55 24 Q 60 34 65 24" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.15" />
            </g>
          );
        case 'side_part':
          return (
            <path d="M 25 48 C 25 28, 34 20, 46 18 C 58 20, 75 26, 75 48 C 66 36, 51 36, 46 38 C 36 34, 28 36, 25 48 Z" fill="url(#hair-grad)" />
          );
        case 'dreadlocks':
          return (
            <path d="M 26 48 C 26 30, 34 24, 50 24 C 66 24, 74 30, 74 48 Z" fill="url(#hair-grad)" />
          );
        case 'bald':
          return (
            <ellipse cx="40" cy="34" rx="8" ry="4" fill="#FFFFFF" opacity="0.15" transform="rotate(-20 40 34)" />
          );
        default:
          return null;
      }
    };

    const renderFacialHair = () => {
      switch (config.facialHair) {
        case 'stubble':
          return (
            <path d="M 28 55 C 28 68, 34 74, 50 75 C 66 74, 72 68, 72 55 C 72 66, 66 71, 50 71 C 34 71, 28 66, 28 55 Z" fill="#1E293B" opacity="0.12" />
          );
        case 'full_beard':
          return (
            <g>
              <path d="M 26 50 C 26 66, 32 78, 50 78 C 68 78, 74 66, 74 50 C 74 55, 68 74, 50 74 C 32 74, 26 55, 26 50 Z" fill="url(#hair-grad)" />
              <path d="M 38 58 Q 50 54 62 58 Q 50 63 38 58" fill="url(#hair-grad)" />
            </g>
          );
        case 'mustache':
          return (
            <path d="M 38 58 Q 50 54 62 58 Q 50 63 38 58" fill="url(#hair-grad)" />
          );
        case 'goatee':
          return (
            <g fill="url(#hair-grad)">
              <path d="M 44 59 Q 50 57 56 59 Q 50 62 44 59" />
              <path d="M 43 64 C 43 75, 57 75, 57 64 C 54 71, 46 71, 43 64 Z" />
            </g>
          );
        default:
          return null;
      }
    };

    const renderMouth = () => {
      switch (config.expression) {
        case 'smile':
          return (
            <g>
              <path d="M 42 62 Q 50 68 58 62" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 41 62.5 Q 40 60.5 42 59" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />
              <path d="M 59 62.5 Q 60 60.5 58 59" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />
            </g>
          );
        case 'smirk':
          return (
            <g>
              <path d="M 43 63.5 Q 52 65.5 57 60" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 58 60.5 Q 59 58.5 57 57.5" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />
            </g>
          );
        case 'neutral':
          return (
            <path d="M 43 63 Q 50 64.5 57 63" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          );
        case 'laugh':
          return (
            <g>
              <path d="M 41 61 Q 50 73 59 61 Z" fill="#450A0A" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 42.2 62 L 57.8 62 C 56 65, 44 65, 42.2 62" fill="#FFFFFF" />
              <path d="M 45 68.5 Q 50 65.5 55 68.5 C 53 71.5 47 71.5 45 68.5" fill="#F87171" />
            </g>
          );
        default:
          return (
            <path d="M 42 62 Q 50 68 58 62" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          );
      }
    };

    const renderGlasses = () => {
      switch (config.glasses) {
        case 'round':
          return (
            <g>
              <circle cx="37" cy="47" r="7.5" stroke="#1E293B" strokeWidth="2.5" fill="none" />
              <circle cx="63" cy="47" r="7.5" stroke="#1E293B" strokeWidth="2.5" fill="none" />
              <line x1="44.5" y1="47" x2="55.5" y2="47" stroke="#1E293B" strokeWidth="2.5" />
              <path d="M 33 46 L 39 40" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
              <path d="M 59 46 L 65 40" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
            </g>
          );
        case 'square':
          return (
            <g>
              <rect x="29" y="40" width="16" height="13" rx="2" stroke="#1E293B" strokeWidth="2.5" fill="none" />
              <rect x="55" y="40" width="16" height="13" rx="2" stroke="#1E293B" strokeWidth="2.5" fill="none" />
              <line x1="45" y1="45" x2="55" y2="45" stroke="#1E293B" strokeWidth="2.5" />
              <path d="M 32 44 L 38 38" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
              <path d="M 58 44 L 64 38" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
            </g>
          );
        case 'wireframe':
          return (
            <g>
              <circle cx="37" cy="47" r="7.5" stroke="#94A3B8" strokeWidth="1.2" fill="none" />
              <circle cx="63" cy="47" r="7.5" stroke="#94A3B8" strokeWidth="1.2" fill="none" />
              <line x1="44.5" y1="47" x2="55.5" y2="47" stroke="#94A3B8" strokeWidth="1.2" />
              <path d="M 33 46 L 39 40" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
              <path d="M 59 46 L 65 40" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
            </g>
          );
        case 'cat_eye':
          return (
            <g>
              <path d="M 28 44 C 32 38, 44 42, 46 47 C 43 52, 31 52, 28 44 Z" stroke="#1E293B" strokeWidth="2" fill="none" />
              <path d="M 72 44 C 68 38, 56 42, 54 47 C 57 52, 69 52, 72 44 Z" stroke="#1E293B" strokeWidth="2" fill="none" />
              <line x1="46" y1="45" x2="54" y2="45" stroke="#1E293B" strokeWidth="2" />
              <path d="M 31 44 L 35 40" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
              <path d="M 65 44 L 69 40" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
            </g>
          );
        case 'sunglasses':
          return (
            <g>
              <rect x="29" y="40" width="17" height="14" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
              <rect x="54" y="40" width="17" height="14" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
              <line x1="46" y1="44" x2="54" y2="44" stroke="#0F172A" strokeWidth="2.5" />
              <path d="M 31 43 L 41 33" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
              <path d="M 56 43 L 66 33" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
            </g>
          );
        default:
          return null;
      }
    };

    const renderHat = () => {
      switch (config.hat) {
        case 'beanie':
          return (
            <g>
              <path d="M 24 38 C 24 16, 32 14, 50 14 C 68 14, 76 16, 76 38 Q 50 36 24 38 Z" fill="#EF4444" />
              <path d="M 22 38 Q 50 35 78 38 C 78 41, 22 41, 22 38 Z" fill="#DC2626" />
              <circle cx="50" cy="11" r="4.5" fill="#FFFFFF" />
            </g>
          );
        case 'snapback':
          return (
            <g>
              <path d="M 25 38 C 25 18, 32 16, 50 16 C 68 16, 75 18, 75 38 Z" fill="#3B82F6" />
              <path d="M 33 38 Q 50 34 67 38 C 65 24, 35 24, 33 38 Z" fill="#1D4ED8" opacity="0.3" />
              <path d="M 16 38 L 48 35 L 52 40 Z" fill="#1D4ED8" stroke="#172554" strokeWidth="0.5" />
            </g>
          );
        case 'sun_hat':
          return (
            <g>
              <path d="M 28 38 C 28 20, 32 18, 50 18 C 68 18, 72 20, 72 38 Z" fill="#FBBF24" />
              <path d="M 28 35 Q 50 33 72 35" stroke="#D97706" strokeWidth="3" fill="none" />
              <ellipse cx="50" cy="38" rx="36" ry="6" fill="#F59E0B" stroke="#D97706" strokeWidth="0.5" />
            </g>
          );
        case 'fedora':
          return (
            <g>
              <path d="M 28 38 C 28 18, 34 16, 50 20 C 66 16, 72 18, 72 38 Z" fill="#374151" />
              <rect x="29" y="34" width="42" height="4" fill="#EF4444" />
              <ellipse cx="50" cy="38" rx="32" ry="5.5" fill="#1F2937" />
            </g>
          );
        default:
          return null;
      }
    };

    const renderAccessories = () => {
      switch (config.accessories) {
        case 'airpods':
          return (
            <g fill="#F1F5F9">
              <rect x="23" y="52" width="2" height="7" rx="1" />
              <circle cx="24" cy="52" r="2" />
              <rect x="75" y="52" width="2" height="7" rx="1" />
              <circle cx="76" cy="52" r="2" />
            </g>
          );
        case 'studs':
          return (
            <g fill="#E2E8F0">
              <circle cx="24" cy="57" r="1.8" />
              <circle cx="76" cy="57" r="1.8" />
              <circle cx="24.3" cy="56.7" r="0.5" fill="#FFFFFF" />
              <circle cx="76.3" cy="56.7" r="0.5" fill="#FFFFFF" />
            </g>
          );
        case 'hoops':
          return (
            <g stroke="#FBBF24" strokeWidth="1.5" fill="none">
              <circle cx="23" cy="58" r="3.5" />
              <circle cx="77" cy="58" r="3.5" />
            </g>
          );
        case 'bandage':
          return (
            <rect x="58" y="58" width="8" height="4" rx="1.2" fill="#FDE047" stroke="#EAB308" strokeWidth="0.5" transform="rotate(25 62 60)" />
          );
        case 'headset':
          return (
            <g>
              <path d="M 23 52 Q 23 16 50 16 Q 77 16 77 52" stroke="#334155" strokeWidth="3.5" fill="none" />
              <rect x="19" y="45" width="6" height="14" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              <rect x="75" y="45" width="6" height="14" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              <rect x="21" y="47" width="2" height="10" rx="1" fill="#475569" />
              <rect x="77" y="47" width="2" height="10" rx="1" fill="#475569" />
              <path d="M 22 56 Q 34 63 38 61" stroke="#334155" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <circle cx="38" cy="61" r="2" fill="#1E293B" />
            </g>
          );
        default:
          return null;
      }
    };

    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="avatar-circle">
            <circle cx="50" cy="50" r="48" />
          </clipPath>
          
          {/* Background Radial Studio Lighting */}
          <radialGradient id="bg-grad" cx="50%" cy="50%" r="70%" fx="50%" fy="35%">
            <stop offset="0%" stopColor={activeBgGrad.start} />
            <stop offset="100%" stopColor={activeBgGrad.end} />
          </radialGradient>

          {/* Skin 3D Keylight Shading */}
          <linearGradient id="skin-grad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={activeSkinGrad.highlight} />
            <stop offset="60%" stopColor={activeSkinGrad.base} />
            <stop offset="100%" stopColor={activeSkinGrad.shadow} />
          </linearGradient>

          {/* Neck Shading (casts shadow under chin) */}
          <linearGradient id="neck-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeSkinGrad.shadow} />
            <stop offset="100%" stopColor={activeSkinGrad.base} />
          </linearGradient>

          {/* Hair 3D Highlight & Depth */}
          <linearGradient id="hair-grad" x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor={activeHairGrad.highlight} />
            <stop offset="50%" stopColor={activeHairGrad.base} />
            <stop offset="100%" stopColor={activeHairGrad.shadow} />
          </linearGradient>

          {/* Shirt 3D Modeling */}
          <linearGradient id="shirt-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeShirtGrad.start} stopOpacity="0.95" />
            <stop offset="100%" stopColor={activeShirtGrad.end} />
          </linearGradient>

          {/* Iris Radial Shading */}
          <radialGradient id="iris-grad" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor={activeEyeGrad.center} />
            <stop offset="70%" stopColor={activeEyeGrad.center} />
            <stop offset="100%" stopColor={activeEyeGrad.edge} />
          </radialGradient>
        </defs>

        <g clipPath="url(#avatar-circle)">
          {/* BACKGROUND LAYER */}
          <rect width="100" height="100" fill="url(#bg-grad)" />
          
          {/* Subtle Ambient Portrait Backlight */}
          <circle cx="50" cy="45" r="32" fill={selectedAccent.value} opacity="0.18" />
          <path d="M 0 100 L 100 0 L 100 100 Z" fill={selectedAccent.value} opacity="0.06" />

          {/* BACK HAIR LAYER */}
          {renderBackHair()}

          {/* NECK LAYER */}
          <rect x="43" y="68" width="14" height="15" rx="5" fill="url(#neck-grad)" />
          {/* Under-chin Drop Shadow */}
          <path d="M 43 68 Q 50 75 57 68 L 57 74 L 43 74 Z" fill="#000000" opacity="0.15" />

          {/* SHIRT LAYER */}
          <path d="M 18 100 Q 18 80 50 82 Q 82 80 82 100 Z" fill="url(#shirt-grad)" />
          {/* Neckline highlight boundary */}
          <path d="M 41 82 Q 50 89 59 82 C 50 84, 41 82, 41 82" fill="none" stroke={activeSkinGrad.shadow} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

          {/* HEAD / FACE LAYER */}
          <path d="M 50 24 C 34 24, 27 34, 27 52 C 27 67, 35 76, 50 76 C 65 76, 73 67, 73 52 C 73 34, 66 24, 50 24 Z" fill="url(#skin-grad)" />

          {/* CHEEK BLUSH */}
          <circle cx="34" cy="58" r="5" fill="#EF4444" opacity="0.10" />
          <circle cx="66" cy="58" r="5" fill="#EF4444" opacity="0.10" />

          {/* EARS */}
          <path d="M 27 45 C 22 45, 21 57, 27 59 Z" fill="url(#skin-grad)" />
          <path d="M 26 48 C 24 48, 23 54, 26 55" fill="none" stroke={activeSkinGrad.shadow} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 73 45 C 78 45, 79 57, 73 59 Z" fill="url(#skin-grad)" />
          <path d="M 74 48 C 76 48, 77 54, 74 55" fill="none" stroke={activeSkinGrad.shadow} strokeWidth="1.5" strokeLinecap="round" />

          {/* NOSE */}
          <path d="M 47 45 L 47 55 Q 50 57 53 55 L 53 45" fill="#000000" opacity="0.04" />
          <path d="M 46 55 C 46 58, 54 58, 54 55" fill="none" stroke={activeSkinGrad.shadow} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="54" r="1.2" fill="#FFFFFF" opacity="0.35" />

          {/* EYES LAYER */}
          {config.expression === 'wink' ? (
            <>
              {/* Left Eye: Open & Glossy */}
              <ellipse cx="38" cy="47" rx="5.5" ry="4.2" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" strokeOpacity="0.08" />
              <circle cx="38" cy="47" r="3.2" fill="url(#iris-grad)" />
              <circle cx="38" cy="47" r="1.6" fill="#0F172A" />
              <circle cx="36.5" cy="45.5" r="0.8" fill="#FFFFFF" opacity="0.9" />
              <circle cx="39.2" cy="48.2" r="0.4" fill="#FFFFFF" opacity="0.6" />
              <path d="M 31 46 Q 38 41 45 46" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              {/* Right Eye: Happy Wink */}
              <path d="M 55 46 Q 62 51 69 46" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              {/* Left Eye */}
              <ellipse cx="38" cy="47" rx="5.5" ry="4.2" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" strokeOpacity="0.08" />
              <circle cx="38" cy="47" r="3.2" fill="url(#iris-grad)" />
              <circle cx="38" cy="47" r="1.6" fill="#0F172A" />
              <circle cx="36.5" cy="45.5" r="0.8" fill="#FFFFFF" opacity="0.9" />
              <circle cx="39.2" cy="48.2" r="0.4" fill="#FFFFFF" opacity="0.6" />
              <path d="M 31 46 Q 38 41 45 46" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              {/* Right Eye */}
              <ellipse cx="62" cy="47" rx="5.5" ry="4.2" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" strokeOpacity="0.08" />
              <circle cx="62" cy="47" r="3.2" fill="url(#iris-grad)" />
              <circle cx="62" cy="47" r="1.6" fill="#0F172A" />
              <circle cx="60.5" cy="45.5" r="0.8" fill="#FFFFFF" opacity="0.9" />
              <circle cx="63.2" cy="48.2" r="0.4" fill="#FFFFFF" opacity="0.6" />
              <path d="M 55 46 Q 62 41 69 46" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* EYEBROWS */}
          <path d="M 31 41 Q 38 37 44 40" stroke="url(#hair-grad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 56 40 Q 62 37 69 41" stroke="url(#hair-grad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* EXPRESSION / MOUTH */}
          {renderMouth()}

          {/* FACIAL HAIR */}
          {renderFacialHair()}

          {/* FRONT HAIR LAYER */}
          {renderFrontHair()}

          {/* GLASSES LAYER */}
          {renderGlasses()}

          {/* HAT LAYER */}
          {renderHat()}

          {/* ACCESSORIES */}
          {renderAccessories()}
        </g>
      </svg>
    );
  };

  const glassBadgeClasses = `absolute font-display font-black text-white bg-gradient-to-br from-indigo-500/90 via-purple-500/80 to-pink-500/90 border border-white/50 backdrop-blur-sm shadow-[0_2px_8px_rgba(99,102,241,0.45)] rounded-full flex items-center justify-center tracking-tight`;

  return (
    <div className={`relative inline-block select-none ${className}`} id="user-avatar-container">
      {/* FRAME WRAPPER */}
      <div
        className={`rounded-full flex items-center justify-center p-[2.5px] transition-all duration-300 ${
          selectedFrame.id !== 'none'
            ? `border-[3.5px] ${selectedFrame.class}`
            : 'border border-slate-200 bg-white shadow-3xs'
        } ${sizeClasses[size]}`}
        id={`avatar-frame-${selectedFrame.id}`}
      >
        <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100 flex items-center justify-center shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)]">
          {config.useCustomPhoto && config.customPhotoUrl ? (
            <img
              src={config.customPhotoUrl}
              alt="User uploaded custom"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            renderIllustratedAvatar()
          )}
        </div>
      </div>

      {/* Frame indicator icon (e.g. Sparkle, Trophy, Lock) */}
      {selectedFrame.id !== 'none' && selectedFrame.icon && (
        <div
          className={`absolute -top-1.5 -left-1.5 bg-white rounded-full p-0.5 shadow-xs border border-slate-100 ${selectedFrame.color}`}
          id="avatar-frame-icon-badge"
        >
          {React.createElement(selectedFrame.icon, { className: 'w-3 h-3' })}
        </div>
      )}

      {/* XP LEVEL BADGE OVERLAY - Circular glass-morphic gradient style */}
      {showLevelBadge && level !== undefined && (
        <motion.div
          initial={animateLevelUp ? { scale: 0.5, y: 10, opacity: 0 } : { scale: 1 }}
          animate={animateLevelUp ? { scale: [1, 1.3, 1.1, 1.25, 1], rotate: [0, -8, 8, -5, 0], y: 0, opacity: 1 } : { scale: 1, rotate: 0, y: 0, opacity: 1 }}
          transition={animateLevelUp ? { duration: 1.2, ease: "easeInOut" } : { type: 'spring', stiffness: 300, damping: 15 }}
          className={`${glassBadgeClasses} ${badgeSizeClasses[size]}`}
          id="avatar-xp-level-badge"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
        >
          Lv.{level}
        </motion.div>
      )}
    </div>
  );
}
