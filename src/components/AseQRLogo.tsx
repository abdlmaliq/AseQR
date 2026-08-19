import React from 'react';

interface AseQRLogoProps {
  className?: string;
  size?: number | string;
}

export function AseQRLogo({ className = 'w-10 h-10', size }: AseQRLogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      fill="none"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id="aseqrBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0a0f"/>
          <stop offset="100%" stopColor="#121226"/>
        </linearGradient>
        <linearGradient id="aseqrNeon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1"/>
          <stop offset="50%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
        <linearGradient id="aseqrCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee"/>
          <stop offset="100%" stopColor="#38bdf8"/>
        </linearGradient>
        <filter id="aseqrGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      {/* App Icon Squircle Background */}
      <rect width="512" height="512" rx="128" fill="url(#aseqrBg)"/>
      <rect width="508" height="508" x="2" y="2" rx="126" stroke="url(#aseqrNeon)" strokeWidth="4" strokeOpacity="0.45"/>

      {/* Geometric "A" Fused with QR / Tech Nodes */}
      <g filter="url(#aseqrGlow)">
        {/* Main Apex & Diagonal Legs of "A" */}
        <path d="M256 96 L128 392 L196 392 L228 316 L284 316 L316 392 L384 392 Z" fill="url(#aseqrNeon)"/>
        
        {/* Triangular Negative Space in "A" */}
        <polygon points="256,180 234,260 278,260" fill="#0a0a0f"/>

        {/* High-tech QR Matrix Finder Pattern at Top Apex */}
        <rect x="238" y="112" width="36" height="36" rx="8" fill="#22d3ee"/>
        <rect x="246" y="120" width="20" height="20" rx="4" fill="#0a0a0f"/>
        <rect x="252" y="126" width="8" height="8" rx="2" fill="#22d3ee"/>

        {/* Bottom Left Corner QR Finder Pattern */}
        <rect x="136" y="328" width="56" height="56" rx="14" fill="url(#aseqrCyan)"/>
        <rect x="146" y="338" width="36" height="36" rx="8" fill="#0d0d1a"/>
        <rect x="156" y="348" width="16" height="16" rx="4" fill="#22d3ee"/>

        {/* Bottom Right Corner QR Finder Pattern */}
        <rect x="320" y="328" width="56" height="56" rx="14" fill="url(#aseqrCyan)"/>
        <rect x="330" y="338" width="36" height="36" rx="8" fill="#0d0d1a"/>
        <rect x="340" y="348" width="16" height="16" rx="4" fill="#22d3ee"/>

        {/* Central Tech Bridge Matrix Dots */}
        <rect x="236" y="292" width="18" height="18" rx="4" fill="#38bdf8"/>
        <rect x="258" y="292" width="18" height="18" rx="4" fill="#818cf8"/>
      </g>

      {/* Glowing Accent Highlights */}
      <circle cx="256" cy="130" r="3" fill="#ffffff"/>
      <circle cx="164" cy="356" r="3" fill="#ffffff"/>
      <circle cx="348" cy="356" r="3" fill="#ffffff"/>
    </svg>
  );
}
