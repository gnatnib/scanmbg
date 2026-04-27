"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MbgScoreGauge({ score, grade, gradeLabel, gradeColor, animate = true }) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) return;
    const duration = 1200;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score * 10) / 10);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score, animate]);

  const radius = 58;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const startAngle = 135;
  const totalAngle = 270;
  const scoreAngle = (displayScore / 10) * totalAngle;
  const dashOffset = circumference - (scoreAngle / 360) * circumference;
  const bgDashOffset = circumference - (totalAngle / 360) * circumference;

  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.9 } : {}}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
          <circle
            cx={radius} cy={radius} r={normalizedRadius}
            fill="none" stroke="#E8E8E3" strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={bgDashOffset}
            transform={`rotate(${startAngle} ${radius} ${radius})`}
          />
          <circle
            cx={radius} cy={radius} r={normalizedRadius}
            fill="none" stroke={gradeColor} strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(${startAngle} ${radius} ${radius})`}
            style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold tabular-nums text-text">
            {displayScore.toFixed(1)}
          </span>
          <span className="text-[10px] font-medium text-text-tertiary -mt-1">/10</span>
        </div>
      </div>

      <motion.span
        initial={animate ? { opacity: 0, y: 6 } : {}}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-1 rounded-full px-3 py-1 text-[11px] font-bold"
        style={{ backgroundColor: `${gradeColor}15`, color: gradeColor }}
      >
        {gradeLabel}
      </motion.span>
    </motion.div>
  );
}
