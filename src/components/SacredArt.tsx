import { cn } from "@/lib/utils";

/**
 * Har puja / product ke liye original SVG artwork.
 * Koi bahar ki image nahi — sab kuch code se banta hai,
 * isliye site fast hai aur copyright ka koi issue nahi.
 */

export const ART_KEYS = [
  "om",
  "shivling",
  "trishul",
  "kalash",
  "lotus",
  "diya",
  "swastik",
  "chakra",
  "rudraksh",
  "gada",
  "shankh",
  "yantra",
  "bell",
  "peepal",
  "sun",
] as const;

export type ArtKey = (typeof ART_KEYS)[number];

const PALETTES: Record<ArtKey, [string, string, string]> = {
  om: ["#7B1E1E", "#C2410C", "#FBBF24"],
  shivling: ["#1E3A5F", "#2F6690", "#9AD1E8"],
  trishul: ["#4A1D2E", "#8C1D18", "#F0A868"],
  kalash: ["#7C4A03", "#B4860F", "#F8E6A8"],
  lotus: ["#7A1F52", "#C2497F", "#FBCFE8"],
  diya: ["#5C2A0B", "#C2410C", "#FDE68A"],
  swastik: ["#8C1D18", "#D97706", "#FEF3C7"],
  chakra: ["#0F3D3E", "#1F7A6B", "#A7E8D2"],
  rudraksh: ["#3B2415", "#7A4B24", "#D9B98C"],
  gada: ["#7A2E00", "#EA580C", "#FED7AA"],
  shankh: ["#31456A", "#6C86B5", "#E6EDF8"],
  yantra: ["#5B1A66", "#9333EA", "#E9D5FF"],
  bell: ["#6B4A05", "#C99A2E", "#FBEFC0"],
  peepal: ["#1E4620", "#3F8A3F", "#C7EFC7"],
  sun: ["#8A3B00", "#F59E0B", "#FEF08A"],
};

function Mandala({ tint }: { tint: string }) {
  const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <g opacity="0.22" stroke={tint} fill="none" strokeWidth="1">
      <circle cx="200" cy="130" r="104" />
      <circle cx="200" cy="130" r="86" strokeDasharray="3 6" />
      <circle cx="200" cy="130" r="62" />
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx="200"
          cy="46"
          rx="7"
          ry="18"
          transform={`rotate(${deg} 200 130)`}
        />
      ))}
    </g>
  );
}

