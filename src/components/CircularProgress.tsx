import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number; // width/height in px, default 80
  strokeWidth?: number; // default 8
  colorClass?: string; // tailwind stroke-color (use stroke classes if needed, or inline color)
  strokeColor?: string; // Hex or css color
  trailColor?: string; // Hex or css color
  glow?: boolean;
  children?: ReactNode;
}

export default function CircularProgress({
  value,
  size = 72,
  strokeWidth = 7,
  strokeColor = '#3b82f6', // Default blue-500
  trailColor = '#f1f5f9', // Default slate-100
  glow = false,
  children
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full" style={{ width: size, height: size }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trailColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="transparent"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
