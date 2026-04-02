import { useState, useCallback } from "react";
import { useMapZoomPan } from "@/hooks/useMapZoomPan";
import ZoomControls from "@/components/ZoomControls";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";

export type StateStatus = "surplus" | "shortage" | "balanced" | "warning";

export interface StateData {
  id: string;
  name: string;
  status: StateStatus;
  production: number;
  demand: number;
  mainCrops: string[];
  notes: string;
}

export const statusColors: Record<StateStatus, { fill: string; stroke: string; label: string; dot: string }> = {
  surplus: { fill: "hsl(152 60% 42% / 0.35)", stroke: "hsl(152 60% 42% / 0.8)", label: "Surplus", dot: "bg-primary" },
  balanced: { fill: "hsl(210 60% 50% / 0.3)", stroke: "hsl(210 60% 50% / 0.7)", label: "Balanced", dot: "bg-blue-500" },
  warning: { fill: "hsl(40 85% 55% / 0.3)", stroke: "hsl(40 85% 55% / 0.7)", label: "Warning", dot: "bg-secondary" },
  shortage: { fill: "hsl(0 72% 51% / 0.3)", stroke: "hsl(0 72% 51% / 0.7)", label: "Shortage", dot: "bg-destructive" },
};

const HC_KEY_TO_ID: Record<string, string> = {
  "my-pl": "perlis",
  "my-kh": "kedah",
  "my-pg": "penang",
  "my-pk": "perak",
  "my-kn": "kelantan",
  "my-te": "terengganu",
  "my-ph": "pahang",
  "my-sl": "selangor",
  "my-kl": "kl",
  "my-pj": "putrajaya",
  "my-ns": "negeriSembilan",
  "my-me": "melaka",
  "my-jh": "johor",
  "my-sa": "sabah",
  "my-sk": "sarawak",
  "my-la": "labuan",
};

const WEST_STATES = new Set(["perlis", "kedah", "penang", "perak", "kelantan", "terengganu", "pahang", "selangor", "kl", "putrajaya", "negeriSembilan", "melaka", "johor"]);
const EAST_STATES = new Set(["sabah", "sarawak", "labuan"]);

const STATE_CENTERS: Record<string, [number, number]> = {
  perlis: [100.19, 6.45],
  kedah: [100.5, 5.95],
  penang: [100.25, 5.37],
  perak: [101.0, 4.6],
  kelantan: [102.0, 5.3],
  terengganu: [103.1, 4.9],
  pahang: [102.5, 3.8],
  selangor: [101.5, 3.3],
  kl: [101.69, 3.14],
  putrajaya: [101.7, 2.93],
  negeriSembilan: [102.0, 2.75],
  melaka: [102.25, 2.2],
  johor: [103.5, 1.85],
  sabah: [117.0, 5.4],
  sarawak: [113.0, 2.5],
  labuan: [115.2, 5.3],
};

const TOPO_URL = "/malaysia-states.topo.json";

export interface ChoroplethColors {
  fill: string;
  stroke: string;
}

interface MalaysiaMapProps {
  stateData: StateData[];
  onStateClick?: (state: StateData) => void;
  selectedState?: string | null;
  choroplethColors?: Record<string, ChoroplethColors>;
  tooltipContent?: (id: string) => string | null;
}

const DEFAULT_FILL = "#0F291E";
const DEFAULT_STROKE = "#10B981";
const HOVER_FILL = "#1A4D35";

