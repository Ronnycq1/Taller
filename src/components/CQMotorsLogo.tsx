import React from "react";

interface CQMotorsLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
}

export default function CQMotorsLogo({ size = "md", className = "", id }: CQMotorsLogoProps) {
  const smSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 50" width="220" height="50">
  <defs>
    <linearGradient id="chromeTextSm" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>
    <linearGradient id="goldGradSm" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <g transform="translate(25, 25)">
    <circle r="16" fill="#090d16" stroke="#38bdf8" stroke-width="1.5" />
    <text x="0" y="4" font-family="monospace" font-weight="bold" font-size="11" fill="#38bdf8" text-anchor="middle">⚡</text>
  </g>
  <g transform="translate(52, 24)">
    <text font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="16" letter-spacing="-0.5" fill="url(#chromeTextSm)">
      CQ <tspan fill="url(#goldGradSm)">Motors</tspan>
    </text>
    <text x="0" y="12" fill="#94a3b8" font-family="monospace" font-weight="bold" font-size="6" letter-spacing="0.5">W. CADENA • TEC. AUTOMOTRIZ</text>
  </g>
</svg>
`;

  const mdSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 80" width="350" height="80">
  <defs>
    <linearGradient id="chromeTextMd" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>
    <linearGradient id="goldGradMd" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <rect width="350" height="80" rx="12" fill="#020617" stroke="#1e293b" stroke-width="1" />
  <g transform="translate(40, 40)">
    <circle r="26" fill="#0f172a" stroke="#f97316" stroke-width="2" />
    <circle r="20" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3" />
    <text x="0" y="5" font-family="monospace" font-weight="bold" font-size="16" fill="#10b981" text-anchor="middle">⚙️</text>
  </g>
  <g transform="translate(85, 32)">
    <text font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="22" letter-spacing="-1" fill="url(#chromeTextMd)">
      CQ <tspan fill="url(#goldGradMd)">Motors</tspan>
    </text>
    <text x="0" y="20" fill="#f59e0b" font-family="monospace" font-weight="bold" font-size="8" letter-spacing="2">TECNÓLOGO AUTOMOTRIZ</text>
    <text x="0" y="32" fill="#94a3b8" font-family="'Inter', system-ui, sans-serif" font-weight="500" font-size="8" letter-spacing="1">WASHINGTON CADENA</text>
  </g>
</svg>
`;

  const lgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 250" width="800" height="250">
  <defs>
    <linearGradient id="bgGradLg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="50%" stop-color="#0b1329" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="chromeTextLg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#e2e8f0" />
      <stop offset="50%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>
    <linearGradient id="goldGradLg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    <linearGradient id="neonCyanLg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <filter id="glowCyanLg" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="800" height="250" rx="24" fill="url(#bgGradLg)" stroke="#1e293b" stroke-width="2" />
  
  <path d="M50,125 Q200,80 350,125 T650,125" fill="none" stroke="#f97316" stroke-opacity="0.15" stroke-width="2" />
  <path d="M100,150 Q255,200 400,150" fill="none" stroke="#38bdf8" stroke-opacity="0.12" stroke-width="1.5" />

  <g transform="translate(130, 125)">
    <circle r="90" fill="#090d16" stroke="#1e293b" stroke-width="4" filter="url(#glowCyanLg)" />
    <circle r="85" fill="none" stroke="url(#neonCyanLg)" stroke-width="2" stroke-opacity="0.6" />
    <circle r="75" fill="none" stroke="#f97316" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.5" />
    <circle r="70" fill="none" stroke="#1e293b" stroke-width="1" />

    <circle cx="-55" cy="-20" r="4" fill="#38bdf8" />
    <circle cx="-55" cy="0" r="4" fill="#10b981" />
    <circle cx="-55" cy="20" r="4" fill="#f59e0b" />

    <g transform="translate(-25, -50)">
      <rect width="60" fill="url(#chromeTextLg)" height="75" rx="6" stroke="#475569" stroke-width="1" />
      <rect x="3" y="3" fill="#1e293b" width="54" height="69" rx="4" />
      <line x1="12" y1="10" x2="12" y2="40" stroke="#475569" stroke-width="2" />
      <line x1="20" y1="10" x2="20" y2="40" stroke="#475569" stroke-width="2" />
      <line x1="28" y1="10" x2="28" y2="40" stroke="#475569" stroke-width="2" />
      <line x1="36" y1="10" x2="36" y2="40" stroke="#475569" stroke-width="2" />
      <line x1="44" y1="10" x2="44" y2="40" stroke="#475569" stroke-width="2" />
      <rect x="8" y="46" width="44" height="20" rx="2" fill="#020617" stroke="#334155" stroke-width="0.5" />
      <text x="30" y="54" fill="#a7f3d0" font-family="monospace" font-size="5" font-weight="bold" text-anchor="middle">PCM ACTIVE</text>
      <text x="30" y="61" fill="#64748b" font-family="monospace" font-size="4" text-anchor="middle">LINK OK</text>
    </g>

    <g transform="translate(15, -15)">
      <rect width="70" height="52" rx="6" fill="#0f172a" stroke="#475569" stroke-width="2" />
      <rect x="4" y="4" width="62" height="44" rx="3" fill="#020617" />
      <line x1="4" y1="26" x2="66" y2="26" stroke="#1e293b" stroke-width="0.5" />
      <line x1="4" y1="15" x2="66" y2="15" stroke="#1e293b" stroke-width="0.5" />
      <line x1="4" y1="37" x2="66" y2="37" stroke="#1e293b" stroke-width="0.5" />
      <path d="M5,26 L15,22 L22,35 L28,12 L35,38 L42,10 L50,26 L55,18 L65,26" fill="none" stroke="#10b981" stroke-width="1.8" filter="url(#glowCyanLg)" />
      <text x="35" y="10" fill="#f59e0b" font-family="monospace" font-weight="bold" font-size="4.5" text-anchor="middle">DIAGNOSTICO OBD-II</text>
      <text x="35" y="44" fill="#10b981" font-family="monospace" font-weight="bold" font-size="4" text-anchor="middle">SISTEMA OK</text>
    </g>
  </g>

  <g transform="translate(280, 75)">
    <text font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="58" letter-spacing="-2" fill="url(#chromeTextLg)">
      CQ <tspan fill="url(#goldGradLg)">Motors</tspan>
    </text>

    <g transform="translate(5, 42)">
      <rect width="112" height="22" rx="6" fill="#0c1222" stroke="#1e293b" stroke-width="1" />
      <text x="56" y="15" fill="#f59e0b" font-family="monospace" font-weight="950" font-size="11" letter-spacing="1.5" text-anchor="middle">CQ MOTOR'S</text>
    </g>

    <text x="5" y="93" fill="#f1f5f9" font-family="'Inter', system-ui, sans-serif" font-weight="800" font-size="19" letter-spacing="4">
      TECNOLOGO AUTOMOTRIZ
    </text>

    <text x="5" y="120" fill="#94a3b8" font-family="'Inter', system-ui, sans-serif" font-weight="600" font-size="15" letter-spacing="6">
      WASHINGTON CADENA
    </text>

    <line x1="5" y1="135" x2="480" y2="135" stroke="#1e293b" stroke-width="1.5" />
    <text x="5" y="150" fill="#475569" font-family="monospace" font-size="9" letter-spacing="3" font-weight="bold">
      ESCANEO COMPUTARIZADO  •  DIAGNÓSTICO DIGITAL  •  CONTROL PCM/ECU
    </text>
  </g>
</svg>
`;

  let svgStringToUse = "";
  if (size === "sm") svgStringToUse = smSvg;
  else if (size === "md") svgStringToUse = mdSvg;
  else svgStringToUse = lgSvg;

  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgStringToUse.trim())}`;

  // Assign standard classes per size for layout correctness
  let sizeClasses = "w-full";
  if (size === "sm") {
    sizeClasses = "w-[220px] h-[50px] shrink-0";
  } else if (size === "md") {
    sizeClasses = "w-[350px] h-[80px] shrink-0 mx-auto lg:mx-0";
  }

  const generatedId = id || `cq-motors-logo-${size}`;

  return (
    <img
      id={generatedId}
      src={dataUri}
      alt="CQ Motors Logo"
      referrerPolicy="no-referrer"
      className={`${sizeClasses} object-contain transition-all tracking-wider ${className}`}
    />
  );
}
