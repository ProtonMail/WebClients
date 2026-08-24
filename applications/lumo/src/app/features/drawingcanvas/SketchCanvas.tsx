import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { injectNativeImageGenerationHelper } from '../../remote/nativeComposerBridgeHelpers';
import { isImeComposing } from '../../util/keyboard';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { useHistory } from './hooks/useHistory';
import type { CanvasConfig, DrawingMode, ExportOptions } from './types';
import { exportCanvasAsDataURL } from './utils/export';

import './SketchCanvas.scss';

interface SketchCanvasProps {
    mode?: DrawingMode;
    baseImage?: string;
    width?: number;
    height?: number;
    /** Show the description field inside the edit panel. Defaults to true for overlay mode. */
    showDescription?: boolean;
    onExport?: (imageData: string, mode: DrawingMode, description: string) => void;
    onClose: () => void;
    className?: string;
}

const DEFAULT_COLOR = '#000000';
const DEFAULT_STROKE_WIDTH = 4;

export const SketchCanvas = ({
    mode = 'blank',
    baseImage,
    width,
    height,
    showDescription,
    onExport,
    onClose,
    className,
}: SketchCanvasProps) => {
    const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
    const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
    const [description, setDescription] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    useNativeComposerVisibilityApi({ hideComposer: true });

    const { strokes, addStroke, undo, redo, clear, canUndo, canRedo } = useHistory();

    const config: CanvasConfig = { mode, baseImage, width, height };
    const shouldShowDescription = showDescription ?? mode === 'overlay';

    const handleExport = () => {
        const canvas = containerRef.current?.querySelector('canvas');
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
        const exportOptions: ExportOptions = { format: 'png', quality: 1 };
        const imageData = exportCanvasAsDataURL(canvas, exportOptions);
        const text = description.trim();
        injectNativeImageGenerationHelper(text);
        onExport?.(imageData, mode, description.trim());
    };

    const descriptionPlaceholder = c('collider_2025:Placeholder')
        .t`Draw and/or describe what to change, "remove the items", etc.`;

    const toolbar = (
        <Toolbar
            config={{ color: currentColor, strokeWidth, tool: 'pen' }}
            onColorChange={setCurrentColor}
            onStrokeWidthChange={setStrokeWidth}
            onUndo={undo}
            onRedo={redo}
            onClear={clear}
            onExport={handleExport}
            onClose={onClose}
            canUndo={canUndo}
            canRedo={canRedo}
        />
    );

    return (
        <div
            ref={containerRef}
            className={clsx('sketch-canvas sketch-canvas--modal flex flex-column w-full', className)}
        >
            <div className="sketch-canvas__canvas-area relative shrink-0 flex justify-center overflow-hidden w-full">
                <Canvas
                    config={config}
                    strokes={strokes}
                    currentColor={currentColor}
                    strokeWidth={strokeWidth}
                    onStrokeComplete={addStroke}
                    embedded
                />
            </div>

            <div className="sketch-canvas__controls shrink-0 w-full px-4 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4">
                <div className="sketch-canvas__edit-panel w-full bg-norm">
                    {shouldShowDescription && (
                        <>
                            <label className="sketch-canvas__edit-panel-text flex items-start gap-2 px-4 py-3 m-0 mb-3 border border-weak rounded-lg bg-weak">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={descriptionPlaceholder}
                                    rows={2}
                                    onKeyDown={(e) => {
                                        if (isImeComposing(e)) {
                                            return;
                                        }
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleExport();
                                        }
                                    }}
                                    className="sketch-canvas__description-input w-full text-sm color-norm"
                                    aria-label={c('collider_2025:Label').t`Describe what to change`}
                                />
                            </label>
                        </>
                    )}
                    {toolbar}
                </div>
            </div>
        </div>
    );
};
