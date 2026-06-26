import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcCross } from '@proton/icons/icons/IcCross';

import { SketchCanvas } from './SketchCanvas';
import type { DrawingMode } from './types';

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
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            className="image-lightbox fixed inset-0 flex flex-column"
            role="dialog"
            aria-modal="true"
            aria-label={c('collider_2025:Label').t`Draw a sketch`}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="image-lightbox__content flex-1 min-h-0 flex items-center justify-center" onClick={onClose}>
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div className="image-preview-shell flex flex-column max-h-full" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={c('collider_2025:Action').t`Close`}>
                        <button
                            type="button"
                            className="image-preview-close inline-flex items-center justify-center border rounded-full bg-norm color-norm"
                            onClick={onClose}
                            aria-label={c('collider_2025:Action').t`Close`}
                        >
                            <IcCross size={4} />
                        </button>
                    </Tooltip>

                    <div className="image-preview-container image-preview-container--edit bg-norm flex flex-column flex-nowrap items-center rounded-xxl max-h-full overflow-hidden">
                        <SketchCanvas
                            mode={mode}
                            baseImage={baseImage}
                            width={canvasWidth ?? 1200}
                            height={canvasHeight ?? 800}
                            showDescription={false}
                            onExport={handleExport}
                            onClose={onClose}
                        />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
