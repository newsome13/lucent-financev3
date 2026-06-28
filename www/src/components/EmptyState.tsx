import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentColorClass?: string; // e.g., 'text-indigo-600'
  bgColorClass?: string; // e.g., 'bg-indigo-50/50'
  borderColorClass?: string; // e.g., 'border-indigo-100/50'
  actionButton?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  accentColorClass = 'text-indigo-600',
  bgColorClass = 'bg-indigo-50/50',
  borderColorClass = 'border-indigo-100/50',
  actionButton
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center text-center justify-center p-8 py-12 rounded-3xl border border-dashed border-slate-200/80 bg-linear-to-b from-white to-slate-50/20 shadow-xs`}
    >
      <div className={`p-4 rounded-3xl border ${bgColorClass} ${borderColorClass} ${accentColorClass} mb-4 relative overflow-hidden flex items-center justify-center shadow-xs`}>
        {/* Abstract vector backgrounds for custom illustrations look */}
        <div className="absolute inset-0 opacity-10 bg-radial from-current to-transparent" />
        <Icon className="w-7 h-7 relative z-10 animate-pulse" />
      </div>
      <h4 className="font-display font-black text-slate-800 text-sm leading-snug">{title}</h4>
      <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">{description}</p>
      {actionButton && (
        <div className="mt-5">
          {actionButton}
        </div>
      )}
    </motion.div>
  );
}
