import React, { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import type { DrawingMode } from '../../features/drawingcanvas/types';
import { ImageModifyButton } from '../../features/imageActions/ImageActionButtons';
import { ImagePreviewOverlay } from '../../features/imageActions/ImagePreviewOverlay';
import { useLazyAttachment } from '../../hooks';
import { useLumoDispatch } from '../../redux/hooks';
import { clearAttachmentLoading } from '../../redux/slices/attachmentLoadingState';
import { setPendingPrefill } from '../../redux/slices/composerActions';
import { pullAttachmentRequest } from '../../redux/slices/core/attachments';
import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { attachmentDataCache } from '../../services/attachmentDataCache';
import type { AttachmentId } from '../../types';
import { base64ToFile } from '../../util/imageHelpers';
import { useFileHandling } from '../Composer/hooks/useFileHandling';
import { LumoIcon } from '../LumoIcon/LumoIcon';

import '../../features/imageActions/imageActions.scss';

interface InlineImageComponentProps {
    attachmentId: AttachmentId;
    alt?: string;
}

export const InlineImageComponent: React.FC<InlineImageComponentProps> = ({ attachmentId, alt }) => {
    const dispatch = useLumoDispatch();
    const { data: attachment, isLoading, error } = useLazyAttachment(attachmentId);
    const spaceId = attachment?.spaceId;
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [overlayDefaultMode, setOverlayDefaultMode] = useState<'preview' | 'edit'>('preview');

    const { handleFilesSelected } = useFileHandling({ messageChain: [] });

    // The overlay covers the viewport, so hide the native composer while it's
    // open and restore it on close.
    const handleOpenOverlay = useCallback((mode: 'preview' | 'edit') => {
        setOverlayDefaultMode(mode);
        setOverlayOpen(true);
        setNativeComposerVisibility(false);
    }, []);

    const handleCloseOverlay = useCallback(() => {
        setOverlayOpen(false);
        setNativeComposerVisibility(true);
    }, []);

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
            // Prefill the current conversation's composer — do not navigate away.
            const prefill = description || c('collider_2025:Prefill').t`Edit this image:`;
            dispatch(setPendingPrefill(prefill));
        },
        [handleFilesSelected, dispatch]
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
            // Prefill the current conversation's composer — do not navigate away.
            dispatch(setPendingPrefill(prompt));
        },
        [imageDataUrl, attachment, handleFilesSelected, dispatch]
    );

    // ── Error / loading states ─────────────────────────────────────────────────

    // The reference points to an attachment that doesn't exist in the store (e.g. a
    // fabricated/duplicated `attachment:<id>` the model wrote into its prose). There is
    // nothing to load or retry, so render nothing instead of a dead "Failed to load" box.
    if (!attachment) {
        return null;
    }

    if (error) {
        return (
            <span
                className="inline-block p-4 rounded-lg border"
                style={{ background: '#f8d7da', borderColor: '#f5c6cb', color: '#721c24', maxWidth: '300px' }}
            >
                <span className="flex items-center gap-2 mb-2">
                    <LumoIcon name="Info" size={16} />
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
            <span className="inline-image-card">
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <span className="cursor-pointer" onClick={() => handleOpenOverlay('preview')}>
                    <img src={imageDataUrl} alt={alt || attachment.filename} />
                </span>

                <span className="inline-image-card__overlay">
                    <Button
                        className="inline-image-card__btn inline-image-card__btn--expand"
                        shape="solid"
                        color="weak"
                        icon
                        size="small"
                        title={c('collider_2025:Action').t`Expand`}
                        onClick={() => handleOpenOverlay('preview')}
                    >
                        <LumoIcon name="Maximize2" size={16} />
                    </Button>

                    <ImageModifyButton
                        className="inline-image-card__btn inline-image-card__btn--modify"
                        onClick={() => handleOpenOverlay('edit')}
                    />

                    <Button
                        className="inline-image-card__btn inline-image-card__btn--download"
                        shape="solid"
                        color="weak"
                        icon
                        size="small"
                        title={c('collider_2025:Action').t`Download`}
                        onClick={(e) => handleDownload(e)}
                    >
                        <LumoIcon name="ArrowDownToLine" size={16} />
                    </Button>
                </span>
            </span>

            <ImagePreviewOverlay
                isOpen={overlayOpen}
                defaultMode={overlayDefaultMode}
                imageDataUrl={imageDataUrl}
                filename={attachment.filename}
                onClose={handleCloseOverlay}
                onDownload={handleDownload}
                onExport={handleSketchExport}
                onChangeStyle={handleChangeStyle}
            />
        </>
    );
};
