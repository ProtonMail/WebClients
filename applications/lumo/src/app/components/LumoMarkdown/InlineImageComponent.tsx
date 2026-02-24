import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Icon } from '@proton/components';

import { useLazyAttachment } from '../../hooks';
import { useLumoDispatch } from '../../redux/hooks';
import { clearAttachmentLoading } from '../../redux/slices/attachmentLoadingState';
import { pullAttachmentRequest } from '../../redux/slices/core/attachments';
import { attachmentDataCache } from '../../services/attachmentDataCache';
import type { AttachmentId } from '../../types';

interface InlineImageComponentProps {
    attachmentId: AttachmentId;
    alt?: string;
}

export const InlineImageComponent: React.FC<InlineImageComponentProps> = ({ attachmentId, alt }) => {
    const dispatch = useLumoDispatch();
    const { data: attachment, isLoading, error } = useLazyAttachment(attachmentId);
    const spaceId = attachment?.spaceId;
    const [showModal, setShowModal] = useState(false);
    const [showDownload, setShowDownload] = useState(false);
    const [showModalButtons, setShowModalButtons] = useState(false);

    const imageDataUrl = useMemo(() => {
        if (!attachment) {
            return null;
        }

        // Try to get data from attachment first, then from cache
        const imageData = attachment.data || attachmentDataCache.getData(attachment.id);
        if (!imageData) {
            return null;
        }

        const mimeType = attachment.mimeType || 'image/png';
        const blob = new Blob([imageData], { type: mimeType });
        return URL.createObjectURL(blob);
    }, [attachmentId, attachment, attachment?.data, attachment?.mimeType, attachment?.id]);

    // Handle retry on error
    const handleRetry = () => {
        dispatch(clearAttachmentLoading(attachmentId));
        if (spaceId) dispatch(pullAttachmentRequest({ id: attachmentId, spaceId }));
    };

    const handleDownload = () => {
        if (!attachment) return;
        if (!imageDataUrl) return;
        const link = document.createElement('a');
        link.href = imageDataUrl;
        link.download = attachment.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle ESC key to close modal
    useEffect(() => {
        if (!showModal) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowModal(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showModal]);

    // Show error UI with retry button
    if (error || !attachment) {
        return (
            <span
                style={{
                    display: 'inline-block',
                    padding: '1rem',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '8px',
                    color: '#721c24',
                    maxWidth: '300px',
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Icon name="exclamation-circle" size={4} />
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Failed to load image</span>
                </span>
                {error && <span style={{ display: 'block', margin: '0 0 0.5rem 0', fontSize: '12px' }}>{error}</span>}
                <Button size="small" shape="solid" onClick={handleRetry}>
                    Retry
                </Button>
            </span>
        );
    }

    // Show loading UI
    if (isLoading || !imageDataUrl) {
        return (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    minWidth: '200px',
                    minHeight: '150px',
                }}
            >
                <CircleLoader size="medium" />
            </span>
        );
    }

    return (
        <>
            <span
                className="inline-image-preview relative cursor-pointer"
                onClick={() => setShowModal(true)}
                onMouseEnter={() => setShowDownload(true)}
                onMouseLeave={() => setShowDownload(false)}
                style={{ display: 'inline-block', position: 'relative' }}
            >
                <img
                    src={imageDataUrl}
                    alt={alt || attachment.filename}
                    style={{
                        maxWidth: '300px',
                        display: 'block',
                        borderRadius: '8px',
                    }}
                />
                {showDownload && (
                    <span
                        style={{
                            position: 'absolute',
                            bottom: '0.5rem',
                            right: '0.5rem',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            borderRadius: '8px',
                            padding: '2px',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                        }}
                    >
                        <Button
                            shape="ghost"
                            size="small"
                            icon
                            style={{
                                backgroundColor: 'transparent',
                                color: 'white',
                            }}
                        >
                            <Icon name="arrow-down-line" size={4} style={{ color: 'white' }} />
                        </Button>
                    </span>
                )}
            </span>

            {showModal &&
                createPortal(
                    <div
                        className="fixed inset-0 flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 9999 }}
                        onClick={() => setShowModal(false)}
                    >
                        <div
                            className="relative"
                            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                            onMouseEnter={() => setShowModalButtons(true)}
                            onMouseLeave={() => setShowModalButtons(false)}
                        >
                            <img
                                src={imageDataUrl}
                                alt={alt || attachment.filename}
                                style={{
                                    maxWidth: '90vw',
                                    maxHeight: '90vh',
                                    objectFit: 'contain',
                                    display: 'block',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {showModalButtons && (
                                <>
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            borderRadius: '8px',
                                            padding: '2px',
                                        }}
                                    >
                                        <Button
                                            shape="ghost"
                                            size="small"
                                            icon
                                            style={{
                                                backgroundColor: 'transparent',
                                                color: 'white',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowModal(false);
                                            }}
                                        >
                                            <Icon name="cross" size={4} style={{ color: 'white' }} />
                                        </Button>
                                    </div>
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: '1rem',
                                            right: '1rem',
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            borderRadius: '8px',
                                            padding: '2px',
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload();
                                        }}
                                    >
                                        <Button
                                            shape="ghost"
                                            size="small"
                                            icon
                                            style={{
                                                backgroundColor: 'transparent',
                                                color: 'white',
                                            }}
                                        >
                                            <Icon name="arrow-down-line" size={4} style={{ color: 'white' }} />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};
