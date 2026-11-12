import { omit } from '@proton/shared/lib/helpers/object';

import type { DbApi } from '../../indexedDb/db';
import { serializeCachedAttachment } from '../../lib/serializeCachedAttachment';
import { deserializeAttachment } from '../../serialization';
import type { Attachment, Space } from '../../types';
import { cleanAttachment, getSpaceDek } from '../../types';
import { attachmentDataCache } from '../attachmentDataCache';

export type RecoveryAttachment = { attachment: Attachment } & (
    | { storage: 'account'; spaceKey: string }
    | { storage: 'memory' }
    | { storage?: undefined; data?: string; imagePreview?: string }
);

interface SavedAttachment {
    attachment: Attachment;
    data?: Uint8Array<ArrayBuffer>;
    imagePreview?: Uint8Array<ArrayBuffer>;
}

function sameBytes(current: Uint8Array<ArrayBuffer>, saved: Uint8Array<ArrayBuffer> | undefined): boolean {
    return (
        saved !== undefined &&
        current.byteLength === saved.byteLength &&
        current.every((byte, index) => byte === saved[index])
    );
}

export class RecoveryAttachmentWriter {
    private readonly saved = new Map<string, SavedAttachment>();

    constructor(private readonly dbApi?: DbApi) {}

    async capture(attachments: Attachment[], spaces: Record<string, Space>): Promise<RecoveryAttachment[]> {
        const result: RecoveryAttachment[] = [];
        for (const attachment of attachments) {
            const metadata = omit(attachment, ['data', 'imagePreview', 'pageImages']);
            if (this.dbApi === undefined) {
                if (attachment.data !== undefined) {
                    attachmentDataCache.setData(attachment.id, attachment.data);
                }
                if (attachment.imagePreview !== undefined) {
                    attachmentDataCache.setImagePreview(attachment.id, attachment.imagePreview);
                }
                if (attachment.pageImages !== undefined) {
                    attachmentDataCache.setPageImages(attachment.id, attachment.pageImages);
                }
                result.push({ attachment: metadata, storage: 'memory' });
            } else {
                const space = attachment.spaceId === undefined ? undefined : spaces[attachment.spaceId];
                if (space === undefined) {
                    throw new Error('Recovery attachment has no owning space');
                }
                await this.ensureStored(attachment, space, this.dbApi);
                result.push({ attachment: omit(metadata, ['markdown']), storage: 'account', spaceKey: space.spaceKey });
            }
        }
        return result;
    }

    private async ensureStored(attachment: Attachment, space: Space, dbApi: DbApi): Promise<void> {
        const data = attachmentDataCache.getData(attachment.id) ?? attachment.data;
        const imagePreview = attachmentDataCache.getImagePreview(attachment.id) ?? attachment.imagePreview;
        const previous = this.saved.get(attachment.id);
        if (previous?.attachment === attachment && previous.data === data && previous.imagePreview === imagePreview) {
            return;
        }
        const existing = await dbApi.getAttachmentById(attachment.id);
        if (existing?.deleted) {
            throw new Error('Recovery attachment was deleted');
        }
        const key = await getSpaceDek(space);
        const decoded = existing?.encrypted === undefined ? null : await deserializeAttachment(existing, key);
        const needsWrite =
            decoded === null ||
            (data !== undefined && !sameBytes(data, decoded.data)) ||
            (imagePreview !== undefined && !sameBytes(imagePreview, decoded.imagePreview)) ||
            (attachment.markdown !== undefined && attachment.markdown !== decoded.markdown);
        if (needsWrite) {
            const serialized = await serializeCachedAttachment(attachment, key);
            if (serialized === null || serialized === undefined) {
                throw new Error('Recovery attachment could not be encrypted');
            }
            await dbApi.updateAttachment(serialized, { dirty: existing?.dirty ?? true });
        }
        this.saved.set(attachment.id, { attachment, data, imagePreview });
    }
}

export async function restoreRecoveryAttachment(entry: RecoveryAttachment, dbApi?: DbApi): Promise<Attachment> {
    let attachment = entry.attachment;
    if (entry.storage === 'account') {
        const stored = await dbApi?.getAttachmentById(attachment.id);
        if (stored === undefined || stored.deleted || stored.encrypted === undefined) {
            throw new Error('Recovery attachment is unavailable locally');
        }
        const decoded = await deserializeAttachment(stored, await getSpaceDek({ spaceKey: entry.spaceKey }));
        if (decoded === null) {
            throw new Error('Recovery attachment could not be decrypted');
        }
        attachment = { ...decoded, ...attachment };
        if (decoded.data !== undefined) {
            attachmentDataCache.setData(attachment.id, decoded.data);
        }
        if (decoded.imagePreview !== undefined) {
            attachmentDataCache.setImagePreview(attachment.id, decoded.imagePreview);
        }
    } else if (entry.storage === undefined) {
        if (entry.data !== undefined) {
            attachmentDataCache.setData(attachment.id, Uint8Array.fromBase64(entry.data));
        }
        if (entry.imagePreview !== undefined) {
            attachmentDataCache.setImagePreview(attachment.id, Uint8Array.fromBase64(entry.imagePreview));
        }
    }
    return cleanAttachment(attachment);
}
