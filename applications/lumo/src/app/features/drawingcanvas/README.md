# Sketch Canvas Component

A simple and elegant sketch canvas component that supports two modes:

1. **Blank Canvas Mode**: Start with an empty canvas for free drawing
2. **Image Overlay Mode**: Load an existing image and draw annotations over it

## Features

- ✅ Pen tool with smooth stroke rendering
- ✅ 8-color palette (black, red, green, blue, yellow, magenta, cyan, white)
- ✅ Undo/Redo functionality
- ✅ Clear canvas
- ✅ Export as PNG
- ✅ Touch and mouse support
- ✅ Responsive design

## Usage

### As a Modal (Integrated with Composer)

The drawing canvas is already integrated into the composer's upload dropdown menu. Users can access it by:

1. Clicking the "Upload" button in the composer
2. Selecting "Draw a sketch" from the dropdown
3. Drawing on the canvas
4. Clicking "Generate" to add the sketch as an attachment

### Standalone Component

```typescript
import { SketchCanvas } from '@proton/lumo/features/drawingcanvas';

// Blank canvas mode
<SketchCanvas
    mode="blank"
    width={800}
    height={600}
    onExport={(imageData, mode) => {
        // imageData is a base64 PNG data URL
        console.log('Drawing exported:', imageData);
    }}
/>

// Image overlay mode
<SketchCanvas
    mode="overlay"
    baseImage="data:image/png;base64,..." // or URL
    width={800}
    height={600}
    onExport={(imageData, mode) => {
        // imageData includes both the base image and annotations
        console.log('Annotated image:', imageData);
    }}
/>
```

### As a Full-Screen Overlay

```typescript
import { SketchOverlay } from '@proton/lumo/features/drawingcanvas';

<SketchOverlay
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    onExport={(imageData, mode) => {
        // Handle the exported image
    }}
    mode="blank"
/>
```

## Architecture

```
drawingcanvas/
├── index.ts                   # Clean exports
├── SketchCanvas.tsx           # Main canvas component
├── canvas.tsx                 # Canvas rendering
├── toolbar.tsx                # Toolbar UI
├── SketchOverlay.tsx          # Full-screen overlay
├── types.ts                   # TypeScript types
├── hooks/
│   ├── useCanvasRenderer.ts   # Canvas rendering logic
│   ├── useDrawing.ts          # Drawing interaction logic
│   └── useHistory.ts          # Undo/redo management
└── utils/
    ├── export.ts              # Export utilities
    └── rendering.ts           # Canvas drawing utilities
```

## Key Design Decisions

1. **Separation of Concerns**: Hooks handle logic, components handle UI
2. **Smooth Drawing**: Uses quadratic curves for natural-looking strokes
3. **Performance**: Efficient canvas rendering with minimal re-renders
