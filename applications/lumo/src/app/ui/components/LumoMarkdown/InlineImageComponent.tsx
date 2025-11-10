import React, { useMemo } from 'react';

import type { Attachment } from '../../../types';

interface InlineImageComponentProps {
    attachment: Attachment | undefined;
    alt?: string;
}

export const InlineImageComponent: React.FC<InlineImageComponentProps> = ({ attachment, alt }) => {
    console.log('[IMAGE_DEBUG] InlineImageComponent render', {
        hasAttachment: !!attachment,
        attachmentId: attachment?.id,
        hasData: !!attachment?.data,
        dataLength: attachment?.data?.length,
        mimeType: attachment?.mimeType,
        alt,
    });

    const imageDataUrl = useMemo(() => {
        if (!attachment?.data) {
            console.log('[IMAGE_DEBUG] InlineImageComponent: No attachment data');
            return null;
        }

        const mimeType = attachment.mimeType || 'image/png';
        const blob = new Blob([attachment.data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        console.log('[IMAGE_DEBUG] InlineImageComponent: Created blob URL', {
            url,
            blobSize: blob.size,
            mimeType,
        });
        return url;
    }, [attachment?.data, attachment?.mimeType]);

    if (!attachment) {
        console.log('[IMAGE_DEBUG] InlineImageComponent: No attachment, returning null');
        return null;
    }

    if (!imageDataUrl) {
        console.log('[IMAGE_DEBUG] InlineImageComponent: No imageDataUrl, returning null');
        return null;
    }

    console.log('[IMAGE_DEBUG] InlineImageComponent: Rendering image', { imageDataUrl });

    return (
        <div className="inline-image-container">
            <img
                src={imageDataUrl}
                alt={alt || attachment.filename}
                style={{ maxWidth: '300px', display: 'block' }}
                onLoad={() => console.log('[IMAGE_DEBUG] Image loaded successfully')}
                onError={(e) => console.error('[IMAGE_DEBUG] Image load error', e)}
            />
        </div>
    );
};
