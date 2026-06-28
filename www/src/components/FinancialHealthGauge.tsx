import { motion } from 'motion/react';

interface FinancialHealthGaugeProps {
  score: number; // 0 to 100
  grade: string;
  gradeLabel: string;
}

export default function FinancialHealthGauge({ score, grade, gradeLabel }: FinancialHealthGaugeProps) {
  // Determine color and human friendly label based on score
  let activeColor = '#ef4444'; // Red
  let glowColor = 'rgba(239, 68, 68, 0.25)';
  let statusText = 'Needs Attention';

  if (score >= 85) {
    activeColor = '#10b981'; // Green
    glowColor = 'rgba(16, 185, 129, 0.25)';
    statusText = 'Excellent';
  } else if (score >= 70) {
    activeColor = '#3b82f6'; // Blue
    glowColor = 'rgba(59, 130, 246, 0.25)';
    statusText = 'Good';
  } else if (score >= 50) {
    activeColor = '#f97316'; // Orange
    glowColor = 'rgba(249, 115, 22, 0.25)';
    statusText = 'Improving';
  }

  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Arc circumference (half circle)
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Pointer position calculation
  const angleDeg = 180 - (score / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const pointerX = size / 2 + radius * Math.cos(angleRad);
  const pointerY = size / 2 - radius * Math.sin(angleRad);

  return (
    <div className="flex flex-col items-center justify-center p-3" id="financial-health-gauge-box">
      <div className="relative" style={{ width: size, height: size / 2 + 15 }}>
        <svg width={size} height={size / 2 + 15} className="mx-auto overflow-visible">
          <defs>
            <linearGradient id="health-gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" /> {/* Red */}
              <stop offset="35%" stopColor="#f97316" /> {/* Orange */}
              <stop offset="70%" stopColor="#3b82f6" /> {/* Blue */}
              <stop offset="100%" stopColor="#10b981" /> {/* Green */}
            </linearGradient>
            <filter id="pointer-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Arc */}
          <path
            d={`M ${strokeWidth / 2 + 4} ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2 - 4} ${size / 2 + 10}`}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored Value Arc with Gradient */}
          <motion.path
            d={`M ${strokeWidth / 2 + 4} ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2 - 4} ${size / 2 + 10}`}
            fill="none"
            stroke="url(#health-gauge-grad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Animated Needle Marker Pointer */}
          <motion.circle
            cx={pointerX}
            cy={pointerY + 10}
            r={7}
            fill={activeColor}
            stroke="#ffffff"
            strokeWidth={2}
            filter="url(#pointer-glow)"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          />
        </svg>

        {/* Center Text displaying Score */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end text-center">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-display font-black tracking-tight text-slate-800 leading-none"
          >
            {score}
          </motion.span>
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mt-1">
            SCORE
          </span>
        </div>
      </div>

      <div className="text-center mt-4 space-y-1.5">
        <div 
          className="text-xs font-bold font-display px-3 py-1 rounded-full border shadow-2xs inline-block transition-colors duration-300"
          style={{ 
            color: activeColor, 
            borderColor: `${activeColor}30`, 
            backgroundColor: `${activeColor}08`,
            boxShadow: `0 4px 12px ${glowColor}`
          }}
        >
          {grade} • {statusText}
        </div>
        <p className="text-[10px] text-slate-500 font-medium max-w-[200px] leading-normal mx-auto">
          {gradeLabel}
        </p>
      </div>
    </div>
  );
}
