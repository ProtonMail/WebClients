import React, { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Icon } from '@proton/components';

import { useLumoDispatch } from '../../redux/hooks';
import { clearAttachmentLoading } from '../../redux/slices/attachmentLoadingState';
import { pullAttachmentRequest } from '../../redux/slices/core/attachments';
import { attachmentDataCache } from '../../services/attachmentDataCache';
import type { AttachmentId } from '../../types';
import type { DrawingMode } from '../../features/drawingcanvas/types';
import { base64ToFile } from '../../util/imageHelpers';
import { useFileHandling } from '../Composer/hooks/useFileHandling';
import { useLazyAttachment } from '../../hooks';
import { useLumoNavigate } from '../../hooks/useLumoNavigate';
import { ImagePreviewOverlay } from '../../features/imageActions/ImagePreviewOverlay';
import '../../features/imageActions/imageActions.scss';

interface InlineImageComponentProps {
    attachmentId: AttachmentId;
    alt?: string;
}

export const InlineImageComponent: React.FC<InlineImageComponentProps> = ({ attachmentId, alt }) => {
    const dispatch = useLumoDispatch();
    const navigate = useLumoNavigate();
    const { data: attachment, isLoading, error } = useLazyAttachment(attachmentId);
    const spaceId = attachment?.spaceId;
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [overlayDefaultMode, setOverlayDefaultMode] = useState<'preview' | 'edit'>('preview');

    const { handleFilesSelected } = useFileHandling({ messageChain: [] });

    const imageDataUrl = useMemo(() => {
        if (!attachment) return null;
        const imageData = attachment.data || attachmentDataCache.getData(attachment.id);
        if (!imageData) return null;
        const mimeType = attachment.mimeType || 'image/png';
        const blob = new Blob([imageData], { type: mimeType });
        return URL.createObjectURL(blob);
    }, [attachmentId, attachment, attachment?.data, attachment?.mimeType, attachment?.id]);

    const handleRetry = () => {
        dispatch(clearAttachmentLoading(attachmentId));
        if (spaceId) dispatch(pullAttachmentRequest({ id: attachmentId, spaceId }));
    };

    const handleDownload = useCallback(
        (e?: React.MouseEvent) => {
            e?.stopPropagation();
            if (!attachment || !imageDataUrl) return;
            const link = document.createElement('a');
            link.href = imageDataUrl;
            link.download = attachment.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        [attachment, imageDataUrl]
    );

    const handleSketchExport = useCallback(
        async (imageData: string, _mode: DrawingMode, description: string) => {
            const file = base64ToFile(imageData, `edited-image-${Date.now()}.png`);
            handleFilesSelected([file]);
            const prefill = description || c('collider_2025:Prefill').t`Edit this image:`;
            navigate(`/?prefill=${encodeURIComponent(prefill)}`);
        },
        [handleFilesSelected, navigate]
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

    // ── Error / loading states ─────────────────────────────────────────────────

    if (error || !attachment) {
        return (
            <span className="inline-block p-4 rounded-lg border" style={{ background: '#f8d7da', borderColor: '#f5c6cb', color: '#721c24', maxWidth: '300px' }}>
                <span className="flex items-center gap-2 mb-2">
                    <Icon name="exclamation-circle" size={4} />
                    <span className="text-sm font-bold">{c('collider_2025:Error').t`Failed to load image`}</span>
                </span>
                {error && <span className="block mb-2 text-xs">{error}</span>}
                <Button size="small" shape="solid" onClick={handleRetry}>
                    {c('collider_2025:Action').t`Retry`}
                </Button>
            </span>
        );
    }

    if (isLoading || !imageDataUrl) {
        return (
            <span
                className="inline-flex items-center justify-center p-8 bg-strong rounded-xl"
                style={{ minWidth: '200px', minHeight: '150px' }}
            >
                <CircleLoader size="medium" />
            </span>
        );
    }

    // ── Main render ────────────────────────────────────────────────────────────

    return (
        <>
            {/* Inline thumbnail + action row */}
            <span style={{ display: 'inline-block', verticalAlign: 'top' }}>
                <span
                    className="block cursor-pointer rounded-xl overflow-hidden leading-none"
                    onClick={() => { setOverlayDefaultMode('preview'); setOverlayOpen(true); }}
                >
                    <img
                        src={imageDataUrl}
                        alt={alt || attachment.filename}
                        className="block rounded-xl w-full"
                        style={{ maxWidth: '300px' }}
                    />
                </span>
                <span className="flex items-center gap-2 mt-2 flex-wrap">
                    <button
                        className="image-action-btn"
                        onClick={() => { setOverlayDefaultMode('edit'); setOverlayOpen(true); }}
                    >
                        <Icon name="pen" size={3.5} />
                        {c('collider_2025:Action').t`Modify...`}
                    </button>
                </span>

            </span>

            <ImagePreviewOverlay
                isOpen={overlayOpen}
                defaultMode={overlayDefaultMode}
                imageDataUrl={imageDataUrl}
                filename={attachment.filename}
                onClose={() => setOverlayOpen(false)}
                onDownload={handleDownload}
                onExport={handleSketchExport}
                onChangeStyle={handleChangeStyle}
            />
        </>
    );
};
