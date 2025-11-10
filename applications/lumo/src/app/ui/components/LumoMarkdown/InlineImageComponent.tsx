import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Icon } from '@proton/components';
import { Button } from '@proton/atoms';

import type { Attachment } from '../../../types';

interface InlineImageComponentProps {
    attachment: Attachment | undefined;
    alt?: string;
}

export const InlineImageComponent: React.FC<InlineImageComponentProps> = ({ attachment, alt }) => {
    const [showModal, setShowModal] = useState(false);
    const [showDownload, setShowDownload] = useState(false);

    const imageDataUrl = useMemo(() => {
        if (!attachment?.data) {
            return null;
        }

        const mimeType = attachment.mimeType || 'image/png';
        const blob = new Blob([attachment.data], { type: mimeType });
        return URL.createObjectURL(blob);
    }, [attachment?.data, attachment?.mimeType]);

    if (!attachment) {
        return null;
    }

    if (!imageDataUrl) {
        return null;
    }

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageDataUrl;
        link.download = attachment.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div
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
                    <div
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                        }}
                    >
                        <Button
                            shape="solid"
                            color="weak"
                            size="small"
                            icon
                            className="rounded bg-norm shadow-norm"
                        >
                            <Icon name="arrow-down-line" size={4} />
                        </Button>
                    </div>
                )}
            </div>

            {showModal &&
                createPortal(
                    <div
                        className="fixed inset-0 flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 9999 }}
                        onClick={() => setShowModal(false)}
                    >
                        <div className="relative max-w-[90vw] max-h-[90vh]">
                            <img
                                src={imageDataUrl}
                                alt={alt || attachment.filename}
                                style={{
                                    maxWidth: '90vw',
                                    maxHeight: '90vh',
                                    objectFit: 'contain',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="absolute top-4 right-4">
                                <Button
                                    shape="solid"
                                    color="weak"
                                    size="small"
                                    icon
                                    className="rounded bg-norm shadow-norm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowModal(false);
                                    }}
                                >
                                    <Icon name="cross" size={4} />
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};
