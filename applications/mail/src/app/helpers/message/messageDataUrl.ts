import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';

import type { MessageState } from '../../store/messages/messagesTypes';
import { generateCid, setEmbeddedAttr } from './messageEmbeddeds';

// Reference Angular/src/app/composer/services/extractDataURI.js

/**
 * Convert data-uri to blob
 */
export const dataUrlToFile = (fileName: string, dataUrl: string) => {
    const [mime = '', byte = ''] = dataUrl.split(',');

    // separate out the mime component
    const mimeString = mime.split(':')[1].split(';')[0];

    try {
        // write the bytes of the string to an ArrayBuffer
        const data = base64StringToUint8Array(decodeURIComponent(byte));
        // write the ArrayBuffer to a blob, and you're done
        return new File([data], fileName, { type: mimeString });
    } catch {
        // Leave the image inline as-is, if the image fails to be parsed
        return new File([byte], fileName, { type: mimeString });
    }
};

/**
 * Transform every data-uri in the message content to embedded attachment
 */
export const replaceDataUrl = (message: MessageState) => {
    if (!message.messageDocument?.document) {
        return [];
    }

    // Store replaced images so that we can check for duplicates
    const cidMap = new Map<string, { cid: string; file: File }>();

    return [...message.messageDocument?.document.querySelectorAll('img')].reduce<{ cid: string; file: File }[]>(
        (acc, image) => {
            const src = image.src;
            // Ignore non-data:uri images and invalid data:uri
            if (!/data:image/.test(src) || !src.includes(',')) {
                return acc;
            }

            // If image has not been found yet, create cid and file for the image
            if (!cidMap.has(src)) {
                const cid = generateCid(generateProtonWebUID(), message.data?.Sender?.Address || '');
                const fileName = image.alt || `image${Date.now()}`;
                const file = dataUrlToFile(fileName, src);

                cidMap.set(src, { cid, file });
                acc.push({ cid, file });
            }

            // Get cid and insert it in the content
            const { cid } = cidMap.get(src)!;

            setEmbeddedAttr(cid, '', image);
            image.removeAttribute('src');

            return acc;
        },
        []
    );
};
