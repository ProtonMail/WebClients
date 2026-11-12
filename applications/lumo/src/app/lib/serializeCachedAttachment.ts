import type { AesGcmCryptoKey } from '../crypto/types';
import { serializeAttachment } from '../serialization';
import { attachmentDataCache } from '../services/attachmentDataCache';
import type { Attachment } from '../types';

/** Restores cached binary content before encrypting an attachment for local storage and sync. */
export function serializeCachedAttachment(attachment: Attachment, spaceDek: AesGcmCryptoKey) {
    return serializeAttachment(
        {
            ...attachment,
            data: attachmentDataCache.getData(attachment.id) ?? attachment.data,
            imagePreview: attachmentDataCache.getImagePreview(attachment.id) ?? attachment.imagePreview,
        },
        spaceDek
    );
}
