import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { generateCid, setEmbeddedAttr } from './messageEmbeddeds';
import { MessageState } from '../../logic/messages/messagesTypes';

// Reference Angular/src/app/composer/services/extractDataURI.js

/**
 * Convert data-uri to blob
 */
const dataUrlToFile = (fileName: string, dataUrl: string) => {
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

    return [...message.messageDocument?.document.querySelectorAll('img')]
        .map((image) => ({ image, src: image.src || '' }))
        .filter(({ src }) => /data:image/.test(src)) // only data:uri image
        .filter(({ src }) => src.includes(',')) // remove invalid data:uri
        .map(({ image, src }) => {
            const cid = generateCid(generateProtonWebUID(), message.data?.Sender?.Address || '');

            const fileName = image.alt || `image${Date.now()}`;
            const file = dataUrlToFile(fileName, src);

            setEmbeddedAttr(cid, '', image);
            image.removeAttribute('src');

            return { cid, file };
        });
};