const MalaysiaMap = ({ stateData, onStateClick, selectedState, choroplethColors, tooltipContent }: MalaysiaMapProps) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const getStateData = useCallback(
    (id: string) => stateData.find((s) => s.id === id),
    [stateData]
  );

  const getIdFromGeo = (geo: any): string | null => {
    const hcKey = geo.properties?.["hc-key"];
    return hcKey ? HC_KEY_TO_ID[hcKey] ?? null : null;
  };

  const renderGeo = (geo: any) => {
    const id = getIdFromGeo(geo);
    if (!id) return null;

    const data = getStateData(id);
    const colors = choroplethColors?.[id] || null;
    const isHovered = hoveredState === id;
    const isSelected = selectedState === id;

    const fillColor = colors
      ? isHovered || isSelected
        ? colors.fill.replace(/[\d.]+\)$/, "0.65)")
        : colors.fill
      : isHovered || isSelected
      ? HOVER_FILL
      : DEFAULT_FILL;

    const strokeColor = colors ? colors.stroke : DEFAULT_STROKE;

    return (
      <Geography
        key={geo.rsmKey}
        geography={geo}
        onMouseEnter={() => setHoveredState(id)}
        onMouseLeave={() => setHoveredState(null)}
        onClick={() => data && onStateClick?.(data)}
        style={{
          default: {
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: isSelected ? 2 : 1,
            outline: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
          },
          hover: {
            fill: colors ? colors.fill.replace(/[\d.]+\)$/, "0.65)") : HOVER_FILL,
            stroke: strokeColor,
            strokeWidth: 2,
            outline: "none",
            cursor: "pointer",
            transform: "scale(1.02)",
            transformOrigin: "center",
            filter: `drop-shadow(0 0 6px ${strokeColor})`,
          },
          pressed: {
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: 2.5,
            outline: "none",
          },
        }}
      />
    );
  };

  const renderLabels = (filterSet: Set<string>) =>
    Object.entries(STATE_CENTERS)
      .filter(([id]) => filterSet.has(id))
      .map(([id, coords]) => {
        const data = getStateData(id);
        const name = data?.name || id;
        const isSmall = ["kl", "labuan", "penang", "perlis", "melaka", "putrajaya"].includes(id);
        return (
          <Marker key={`label-${id}`} coordinates={coords}>
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(150, 15%, 92%)"
              fontSize={isSmall ? 4 : 5.5}
              fontWeight={600}
              className="pointer-events-none select-none"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
            >
              {name}
            </text>
          </Marker>
        );
      });

  return (
    <div className="relative w-full">
      {/* Two-panel layout: West (55%) + East (45%) */}
      <div className="flex items-center w-full gap-4" style={{ maxHeight: "380px" }}>
        {/* Peninsular Malaysia */}
        <div className="flex-[55] relative">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 5500, center: [101.7, 4.1] }}
            width={420}
            height={480}
            style={{ width: "100%", height: "auto" }}
          >
            <text x={30} y={460} fill="hsl(210, 60%, 50%, 0.10)" fontSize={9} fontWeight={600}>
              STRAIT OF MALACCA
            </text>
            <Geographies geography={TOPO_URL}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => { const id = getIdFromGeo(geo); return id && WEST_STATES.has(id); })
                  .map(renderGeo)
              }
            </Geographies>
            {renderLabels(WEST_STATES)}
          </ComposableMap>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/40 font-medium tracking-wider">PENINSULAR</span>
        </div>

        {/* East Malaysia */}
        <div className="flex-[45] relative">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 4200, center: [115.0, 3.5] }}
            width={380}
            height={480}
            style={{ width: "100%", height: "auto" }}
          >
            <text x={120} y={30} fill="hsl(210, 60%, 50%, 0.10)" fontSize={9} fontWeight={600}>
              SOUTH CHINA SEA
            </text>
            <Geographies geography={TOPO_URL}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => { const id = getIdFromGeo(geo); return id && EAST_STATES.has(id); })
                  .map(renderGeo)
              }
            </Geographies>
            {renderLabels(EAST_STATES)}
          </ComposableMap>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/40 font-medium tracking-wider">EAST MALAYSIA</span>
        </div>
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredState && getStateData(hoveredState) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-3 right-3 rounded-xl border border-border/50 bg-card/90 backdrop-blur-md p-3 shadow-xl min-w-[180px] pointer-events-none"
          >
            {(() => {
              const data = getStateData(hoveredState)!;
              const tooltip = tooltipContent?.(hoveredState);
              const defaultCol = statusColors[data.status];
              const col = choroplethColors?.[hoveredState] || defaultCol;
              return (
                <>
                  <p className="font-display font-bold text-sm text-foreground">{data.name}</p>
                  {tooltip ? (
                    <p className="mt-1 text-xs font-medium" style={{ color: col.stroke }}>{tooltip}</p>
                  ) : (
                    <>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${defaultCol.dot}`} />
                        <span className="text-xs font-medium" style={{ color: defaultCol.stroke }}>{defaultCol.label}</span>
                      </div>
                      <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        <p>Production: <span className="text-foreground font-medium">{data.production.toLocaleString()} kg</span></p>
                        <p>Demand: <span className="text-foreground font-medium">{data.demand.toLocaleString()} kg</span></p>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MalaysiaMap;
