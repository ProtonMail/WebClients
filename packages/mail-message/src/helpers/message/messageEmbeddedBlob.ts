import { couldPotentiallyBeRenderedAsSVG } from '@proton/shared/lib/helpers/mimetype';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

const urlCreator = () => window.URL || window.webkitURL;

export const createBlob = (attachment: Attachment, data: Uint8Array<ArrayBuffer> | string) => {
    const mimeType = couldPotentiallyBeRenderedAsSVG(attachment.MIMEType || '')
        ? 'application/octet-stream'
        : attachment.MIMEType;
    const blob = new Blob([data], { type: mimeType });
    return urlCreator().createObjectURL(blob);
};
