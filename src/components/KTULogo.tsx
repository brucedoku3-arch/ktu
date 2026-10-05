import React, { useState } from 'react';

export const KTU_LOGO_URL = '/ktu_logo.png';

interface KTULogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textVariant?: 'short' | 'full' | 'subtext';
  invertedText?: boolean;
  alt?: string;
  badge?: string;
  onClick?: () => void;
}

export const KTULogoVector: React.FC<{ size?: number | string; className?: string }> = ({
  size = 48,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Koforidua Technical University Official Crest"
    >
      <defs>
        {/* Arc path for the upper circular text */}
        <path
          id="ktu-top-arc"
          d="M 50,200 A 150,150 0 1,1 350,200"
          fill="none"
        />
        {/* Arc path for the bottom banner ribbon text */}
        <path
          id="ktu-bottom-arc"
          d="M 65,310 Q 200,380 335,310"
          fill="none"
        />
        <linearGradient id="ktu-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="ktu-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f3d67" />
          <stop offset="100%" stopColor="#092742" />
        </linearGradient>
      </defs>

      {/* Outer Seal Circle */}
      <circle cx="200" cy="200" r="190" fill="url(#ktu-blue-grad)" stroke="#092742" strokeWidth="4" />
      <circle cx="200" cy="200" r="182" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.85" />

      {/* Upper Arch Text: KOFORIDUA TECHNICAL UNIVERSITY */}
      <text
        fill="#ffffff"
        fontSize="21"
        fontFamily="'Arial Black', 'Montserrat', Impact, sans-serif"
        fontWeight="900"
        letterSpacing="2.8"
      >
        <textPath
          href="#ktu-top-arc"
          startOffset="50%"
          textAnchor="middle"
        >
          KOFORIDUA TECHNICAL UNIVERSITY
        </textPath>
      </text>

      {/* Inner Blue Separator Line */}
      <circle cx="200" cy="200" r="136" fill="none" stroke="#ffffff" strokeWidth="3" />

      {/* Orange Gear Cogwheel Body */}
      <g>
        {/* Gear disc base */}
        <circle cx="200" cy="200" r="130" fill="url(#ktu-gold-grad)" stroke="#092742" strokeWidth="2" />
        
        {/* 20 Cogwheel Teeth around circumference */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i * 360) / 20;
          return (
            <rect
              key={i}
              x="191"
              y="62"
              width="18"
              height="20"
              rx="2"
              fill="#ea580c"
              stroke="#092742"
              strokeWidth="1.5"
              transform={`rotate(${angle} 200 200)`}
            />
          );
        })}
      </g>

      {/* Central White Disc for Adinkra Symbol */}
      <circle cx="200" cy="200" r="92" fill="#ffffff" stroke="#092742" strokeWidth="3" />

      {/* Traditional Ghanaian Adinkra Symbol of Knowledge & Wisdom ("Nea Onnim No Sua A, Ohu") */}
      <g transform="translate(142, 142) scale(0.58)" stroke="#111827" strokeWidth="11" strokeLinecap="square" fill="none">
        {/* Central Square Grid and Intersecting Knowledge Pillars */}
        <rect x="35" y="35" width="130" height="130" strokeWidth="12" />
        <line x1="100" y1="20" x2="100" y2="180" strokeWidth="12" />
        <line x1="20" y1="100" x2="180" y2="100" strokeWidth="12" />

        {/* Outer Interlocking Bracket Bars */}
        <path d="M 0,45 L 35,45 M 0,155 L 35,155 M 0,45 L 0,155" strokeWidth="10" />
        <path d="M 200,45 L 165,45 M 200,155 L 165,155 M 200,45 L 200,155" strokeWidth="10" />
        <path d="M 45,0 L 45,35 M 155,0 L 155,35 M 45,0 L 155,0" strokeWidth="10" />
        <path d="M 45,200 L 45,165 M 155,200 L 155,165 M 45,200 L 155,200" strokeWidth="10" />

        {/* Internal Square Accents */}
        <rect x="52" y="52" width="38" height="38" fill="#111827" />
        <rect x="110" y="110" width="38" height="38" fill="#111827" />
        <rect x="110" y="52" width="38" height="38" fill="#111827" />
        <rect x="52" y="110" width="38" height="38" fill="#111827" />
      </g>

      {/* Bottom Motto Banner Ribbon: INNOVATING FOR DEVELOPMENT */}
      <g>
        {/* Banner Shadow & Body */}
        <path
          d="M 38,300 L 78,272 L 95,302 Q 200,358 305,302 L 322,272 L 362,300 L 332,364 Q 200,404 68,364 Z"
          fill="#ffffff"
          stroke="#092742"
          strokeWidth="4"
        />
        {/* Banner Wing Accent Triangles */}
        <polygon points="38,300 78,272 68,364" fill="#092742" />
        <polygon points="362,300 322,272 332,364" fill="#092742" />

        {/* Motto Text on Ribbon Arc */}
        <text
          fill="#092742"
          fontSize="14.5"
          fontFamily="'Arial Black', 'Montserrat', sans-serif"
          fontWeight="900"
          letterSpacing="1.8"
        >
          <textPath
            href="#ktu-bottom-arc"
            startOffset="50%"
            textAnchor="middle"
          >
            INNOVATING FOR DEVELOPMENT
          </textPath>
        </text>
      </g>
    </svg>
  );
};

export default function KTULogo({
  size = 40,
  className = '',
  showText = false,
  textVariant = 'short',
  invertedText = false,
  alt = 'Koforidua Technical University Crest',
  badge,
  onClick,
}: KTULogoProps) {
  const [imageError, setImageError] = useState(false);

  const numSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 40;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className="relative shrink-0 flex items-center justify-center rounded-full bg-white shadow-2xs border border-slate-200/90 overflow-hidden"
        style={{ width: numSize, height: numSize }}
      >
        {!imageError ? (
          <img
            src={KTU_LOGO_URL}
            alt={alt}
            className="w-full h-full object-contain select-none transition-transform hover:scale-105 duration-200"
            onError={() => setImageError(true)}
          />
        ) : (
          <KTULogoVector size={numSize} />
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`font-black tracking-tight ${
                invertedText ? 'text-white' : 'text-slate-900'
              } ${numSize >= 48 ? 'text-base sm:text-lg' : 'text-sm'}`}
            >
              {textVariant === 'full' ? 'Koforidua Technical University' : 'KTU Social'}
            </span>
            {badge && (
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                {badge}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase ${
              invertedText ? 'text-indigo-200' : 'text-indigo-700'
            }`}
          >
            {textVariant === 'full' ? 'Innovating For Development' : 'Koforidua Technical University'}
          </span>
        </div>
      )}
    </div>
  );
}
