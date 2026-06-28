import { useState, ReactNode } from 'react';
import { motion, useAnimation, PanInfo } from 'motion/react';

interface SwipeAction {
  id: string;
  label: string;
  icon: any;
  colorClass: string;
  onClick: () => void;
}

interface SwipeActionContainerProps {
  id: string;
  leftActions?: SwipeAction[]; // Triggers when dragging right (revealing left actions)
  rightActions?: SwipeAction[]; // Triggers when dragging left (revealing right actions)
  children: ReactNode;
}

export default function SwipeActionContainer({
  id,
  leftActions = [],
  rightActions = [],
  children
}: SwipeActionContainerProps) {
  const controls = useAnimation();
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Trigger tactile vibration if supported
  const triggerHaptic = () => {
    try {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(15);
      }
    } catch (e) {}
  };

  const handleDrag = (_event: any, info: PanInfo) => {
    setSwipeOffset(info.offset.x);
  };

  const handleDragEnd = async (_event: any, info: PanInfo) => {
    const swipeThreshold = 75; // px swiped to snap open actions
    const velocityThreshold = 150; // px/s

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swiped Right -> Reveal Left Actions (if any)
      if (leftActions.length > 0) {
        triggerHaptic();
        // Snap open to reveal
        const width = leftActions.length * 52;
        await controls.start({ x: width });
      } else {
        // Bounce back
        await controls.start({ x: 0 });
      }
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      // Swiped Left -> Reveal Right Actions (if any)
      if (rightActions.length > 0) {
        triggerHaptic();
        // Snap open to reveal (negative width)
        const width = rightActions.length * 52;
        await controls.start({ x: -width });
      } else {
        // Bounce back
        await controls.start({ x: 0 });
      }
    } else {
      // Swipe was too shallow, bounce back to center
      await controls.start({ x: 0 });
    }
    setSwipeOffset(0);
  };

  const triggerAction = (action: SwipeAction) => {
    triggerHaptic();
    action.onClick();
    // Snap close
    controls.start({ x: 0 });
  };

  const leftWidth = leftActions.length * 52;
  const rightWidth = rightActions.length * 52;

  return (
    <div className="relative overflow-hidden rounded-2xl w-full" id={`swipe-wrap-${id}`}>
      {/* Background Visual Trays (Underneath swiped element) */}
      <div className="absolute inset-0 z-0 flex items-center justify-between" id={`swipe-underlay-${id}`}>
        {/* Left Drawer (exposed on dragging right) */}
        <div 
          className="h-full flex items-center pl-2 bg-gradient-to-r from-slate-50 to-slate-100/30 border-l border-slate-100"
          style={{ width: `${leftWidth}px` }}
        >
          {leftActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => triggerAction(action)}
                className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 ${action.colorClass}`}
                title={action.label}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[8px] font-sans font-bold uppercase tracking-tight mt-0.5">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Drawer (exposed on dragging left) */}
        <div 
          className="h-full flex items-center justify-end pr-2 bg-gradient-to-l from-slate-50 to-slate-100/30 border-r border-slate-100"
          style={{ width: `${rightWidth}px` }}
        >
          {rightActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => triggerAction(action)}
                className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 ${action.colorClass}`}
                title={action.label}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[8px] font-sans font-bold uppercase tracking-tight mt-0.5">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Foreground List Item Component */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -rightWidth, right: leftWidth }}
        dragElastic={0.15}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative z-10 w-full"
        style={{ x: 0 }}
        id={`swipe-foreground-${id}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
