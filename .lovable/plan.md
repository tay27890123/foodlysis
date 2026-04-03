

## Plan: Separate Peninsula & Borneo into Independent Interactive Maps

### Problem
Currently both maps share a single zoom/pan state and are wrapped together, so zooming affects both simultaneously. Panning is also locked when fully zoomed out.

### Changes

#### 1. Update `useMapZoomPan` hook
- Lower `minScale` default from `1` to `0.5` to allow zooming out further
- **Remove the restriction** that prevents panning at scale <= 1 — allow dragging at any zoom level
- Always show `grab` cursor instead of only when zoomed in

#### 2. Refactor `MalaysiaMap.tsx` — Two independent map panels
- Each map panel (Peninsular / East Malaysia) gets its **own instance** of `useMapZoomPan(0.5, 4)`
- Each panel gets its **own `ZoomControls`** overlay positioned in its top-left corner
- Each panel gets its own `containerProps` and `transformStyle` — zoom/pan on one map does not affect the other
- Each panel wrapped in its own `overflow-hidden` container with a border/card styling to visually separate them
- Layout stays side-by-side (flex row) but each panel is a self-contained interactive map
- Add subtle panel headers ("Peninsular Malaysia" / "East Malaysia") at the top of each card

#### 3. Keep shared tooltip
- The hover tooltip remains at the parent level since both maps share the same `stateData` and `hoveredState`

### Technical details

**`useMapZoomPan.ts`** changes:
- `minScale` default → `0.5`
- `handleMouseDown`: remove `if (state.scale <= 1) return` guard
- `handleTouchStart`: remove `state.scale > 1` check for single-finger pan
- `transformStyle.cursor`: always `"grab"`
- `zoomOut`: remove the "snap to reset" behavior at minScale — just set the new scale without resetting translate

**`MalaysiaMap.tsx`** changes:
- Create two hook instances: `useMapZoomPan(0.5, 4)` for west, another for east
- Each panel structure:
  ```
  <div className="relative rounded-lg border overflow-hidden">
    <ZoomControls ... />
    <div {...containerProps}>
      <div style={transformStyle}>
        <ComposableMap ...> ... </ComposableMap>
      </div>
    </div>
  </div>
  ```
- Remove the single shared wrapper that applied one transform to both maps

