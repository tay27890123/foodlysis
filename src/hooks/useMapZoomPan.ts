import { useState, useRef, useCallback, WheelEvent, MouseEvent, TouchEvent } from "react";

interface ZoomPanState {
  scale: number;
  translateX: number;
  translateY: number;
}

export function useMapZoomPan(minScale = 1, maxScale = 4) {
  const [state, setState] = useState<ZoomPanState>({ scale: 1, translateX: 0, translateY: 0 });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState((prev) => {
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newScale = Math.min(maxScale, Math.max(minScale, prev.scale + delta));
      if (newScale === minScale) return { scale: minScale, translateX: 0, translateY: 0 };
      return { ...prev, scale: newScale };
    });
  }, [minScale, maxScale]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (state.scale <= 1) return;
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [state.scale]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setState((prev) => ({ ...prev, translateX: prev.translateX + dx, translateY: prev.translateY + dy }));
  }, []);

  const handleMouseUp = useCallback(() => { isPanning.current = false; }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && state.scale > 1) {
      isPanning.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [state.scale]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const delta = (dist - lastTouchDist.current) * 0.01;
      lastTouchDist.current = dist;
      setState((prev) => {
        const newScale = Math.min(maxScale, Math.max(minScale, prev.scale + delta));
        if (newScale === minScale) return { scale: minScale, translateX: 0, translateY: 0 };
        return { ...prev, scale: newScale };
      });
    } else if (isPanning.current && e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setState((prev) => ({ ...prev, translateX: prev.translateX + dx, translateY: prev.translateY + dy }));
    }
  }, [minScale, maxScale]);

  const handleTouchEnd = useCallback(() => {
    isPanning.current = false;
    lastTouchDist.current = null;
  }, []);

  const zoomIn = useCallback(() => {
    setState((prev) => ({ ...prev, scale: Math.min(maxScale, prev.scale + 0.3) }));
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setState((prev) => {
      const newScale = Math.max(minScale, prev.scale - 0.3);
      if (newScale === minScale) return { scale: minScale, translateX: 0, translateY: 0 };
      return { ...prev, scale: newScale };
    });
  }, [minScale]);

  const reset = useCallback(() => {
    setState({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  const containerProps = {
    onWheel: handleWheel,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  const transformStyle = {
    transform: `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`,
    transformOrigin: "center center",
    transition: isPanning.current ? "none" : "transform 0.2s ease-out",
    cursor: state.scale > 1 ? "grab" : "default",
  };

  return { state, containerProps, transformStyle, zoomIn, zoomOut, reset };
}
