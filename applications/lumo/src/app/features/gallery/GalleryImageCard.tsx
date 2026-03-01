import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Icon } from '@proton/components';

import { useLazyAttachment } from '../../hooks/useLazyAttachment';
import { useFileHandling } from '../../components/Composer/hooks/useFileHandling';
import { useLumoNavigate } from '../../hooks/useLumoNavigate';
import { attachmentDataCache } from '../../services/attachmentDataCache';
import type { AttachmentId } from '../../types';
import type { DrawingMode } from '../../features/drawingcanvas/types';
import { ImagePreviewOverlay } from '../../features/imageActions/ImagePreviewOverlay';

interface GalleryImageCardProps {
    attachmentId: AttachmentId;
    createdAt: Date;
    onExport?: (imageData: string, mode: DrawingMode, description: string) => void;
}

export const GalleryImageCard = ({ attachmentId, createdAt, onExport }: GalleryImageCardProps) => {
    const { data: attachment, isLoading } = useLazyAttachment(attachmentId);
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [overlayDefaultMode, setOverlayDefaultMode] = useState<'preview' | 'edit'>('preview');
    const [hovered, setHovered] = useState(false);
    const navigate = useLumoNavigate();
    const { handleFilesSelected } = useFileHandling({ messageChain: [] });

    const imageDataUrl = useMemo(() => {
        if (!attachment) return null;
        const imageData = attachment.data || attachmentDataCache.getData(attachment.id);
        if (!imageData) return null;
        const mimeType = attachment.mimeType || 'image/png';
        const blob = new Blob([imageData], { type: mimeType });
        return URL.createObjectURL(blob);
    }, [attachmentId, attachment, attachment?.data, attachment?.id, attachment?.mimeType]);

    const openOverlay = useCallback((mode: 'preview' | 'edit' = 'preview') => {
        setOverlayDefaultMode(mode);
        setOverlayOpen(true);
    }, []);

    const handleDownload = useCallback(
        (e?: React.MouseEvent) => {
            e?.stopPropagation();
            if (!imageDataUrl) return;
            const link = document.createElement('a');
            link.href = imageDataUrl;
            link.download = attachment?.filename || `generated-image-${attachmentId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        [imageDataUrl, attachment, attachmentId]
    );

    const handleChangeStyle = useCallback(
        async (prompt: string) => {
            if (imageDataUrl) {
                try {
                    const resp = await fetch(imageDataUrl);
                    const blob = await resp.blob();
                    const file = new File([blob], attachment?.filename || 'image.png', { type: blob.type });
                    handleFilesSelected([file]);
                } catch {
                    // proceed without attachment
                }
            }
            navigate(`/?prefill=${encodeURIComponent(prompt)}`);
        },
        [imageDataUrl, attachment, handleFilesSelected, navigate]
    );

    const formattedDate = createdAt.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: createdAt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });

    if (isLoading || !imageDataUrl) {
        return (
            <div className="gallery-card gallery-card--loading">
                <CircleLoader size="medium" />
            </div>
        );
    }

    return (
        <>
            {/* Thumbnail */}
            <div
                className="gallery-card"
                onClick={() => openOverlay('preview')}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openOverlay('preview')}
                aria-label={`Generated image from ${formattedDate}`}
            >
                <img
                    src={imageDataUrl}
                    alt={`Generated image from ${formattedDate}`}
                    className="gallery-card__image"
                    loading="lazy"
                />
                {hovered && (
                    <div className="gallery-card__overlay">
                        <span className="gallery-card__date">{formattedDate}</span>
                        <div className="gallery-card__actions">
                            {onExport && (
                                <button
                                    className="gallery-card__action-btn"
                                    onClick={(e) => { e.stopPropagation(); openOverlay('edit'); }}
                                    aria-label={c('collider_2025:Action').t`Edit image`}
                                    title={c('collider_2025:Action').t`Edit image`}
                                >
                                    <Icon name="pen" size={4} />
                                </button>
                            )}
                            <button
                                className="gallery-card__action-btn"
                                onClick={handleDownload}
                                aria-label={c('collider_2025:Action').t`Download image`}
                                title={c('collider_2025:Action').t`Download image`}
                            >
                                <Icon name="arrow-down-line" size={4} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ImagePreviewOverlay
                isOpen={overlayOpen}
                defaultMode={overlayDefaultMode}
                imageDataUrl={imageDataUrl}
                filename={attachment?.filename}
                createdAt={createdAt}
                onClose={() => setOverlayOpen(false)}
                onDownload={handleDownload}
                onExport={onExport}
                onChangeStyle={handleChangeStyle}
            />
        </>
    );
};
