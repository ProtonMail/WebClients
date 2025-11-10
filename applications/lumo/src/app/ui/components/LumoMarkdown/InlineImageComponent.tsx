import React, { useMemo } from 'react';

import type { Attachment } from '../../../types';

interface InlineImageComponentProps {
    attachment: Attachment | undefined;
    alt?: string;
}

export const InlineImageComponent: React.FC<InlineImageComponentProps> = ({ attachment, alt }) => {
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

    return (
        <div className="inline-image-container">
            <img
                src={imageDataUrl}
                alt={alt || attachment.filename}
                style={{ maxWidth: '300px', display: 'block' }}
            />
        </div>
    );
};
