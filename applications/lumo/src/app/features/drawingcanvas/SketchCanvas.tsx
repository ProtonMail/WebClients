import { useRef, useState } from 'react';
import clsx from 'clsx';
import type { CanvasConfig, DrawingMode, ExportOptions } from './types';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { useHistory } from './hooks/useHistory';
import { exportCanvasAsDataURL } from './utils/export';

interface SketchCanvasProps {
    mode?: DrawingMode;
    baseImage?: string;
    width?: number;
    height?: number;
    onExport?: (imageData: string, mode: DrawingMode) => void;
    onClose: () => void;
    className?: string;
}

const DEFAULT_COLOR = '#000000';
const DEFAULT_STROKE_WIDTH = 3;

export const SketchCanvas = ({
    mode = 'blank',
    baseImage,
    width,
    height,
    onExport,
    onClose,
    className,
}: SketchCanvasProps) => {
    const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
    const [strokeWidth] = useState(DEFAULT_STROKE_WIDTH);
    const containerRef = useRef<HTMLDivElement>(null);

    const { strokes, addStroke, undo, redo, clear, canUndo, canRedo } = useHistory();

    const config: CanvasConfig = {
        mode,
        baseImage,
        width,
        height,
    };

    const handleExport = () => {
        // Get the canvas element from the container
        const canvas = containerRef.current?.querySelector('canvas');
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }

        const exportOptions: ExportOptions = {
            format: 'png',
            quality: 1,
        };

        const imageData = exportCanvasAsDataURL(canvas, exportOptions);

        if (onExport) {
            onExport(imageData, mode);
        }
    };

    return (
        <div ref={containerRef} className={clsx('relative', className)} style={{ width: '100%', height: '100%' }}>
            {/* Canvas fills the entire space */}
            <div className="absolute inset-0">
                <Canvas
                    config={config}
                    strokes={strokes}
                    currentColor={currentColor}
                    strokeWidth={strokeWidth}
                    onStrokeComplete={addStroke}
                />
            </div>

            {/* Floating toolbar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 pb-8 flex justify-center" style={{ pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <Toolbar
                        config={{
                            color: currentColor,
                            strokeWidth,
                            tool: 'pen',
                        }}
                        onColorChange={setCurrentColor}
                        onUndo={undo}
                        onRedo={redo}
                        onClear={clear}
                        onExport={handleExport}
                        onClose={onClose}
                        canUndo={canUndo}
                        canRedo={canRedo}
                    />
                </div>
            </div>
        </div>
    );
};
