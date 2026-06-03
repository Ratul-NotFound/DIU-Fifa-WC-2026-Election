import React from 'react';

interface FootballLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function FootballLogo({ className, style }: FootballLogoProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block',
        ...style 
      }}
    >
      {/* Outer shield/badge boundary */}
      <path 
        d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 12 12 22 12 22Z" 
        fill="rgba(59, 130, 246, 0.15)" 
        stroke="var(--fifa-cyan)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Center soccer ball shape */}
      <circle 
        cx="12" 
        cy="11" 
        r="4.5" 
        stroke="var(--text-primary)" 
        strokeWidth="1.5" 
        fill="rgba(16, 25, 53, 0.9)"
      />
      {/* Ball panels */}
      <path 
        d="M12 6.5V8.5M8.2 9L10 10M15.8 9L14 10M9 13.5L10.5 12.5M15 13.5L13.5 12.5" 
        stroke="var(--text-secondary)" 
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Modern speed wings (analytics vibe) */}
      <path 
        d="M2.5 8H5M19 8H21.5M1.5 11.5H4.5M19.5 11.5H22.5" 
        stroke="var(--fifa-purple)" 
        strokeWidth="1" 
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Ribbon details / host stars */}
      <path 
        d="M8.5 18L12 16.5L15.5 18" 
        stroke="var(--fifa-neon)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
