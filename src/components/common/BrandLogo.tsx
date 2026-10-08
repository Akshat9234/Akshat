import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'header' | 'icon-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  onClick
}) => {
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-7 h-7';
      case 'lg': return 'w-11 h-11';
      case 'xl': return 'w-14 h-14';
      case 'md':
      default: return 'w-9 h-9';
    }
  };

  const getWordmarkSize = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case 'md':
      default: return 'text-base';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      role="banner"
    >
      {/* Icon: Upward career path with connected nodes forming 'C' + AI spark */}
      <div className={`relative ${getIconSize()} rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 p-[1px] shadow-[0_0_20px_rgba(6,182,212,0.3)] flex-shrink-0`}>
        <div className="w-full h-full rounded-[11px] bg-[#070A12] border border-white/10 flex items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full p-0.5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bl-path" x1="100%" y1="80%" x2="0%" y2="20%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="45%" stopColor="#06B6D4" />
                <stop offset="85%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
            </defs>

            {/* Path forming 'C' */}
            <path
              d="M 68 76 C 42 76, 25 64, 25 49 C 25 34, 42 24, 68 24"
              stroke="url(#bl-path)"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Nodes */}
            <circle cx="68" cy="76" r="4.5" fill="#070A12" stroke="#3B82F6" strokeWidth="2.5" />
            <circle cx="68" cy="76" r="2" fill="#60A5FA" />

            <circle cx="37" cy="67" r="4" fill="#070A12" stroke="#06B6D4" strokeWidth="2.2" />
            <circle cx="37" cy="67" r="1.8" fill="#22D3EE" />

            <circle cx="25" cy="49" r="4.5" fill="#070A12" stroke="#38BDF8" strokeWidth="2.5" />
            <circle cx="25" cy="49" r="2.2" fill="#FFFFFF" />

            <circle cx="37" cy="31" r="4" fill="#070A12" stroke="#8B5CF6" strokeWidth="2.2" />
            <circle cx="37" cy="31" r="1.8" fill="#C084FC" />

            <circle cx="68" cy="24" r="5" fill="#070A12" stroke="#C084FC" strokeWidth="2.5" />
            <circle cx="68" cy="24" r="2.2" fill="#F472B6" />

            {/* AI Spark Star at Destination */}
            <g transform="translate(77, 16)">
              <path
                d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z"
                fill="#FFFFFF"
              />
              <circle cx="0" cy="0" r="1.5" fill="#38BDF8" />
            </g>
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col leading-tight">
          <div className={`${getWordmarkSize()} font-extrabold tracking-tight text-white flex items-center gap-1.5`}>
            <span>CareerQuest</span>
            <span className="text-cyan-400 font-black px-1 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/25 text-[0.72em] tracking-wider uppercase">
              AI
            </span>
          </div>
          {variant === 'full' && (
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              Your dream career. Reverse engineered.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
