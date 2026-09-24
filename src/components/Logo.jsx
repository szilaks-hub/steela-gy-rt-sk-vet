import React from "react";
import { motion } from "framer-motion";

function Mark({ idp, size = 36, glow = true }) {
  const steel = `${idp}-steel`;
  const orange = `${idp}-orange`;
  const ring = `${idp}-ring`;
  const sglow = `${idp}-sglow`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={steel} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2F3F5" />
          <stop offset="0.5" stopColor="#8E9196" />
          <stop offset="1" stopColor="#C7C9CC" />
        </linearGradient>
        <linearGradient id={orange} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFB347" />
          <stop offset="0.5" stopColor="#FF9500" />
          <stop offset="1" stopColor="#B36A00" />
        </linearGradient>
        <radialGradient id={ring} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor="#FF9500" stopOpacity="0" />
          <stop offset="1" stopColor="#FF9500" stopOpacity="0.28" />
        </radialGradient>
        <filter id={sglow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="49" fill={`url(#${ring})`} />
      <circle cx="50" cy="50" r="45" stroke={`url(#${orange})`} strokeWidth="1.4" fill="none" />
      {glow && (
        <path
          d="M 66 28 C 40 28, 30 40, 50 50 C 70 60, 60 72, 34 72"
          stroke="#FF9500" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.55"
          filter={`url(#${sglow})`}
        />
      )}
      <path
        d="M 66 28 C 40 28, 30 40, 50 50 C 70 60, 60 72, 34 72"
        stroke={`url(#${steel})`} strokeWidth="7" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

function Wordmark({ size = 18 }) {
  return (
    <span className="font-semibold tracking-tight select-none" style={{ fontSize: size, lineHeight: 1 }}>
      <span style={{ color: "#1A1A1A" }}>STEEL</span>
      <span
        style={{
          background: "linear-gradient(135deg, #1A1A1A 28%, #FF9500 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        A
      </span>
    </span>
  );
}

export default function Logo({ variant = "full", size = 36, className = "", animated = true }) {
  const idp = React.useId().replace(/:/g, "");

  if (variant === "watermark") {
    return (
      <div className={`pointer-events-none ${className}`} style={{ opacity: 0.05 }}>
        <div className={animated ? "animate-steel-spin-slow" : ""} style={{ transformOrigin: "center" }}>
          <Mark idp={idp} size={size} glow />
        </div>
      </div>
    );
  }

  if (variant === "mark") {
    return (
      <motion.div
        whileHover={animated ? { scale: 1.08, rotate: 3 } : undefined}
        transition={{ type: "spring", stiffness: 320, damping: 14 }}
        className={className}
      >
        <Mark idp={idp} size={size} glow={animated} />
      </motion.div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <motion.div
        whileHover={animated ? { scale: 1.08, rotate: 3 } : undefined}
        transition={{ type: "spring", stiffness: 320, damping: 14 }}
      >
        <Mark idp={idp} size={size} glow={animated} />
      </motion.div>
      <Wordmark size={Math.round(size * 0.5)} />
    </div>
  );
}