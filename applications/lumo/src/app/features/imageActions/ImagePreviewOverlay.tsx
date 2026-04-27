import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Icon } from '@proton/components';

import { SketchCanvas } from '../drawingcanvas/SketchCanvas';
import type { DrawingMode } from '../drawingcanvas/types';
import { ImageModifyButton, ImageStyleDropdown } from './ImageActionButtons';

import '../drawingcanvas/SketchCanvas.scss';
import './imageActions.scss';

type OverlayMode = 'preview' | 'edit';

export interface ImagePreviewOverlayProps {
    isOpen: boolean;
    imageDataUrl: string;
    filename?: string;
    createdAt?: Date;
    /** Open directly in edit mode (e.g. from a thumbnail shortcut). Defaults to 'preview'. */
    defaultMode?: OverlayMode;
    onClose: () => void;
    onDownload?: () => void;
    /** Called when the sketch canvas Done button is pressed. The overlay closes itself afterwards. */
    onExport?: (imageData: string, mode: DrawingMode, description: string) => void;
    /** Called when a style option is selected. The overlay closes itself afterwards. */
    onChangeStyle?: (prompt: string) => void;
    /** Pass false to hide the style dropdown entirely. Defaults to true. */
    showStyleOptions?: boolean;
}

export const ImagePreviewOverlay = ({
    isOpen,
    imageDataUrl,
    filename,
    createdAt,
    defaultMode = 'preview',
    onClose,
    onDownload,
    onExport,
    onChangeStyle,
    showStyleOptions = true,
}: ImagePreviewOverlayProps) => {
    const [mode, setMode] = useState<OverlayMode>(defaultMode);
    const [canvasDims, setCanvasDims] = useState<{ width: number; height: number } | null>(null);

    // Sync mode when overlay opens/closes
    useEffect(() => {
        if (isOpen) {
            setMode(defaultMode);
        } else {
            setMode('preview');
            setCanvasDims(null);
        }
    }, [isOpen, defaultMode]);

    // Keyboard: Escape goes back to preview in edit mode, or closes in preview mode
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (mode === 'edit') setMode('preview');
                else onClose();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, mode, onClose]);

    // Body scroll lock
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Pre-compute canvas dimensions from the loaded image so switching to edit
    // mode is instant — no async re-load needed.
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const MAX = 2400;
        const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        setCanvasDims({
            width: Math.round(img.naturalWidth * scale),
            height: Math.round(img.naturalHeight * scale),
        });
    };

    const handleModify = () => {
        setMode('edit');
    };

    const handleExport = (imageData: string, drawingMode: DrawingMode, description: string) => {
        onExport?.(imageData, drawingMode, description);
        onClose();
    };

    const handleStyleChange = (prompt: string) => {
        onChangeStyle?.(prompt);
        onClose();
    };

    if (!isOpen) return null;

    const formattedDate = createdAt?.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: createdAt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });

    return createPortal(
        <div className="image-lightbox fixed inset-0 flex flex-column" style={{ zIndex: 9999 }}>
            {/*
             * Hidden image: always present so dims are precomputed regardless of
             * which mode is active. Not shown to the user.
             */}
            <img
                src={imageDataUrl}
                alt=""
                aria-hidden
                onLoad={handleImageLoad}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
            />

            {/* Top-right: back arrow in edit mode, download + close in preview mode */}
            <div className="flex gap-2" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1 }}>
                {mode === 'preview' && onDownload && (
                    <button
                        className="image-icon-btn inline-flex items-center justify-center w-8 h-8 rounded-lg"
                        onClick={onDownload}
                        title={c('collider_2025:Action').t`Download`}
                    >
                        <Icon name="arrow-down-line" size={4} />
                    </button>
                )}
                <button
                    className="image-icon-btn inline-flex items-center justify-center w-8 h-8 rounded-lg"
                    onClick={mode === 'edit' ? () => setMode('preview') : onClose}
                    title={mode === 'edit' ? c('collider_2025:Action').t`Back` : c('collider_2025:Action').t`Close`}
                >
                    <Icon name={mode === 'edit' ? 'arrow-left' : 'cross'} size={4} />
                </button>
            </div>

            {mode === 'preview' ? (
                <>
                    {/* Centered image */}
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div
                        className="flex-1 min-h-0 flex items-center justify-center"
                        style={{ padding: '4rem 2rem 1rem' }}
                        onClick={onClose}
                    >
                        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
                        <img
                            src={imageDataUrl}
                            alt={filename || 'Generated image'}
                            className="block rounded-xl"
                            style={{
                                maxWidth: '80vw',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Action bar */}
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div
                        className="flex items-center justify-center gap-2 flex-wrap pb-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {onExport && <ImageModifyButton onClick={handleModify} />}
                        {showStyleOptions && onChangeStyle && (
                            <ImageStyleDropdown onSelect={handleStyleChange} stopPropagation />
                        )}
                    </div>

                    {formattedDate && (
                        <div
                            style={{
                                textAlign: 'center',
                                paddingBottom: '1.5rem',
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '12px',
                            }}
                        >
                            {c('collider_2025:Label').t`Created on`} {formattedDate}
                        </div>
                    )}
                </>
            ) : (
                /* Edit mode: SketchCanvas takes all remaining space */
                <div className="flex-1 min-h-0 relative">
                    <SketchCanvas
                        mode="overlay"
                        baseImage={imageDataUrl}
                        width={canvasDims?.width}
                        height={canvasDims?.height}
                        onExport={handleExport}
                        onClose={() => setMode('preview')}
                    />
                </div>
            )}
        </div>,
        document.body
    );
};
