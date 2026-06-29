import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { SketchCanvas } from '../drawingcanvas/SketchCanvas';
import type { DrawingMode } from '../drawingcanvas/types';
import { ImageDownloadButton, ImageModifyButton, ImageStyleDropdown } from './ImageActionButtons';

import '../drawingcanvas/Canvas.scss';
import '../drawingcanvas/SketchCanvas.scss';
import './imageActions.scss';

type OverlayMode = 'preview' | 'edit';

/** Wider than 2:1 or taller than 1:2 — add inset padding so the image doesn't feel cramped. */
const EXTREME_ASPECT_MAX = 2;
const EXTREME_ASPECT_MIN = 0.5;

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
    /** Prompt text to display inside the overlay (used for inspiration images). */
    prompt?: string;
    /** Called when the user clicks "Try this". */
    onTryPrompt?: () => void;
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
    prompt,
    onTryPrompt,
}: ImagePreviewOverlayProps) => {
    const [mode, setMode] = useState<OverlayMode>(defaultMode);
    const [canvasDims, setCanvasDims] = useState<{ width: number; height: number } | null>(null);
    const [imageAspect, setImageAspect] = useState<number | null>(null);

    // Sync mode when overlay opens/closes
    useEffect(() => {
        if (isOpen) {
            setMode(defaultMode);
        } else {
            setMode('preview');
            setCanvasDims(null);
            setImageAspect(null);
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
        setImageAspect(img.naturalWidth / img.naturalHeight);
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

    const isExtremeAspect =
        imageAspect !== null && (imageAspect > EXTREME_ASPECT_MAX || imageAspect < EXTREME_ASPECT_MIN);

    return createPortal(
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            className="image-lightbox fixed inset-0 flex flex-column"
            role="dialog"
            aria-modal="true"
            aria-label={filename || c('collider_2025:Label').t`Image preview`}
        >
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

            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="image-lightbox__content flex-1 min-h-0 flex items-center justify-center" onClick={onClose}>
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div className="image-preview-shell flex flex-column max-h-full" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={c('collider_2025:Action').t`Close`}>
                        <button
                            type="button"
                            className="image-preview-close inline-flex items-center justify-center border rounded-lg bg-norm color-norm"
                            onClick={onClose}
                            aria-label={c('collider_2025:Action').t`Close`}
                        >
                            <LumoIcon name="X" size={16} />
                        </button>
                    </Tooltip>

                    <div
                        className={[
                            'image-preview-container bg-norm flex flex-column flex-nowrap items-center rounded-xxl max-h-full border border-weak',
                            mode === 'preview'
                                ? 'image-preview-container--preview'
                                : 'image-preview-container--edit overflow-hidden',
                            isExtremeAspect ? 'image-preview-container--extreme-aspect' : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                    >
                        {}
                        {mode === 'preview' ? (
                            <>
                                <div className="image-preview-media flex justify-center items-center w-full min-h-0">
                                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                                    <div className="image-preview-image-frame" onClick={(e) => e.stopPropagation()}>
                                        <img
                                            src={imageDataUrl}
                                            alt={filename || 'Generated image'}
                                            className="image-preview-image block"
                                        />
                                    </div>
                                </div>

                                {prompt && (
                                    <div className="px-2 pt-2">
                                        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                                        <div
                                            className="image-preview-prompt w-full"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <p className="image-preview-prompt__text">{prompt}</p>
                                            <Button
                                                icon
                                                size="small"
                                                shape="solid"
                                                color="weak"
                                                className="image-preview-prompt__copy"
                                                onClick={() => {
                                                    void navigator.clipboard.writeText(prompt);
                                                }}
                                                title={c('collider_2025:Action').t`Copy prompt`}
                                                aria-label={c('collider_2025:Action').t`Copy prompt`}
                                            >
                                                <LumoIcon name="Copy" size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                                <div
                                    className="image-preview-actions flex shrink-0 items-center justify-center w-full gap-2 px-6 pt-6 pb-8"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {onExport && <ImageModifyButton onClick={handleModify} />}
                                    {showStyleOptions && onChangeStyle && (
                                        <ImageStyleDropdown onSelect={handleStyleChange} stopPropagation />
                                    )}
                                    {onDownload && <ImageDownloadButton onClick={onDownload} />}
                                    {onTryPrompt && (
                                        <Button shape="solid" color="norm" size="medium" onClick={onTryPrompt}>
                                            {c('collider_2025:Action').t`Try this`}
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : !canvasDims ? (
                            <div className="image-preview-loading flex items-center justify-center p-12 w-full">
                                <div className="canvas__loading-spinner inline-block rounded-full" />
                            </div>
                        ) : (
                            <SketchCanvas
                                mode="overlay"
                                baseImage={imageDataUrl}
                                width={canvasDims.width}
                                height={canvasDims.height}
                                showDescription
                                onExport={handleExport}
                                onClose={() => setMode('preview')}
                            />
                        )}
                    </div>
                </div>
            </div>

            {formattedDate && mode === 'preview' && (
                <div className="image-lightbox__date">
                    {c('collider_2025:Label').t`Created on`} {formattedDate}
                </div>
            )}
        </div>,
        document.body
    );
};
