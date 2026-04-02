import { Plus, Minus, RotateCcw } from "lucide-react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  scale: number;
}

const ZoomControls = ({ onZoomIn, onZoomOut, onReset, scale }: ZoomControlsProps) => (
  <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
    <button onClick={onZoomIn} className="h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border border-border/30 flex items-center justify-center hover:bg-muted/60 transition-colors" title="Zoom in">
      <Plus className="h-3.5 w-3.5 text-foreground" />
    </button>
    <button onClick={onZoomOut} className="h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border border-border/30 flex items-center justify-center hover:bg-muted/60 transition-colors" title="Zoom out">
      <Minus className="h-3.5 w-3.5 text-foreground" />
    </button>
    {scale > 1.05 && (
      <button onClick={onReset} className="h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border border-border/30 flex items-center justify-center hover:bg-muted/60 transition-colors" title="Reset">
        <RotateCcw className="h-3 w-3 text-foreground" />
      </button>
    )}
  </div>
);

export default ZoomControls;
