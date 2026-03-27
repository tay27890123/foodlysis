import { useState } from "react";
import { motion } from "framer-motion";

export type StateStatus = "surplus" | "shortage" | "balanced" | "warning";

export interface StateData {
  id: string;
  name: string;
  status: StateStatus;
  production: number; // tonnes
  demand: number; // tonnes
  mainCrops: string[];
  notes: string;
}

const statusColors: Record<StateStatus, { fill: string; stroke: string; label: string; dot: string }> = {
  surplus: {
    fill: "hsl(152 60% 42% / 0.35)",
    stroke: "hsl(152 60% 42% / 0.8)",
    label: "Surplus",
    dot: "bg-primary",
  },
  balanced: {
    fill: "hsl(210 60% 50% / 0.3)",
    stroke: "hsl(210 60% 50% / 0.7)",
    label: "Balanced",
    dot: "bg-blue-500",
  },
  warning: {
    fill: "hsl(40 85% 55% / 0.3)",
    stroke: "hsl(40 85% 55% / 0.7)",
    label: "Warning",
    dot: "bg-secondary",
  },
  shortage: {
    fill: "hsl(0 72% 51% / 0.3)",
    stroke: "hsl(0 72% 51% / 0.7)",
    label: "Shortage",
    dot: "bg-destructive",
  },
};

// Simplified SVG paths for Malaysian states (approximate shapes positioned in a map layout)
const statePaths: Record<string, { d: string; labelX: number; labelY: number }> = {
  perlis: {
    d: "M115,45 L130,38 L140,45 L135,58 L120,60 Z",
    labelX: 127, labelY: 50,
  },
  kedah: {
    d: "M110,60 L140,55 L155,65 L160,90 L150,110 L125,115 L108,95 L105,75 Z",
    labelX: 132, labelY: 88,
  },
  penang: {
    d: "M100,100 L112,95 L115,108 L108,115 L98,110 Z",
    labelX: 107, labelY: 105,
  },
  perak: {
    d: "M125,115 L160,108 L185,120 L195,150 L190,185 L170,200 L145,195 L130,175 L120,145 Z",
    labelX: 158, labelY: 158,
  },
  kelantan: {
    d: "M200,55 L235,48 L260,60 L265,90 L250,115 L225,120 L200,110 L195,80 Z",
    labelX: 230, labelY: 85,
  },
  terengganu: {
    d: "M250,115 L270,100 L290,110 L295,145 L280,175 L260,180 L240,165 L235,135 Z",
    labelX: 265, labelY: 142,
  },
  pahang: {
    d: "M185,120 L225,120 L240,165 L260,180 L255,215 L235,240 L200,245 L180,225 L170,200 L175,160 Z",
    labelX: 215, labelY: 185,
  },
  selangor: {
    d: "M145,195 L170,200 L180,225 L185,250 L170,265 L150,260 L140,240 L135,215 Z",
    labelX: 158, labelY: 232,
  },
  kl: {
    d: "M160,230 L170,228 L173,238 L165,242 Z",
    labelX: 166, labelY: 235,
  },
  negeriSembilan: {
    d: "M155,260 L175,265 L185,250 L200,260 L195,285 L175,295 L158,285 Z",
    labelX: 176, labelY: 275,
  },
  melaka: {
    d: "M160,295 L178,295 L182,310 L168,315 L155,308 Z",
    labelX: 168, labelY: 305,
  },
  johor: {
    d: "M175,295 L200,285 L230,290 L250,305 L255,335 L240,355 L200,360 L175,345 L160,325 L158,305 Z",
    labelX: 210, labelY: 328,
  },
  sabah: {
    d: "M430,60 L470,45 L510,50 L535,70 L540,100 L530,130 L505,140 L480,135 L460,120 L440,100 L425,80 Z",
    labelX: 485, labelY: 95,
  },
  sarawak: {
    d: "M340,100 L380,80 L420,75 L440,100 L460,120 L480,135 L470,160 L445,175 L415,180 L385,170 L360,155 L340,135 Z",
    labelX: 410, labelY: 132,
  },
  labuan: {
    d: "M418,62 L428,58 L432,66 L425,70 Z",
    labelX: 425, labelY: 64,
  },
};

interface MalaysiaMapProps {
  stateData: StateData[];
  onStateClick?: (state: StateData) => void;
  selectedState?: string | null;
}

const MalaysiaMap = ({ stateData, onStateClick, selectedState }: MalaysiaMapProps) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const getStateData = (id: string) => stateData.find((s) => s.id === id);

  return (
    <div className="relative w-full">
      <svg
        viewBox="70 20 500 360"
        className="w-full h-auto"
        style={{ maxHeight: "520px" }}
      >
        {/* Background grid lines */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(152 60% 42% / 0.05)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect x="70" y="20" width="500" height="360" fill="url(#grid)" />

        {/* Sea labels */}
        <text x="85" y="200" fill="hsl(210 60% 50% / 0.15)" fontSize="10" fontWeight="600">STRAIT OF MALACCA</text>
        <text x="320" y="200" fill="hsl(210 60% 50% / 0.15)" fontSize="10" fontWeight="600">SOUTH CHINA SEA</text>

        {/* State shapes */}
        {Object.entries(statePaths).map(([id, { d, labelX, labelY }]) => {
          const data = getStateData(id);
          const status = data?.status || "balanced";
          const colors = statusColors[status];
          const isHovered = hoveredState === id;
          const isSelected = selectedState === id;

          return (
            <g key={id}>
              <motion.path
                d={d}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                className="cursor-pointer transition-colors duration-200"
                style={{
                  filter: isHovered || isSelected
                    ? `drop-shadow(0 0 8px ${colors.stroke})`
                    : "none",
                }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  fill: isHovered || isSelected
                    ? colors.fill.replace(/[\d.]+\)$/, "0.55)")
                    : colors.fill,
                }}
                transition={{ duration: 0.3, delay: Math.random() * 0.3 }}
                onMouseEnter={() => setHoveredState(id)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => data && onStateClick?.(data)}
              />
              {/* State label */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(150 15% 92%)"
                fontSize={id === "kl" || id === "labuan" || id === "penang" || id === "perlis" || id === "melaka" ? "5" : "7"}
                fontWeight="600"
                className="pointer-events-none select-none"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
              >
                {data?.name || id}
              </text>
              {/* Status dot */}
              {data && (
                <circle
                  cx={labelX}
                  cy={labelY + (id === "kl" || id === "labuan" ? 6 : 10)}
                  r="3"
                  fill={colors.stroke}
                  className="pointer-events-none"
                  style={{ filter: `drop-shadow(0 0 4px ${colors.stroke})` }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredState && getStateData(hoveredState) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 rounded-xl border border-border/50 bg-card/90 backdrop-blur-md p-4 shadow-xl min-w-[200px]"
        >
          {(() => {
            const data = getStateData(hoveredState)!;
            const colors = statusColors[data.status];
            const diff = data.production - data.demand;
            return (
              <>
                <p className="font-display font-bold text-sm text-foreground">{data.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                  <span className="text-xs font-medium" style={{ color: colors.stroke }}>{colors.label}</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>Production: <span className="text-foreground font-medium">{data.production.toLocaleString()} t</span></p>
                  <p>Demand: <span className="text-foreground font-medium">{data.demand.toLocaleString()} t</span></p>
                  <p>Balance: <span className={`font-medium ${diff >= 0 ? "text-primary" : "text-destructive"}`}>{diff >= 0 ? "+" : ""}{diff.toLocaleString()} t</span></p>
                </div>
              </>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
};

export { statusColors };
export default MalaysiaMap;