function Glyph({ artKey, tint, light }: { artKey: ArtKey; tint: string; light: string }) {
  const s = { stroke: light, fill: "none", strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (artKey) {
    case "om":
      return (
        <text
          x="200"
          y="172"
          textAnchor="middle"
          fontSize="132"
          fontWeight="600"
          fill={light}
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          ॐ
        </text>
      );

    case "shivling":
      return (
        <g {...s}>
          <ellipse cx="200" cy="176" rx="74" ry="17" fill={tint} />
          <path d="M200 176V150" />
          <path d="M168 150a32 46 0 0 1 64 0z" fill={tint} />
          <path d="M140 132c18-30 44 14 60-10s44 26 60-6" />
          <circle cx="200" cy="76" r="7" fill={light} />
        </g>
      );

    case "trishul":
      return (
        <g {...s}>
          <path d="M200 66v128" />
          <path d="M158 92V64c0 26 12 34 20 40" />
          <path d="M242 92V64c0 26-12 34-20 40" />
          <path d="M200 66l-14-24h28z" fill={light} />
          <path d="M162 122h76" />
          <circle cx="200" cy="204" r="8" fill={light} />
        </g>
      );

    case "kalash":
      return (
        <g {...s}>
          <path d="M166 118h68l-8 66a26 26 0 0 1-26 22h0a26 26 0 0 1-26-22z" fill={tint} />
          <path d="M158 112h84" />
          <path d="M176 112c0-14 10-22 24-22s24 8 24 22" />
          <circle cx="200" cy="76" r="14" fill={light} />
          <path d="M186 86c-16-4-26-14-28-26 14-2 24 4 28 14" />
          <path d="M214 86c16-4 26-14 28-26-14-2-24 4-28 14" />
        </g>
      );

    case "lotus":
      return (
        <g stroke={light} strokeWidth="4" fill="none" strokeLinejoin="round">
          <path d="M200 82c16 22 22 46 20 70-18 4-32-2-42-16 4-22 12-40 22-54z" fill={tint} />
          <path d="M200 82c-16 22-22 46-20 70 18 4 32-2 42-16-4-22-12-40-22-54z" />
          <path d="M144 116c22 6 38 20 46 38-14 12-30 14-46 6-6-16-6-32 0-44z" fill={tint} />
          <path d="M256 116c-22 6-38 20-46 38 14 12 30 14 46 6 6-16 6-32 0-44z" fill={tint} />
          <path d="M132 168h136" />
        </g>
      );

    case "diya":
      return (
        <g {...s}>
          <path
            className="animate-flicker"
            d="M200 76c14 18 20 30 20 42a20 20 0 1 1-40 0c0-12 6-24 20-42z"
            fill={light}
            stroke="none"
          />
          <path d="M146 156h108c-6 24-26 38-54 38s-48-14-54-38z" fill={tint} />
          <path d="M134 156h132" />
          <path d="M200 194v14" />
        </g>
      );

    case "swastik":
      return (
        <g {...s} strokeWidth="12">
          <path d="M200 74v112M144 130h112" />
          <path d="M200 74h40M256 130v40M200 186h-40M144 130V90" />
        </g>
      );

    case "chakra":
      return (
        <g {...s}>
          <circle cx="200" cy="130" r="62" />
          <circle cx="200" cy="130" r="16" fill={light} stroke="none" />
          {Array.from({ length: 8 }, (_, i) => i * 45).map((deg) => (
            <path key={deg} d="M200 76v-0" transform={`rotate(${deg} 200 130)`} />
          ))}
          {Array.from({ length: 8 }, (_, i) => i * 45).map((deg) => (
            <line
              key={`l${deg}`}
              x1="200"
              y1="76"
              x2="200"
              y2="184"
              transform={`rotate(${deg} 200 130)`}
              strokeWidth="4"
            />
          ))}
        </g>
      );

    case "rudraksh":
      return (
        <g stroke={light} strokeWidth="3" fill={tint}>
          {Array.from({ length: 14 }, (_, i) => (i * 360) / 14).map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <circle
                key={deg}
                cx={200 + 64 * Math.cos(rad)}
                cy={130 + 64 * Math.sin(rad)}
                r="12"
              />
            );
          })}
          <circle cx="200" cy="130" r="22" fill="none" strokeDasharray="4 5" />
        </g>
      );

    case "gada":
      return (
        <g {...s}>
          <rect x="172" y="58" width="56" height="46" rx="14" fill={tint} />
          <path d="M166 104h68" />
          <path d="M200 104v82" />
          <path d="M184 186h32l-6 20h-20z" fill={light} />
          <path d="M180 70h40M180 84h40" strokeWidth="3" />
        </g>
      );

    case "shankh":
      return (
        <g {...s}>
          <path d="M232 84c22 26 18 66-10 88s-70 18-86-6c-10-16-4-32 12-34" fill={tint} />
          <path d="M232 84c-14-8-30-6-38 6s-4 26 8 30 26-2 30-14" />
          <path d="M148 166c22 18 56 18 78 0" strokeWidth="3" />
        </g>
      );

    case "yantra":
      return (
        <g stroke={light} strokeWidth="3.5" fill="none">
          <path d="M200 68l62 108H138z" />
          <path d="M200 192l-62-108h124z" fill={tint} fillOpacity="0.35" />
          <path d="M200 96l40 68h-80z" />
          <path d="M200 164l-40-68h80z" />
          <circle cx="200" cy="130" r="86" strokeDasharray="6 8" />
          <circle cx="200" cy="130" r="8" fill={light} />
        </g>
      );

    case "bell":
      return (
        <g {...s}>
          <path d="M200 72c-26 0-44 20-46 46-2 22-8 34-16 42h124c-8-8-14-20-16-42-2-26-20-46-46-46z" fill={tint} />
          <path d="M200 72V58" />
          <circle cx="200" cy="52" r="9" />
          <path d="M186 176a14 14 0 0 0 28 0" />
        </g>
      );

    case "peepal":
      return (
        <g {...s}>
          <path
            d="M200 66c34 22 50 50 44 78-5 24-26 38-44 38s-39-14-44-38c-6-28 10-56 44-78z"
            fill={tint}
          />
          <path d="M200 96v86M200 182l-16 22M200 182l16 22" strokeWidth="3" />
        </g>
      );

    case "sun":
      return (
        <g {...s}>
          <circle cx="200" cy="130" r="40" fill={tint} />
          {Array.from({ length: 12 }, (_, i) => i * 30).map((deg) => (
            <line
              key={deg}
              x1="200"
              y1="72"
              x2="200"
              y2="54"
              transform={`rotate(${deg} 200 130)`}
            />
          ))}
        </g>
      );
  }
}

export function SacredArt({
  artKey = "om",
  className,
  rounded = "rounded-t-2xl",
}: {
  artKey?: string;
  className?: string;
  rounded?: string;
}) {
  const key = (ART_KEYS as readonly string[]).includes(artKey)
    ? (artKey as ArtKey)
    : "om";
  const [dark, mid, light] = PALETTES[key];
  const gid = `g-${key}`;

  return (
    <div className={cn("decor relative overflow-hidden", rounded, className)} aria-hidden="true">
      <svg viewBox="0 0 400 260" className="h-full w-full" role="presentation">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={dark} />
            <stop offset="60%" stopColor={mid} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
          <radialGradient id={`${gid}-glow`} cx="50%" cy="48%" r="55%">
            <stop offset="0%" stopColor={light} stopOpacity="0.35" />
            <stop offset="100%" stopColor={light} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="260" fill={`url(#${gid})`} />
        <rect width="400" height="260" fill={`url(#${gid}-glow)`} />
        <Mandala tint={light} />
        <Glyph artKey={key} tint={mid} light={light} />

        {/* neeche golden border line */}
        <rect y="254" width="400" height="6" fill={light} opacity="0.55" />
      </svg>
    </div>
  );
}

export default SacredArt;
