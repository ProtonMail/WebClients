import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Icon } from '@proton/components';

import type { DrawingMode } from './types';
import { SketchCanvas } from './SketchCanvas';
import '../imageActions/imageActions.scss';
import './SketchCanvas.scss';

interface SketchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (imageData: string, mode: DrawingMode, description: string) => void;
    mode?: DrawingMode;
    baseImage?: string;
    canvasWidth?: number;
    canvasHeight?: number;
}

export const SketchOverlay = ({
    isOpen,
    onClose,
    onExport,
    mode = 'blank',
    baseImage,
    canvasWidth,
    canvasHeight,
}: SketchOverlayProps) => {
    const handleExport = (imageData: string, drawingMode: DrawingMode, description: string) => {
        try {
            onExport(imageData, drawingMode, description);
            onClose();
        } catch (error) {
            console.error('Error exporting drawing:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="image-lightbox fixed inset-0 flex flex-column"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawing-canvas-title"
        >
            <button
                className="image-icon-btn absolute inline-flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ top: '1rem', right: '1rem', zIndex: 1 }}
                onClick={onClose}
                title={c('collider_2025:Action').t`Close`}
            >
                <Icon name="cross" size={4} />
            </button>

            <div className="flex-1 min-h-0 relative">
                <SketchCanvas
                    mode={mode}
                    baseImage={baseImage}
                    width={canvasWidth ?? 1200}
                    height={canvasHeight ?? 800}
                    onExport={handleExport}
                    onClose={onClose}
                />
            </div>
        </div>,
        document.body
    );
};
