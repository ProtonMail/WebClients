import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components';

import type { CanvasConfig, DrawingMode, ExportOptions } from './types';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { useHistory } from './hooks/useHistory';
import { exportCanvasAsDataURL } from './utils/export';
import './SketchCanvas.scss';

interface SketchCanvasProps {
    mode?: DrawingMode;
    baseImage?: string;
    width?: number;
    height?: number;
    onExport?: (imageData: string, mode: DrawingMode, description: string) => void;
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
    const [description, setDescription] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const { strokes, addStroke, undo, redo, clear, canUndo, canRedo } = useHistory();

    const config: CanvasConfig = { mode, baseImage, width, height };

    const handleExport = () => {
        const canvas = containerRef.current?.querySelector('canvas');
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
        const exportOptions: ExportOptions = { format: 'png', quality: 1 };
        const imageData = exportCanvasAsDataURL(canvas, exportOptions);
        onExport?.(imageData, mode, description.trim());
    };

    return (
        <div ref={containerRef} className={`sketch-canvas${className ? ` ${className}` : ''}`}>
            <div className="sketch-canvas__canvas-area">
                <Canvas
                    config={config}
                    strokes={strokes}
                    currentColor={currentColor}
                    strokeWidth={strokeWidth}
                    onStrokeComplete={addStroke}
                />
            </div>

            <div className="sketch-canvas__panel">
                {mode !== 'blank' && (
                    <div className="sketch-canvas__description bg-norm border border-weak shadow-lifted">
                        <p className="sketch-canvas__description-hint color-weak">
                            <Icon name="pen" size={3} />
                            {c('collider_2025:Hint').t`Draw on the image to annotate, and/or describe what to change`}
                        </p>

                        <div className="sketch-canvas__separator" />

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={c('collider_2025:Placeholder').t`e.g. "Make the sky purple", "Remove the items circled in red"`}
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleExport();
                                }
                            }}
                            className="sketch-canvas__textarea color-norm"
                        />
                    </div>
                )}

                <Toolbar
                    config={{ color: currentColor, strokeWidth, tool: 'pen' }}
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
    );
};
