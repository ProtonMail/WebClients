import { useEffect } from 'react';

import type { DrawingMode } from './types';
import { SketchCanvas } from './SketchCanvas';

interface SketchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (imageData: string, mode: DrawingMode) => void;
    mode?: DrawingMode;
    baseImage?: string;
}

export const SketchOverlay = ({
    isOpen,
    onClose,
    onExport,
    mode = 'blank',
    baseImage,
}: SketchOverlayProps) => {
    const handleExport = (imageData: string, drawingMode: DrawingMode) => {
        try {
            onExport(imageData, drawingMode);
            onClose();
        } catch (error) {
            console.error('Error exporting drawing:', error);
        }
    };

    // Prevent body scroll when overlay is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex flex-col"
            style={{
                zIndex: 9999,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawing-canvas-title"
        >

            {/* Canvas Area */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <SketchCanvas
                    mode={mode}
                    baseImage={baseImage}
                    width={1200}
                    height={800}
                    onExport={handleExport}
                    onClose={onClose}
                />
            </div>
        </div>
    );
};
