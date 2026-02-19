import partition from 'lodash/partition';

import type { User } from '@proton/shared/lib/interfaces';

import type { AesGcmCryptoKey } from '../crypto/types';
import { DbApi } from '../indexedDb/db';
import type { AttachmentMap } from '../redux/slices/core/attachments';
import { deserializeAttachment } from '../serialization';
import { type Attachment, type Message, isShallowAttachment } from '../types';

// Supported image MIME types
const IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
];

/**
 * Check if an attachment is an image based on its MIME type
 */
export function isImageAttachment(attachment: Attachment): boolean {
    return IMAGE_MIME_TYPES.some((type) => attachment.mimeType?.startsWith(type));
}

/**
 * Separate attachments into images and text/document files
 */
export function separateAttachmentsByType(attachments: Attachment[]): {
    imageAttachments: Attachment[];
    textAttachments: Attachment[];
} {
    const [imageAttachments, textAttachments] = partition(attachments, isImageAttachment);
    return { imageAttachments, textAttachments };
}

// Generates a multiline string for the LLM (the "context") that represents the aggregated contents of the attachments.
// Note: Images are excluded and should be sent as WireImage instead.
export function flattenAttachmentsForLlm(attachments: Attachment[]) {
    // Filter out images - they will be sent separately as WireImage objects
    const { textAttachments } = separateAttachmentsByType(attachments);

    const contextLines = textAttachments.flatMap((a) => {
        let content: string | undefined;
        if (a.markdown) {
            content = (a as Attachment)?.markdown?.trim() ?? '';
        } else if (a.processing) {
            console.warn(`Ignoring attachment that is still processing: ${a.id}.`);
            return [];
        } else if (a.error) {
            content = '[Contents not available: there was an error processing this file]';
            // Note: unsupported files are no longer added to attachments list
        }

        if (content) {
            return [
                `Filename: ${a.filename}`,
                'File contents:',
                `----- BEGIN FILE CONTENTS -----`,
                content,
                `----- END FILE CONTENTS -----`,
            ];
        }
    });

    if (contextLines.length > 0) {
        const fileCount = textAttachments.filter((a) => a.markdown || a.error).length;
        const fileCountText = fileCount === 1 ? '1 file' : `${fileCount} files`;

        return [
            `--- BEGIN UPLOADED FILES ---`,
            `The user has uploaded ${fileCountText} for analysis:`,
            '',
            ...contextLines,
            '--- END UPLOADED FILES ---',
        ].join('\n');
    }
    return '';
}

// Returns messages from the input, but additionally tries to
// fill their `context` field with the attachments from IndexedDB.
export async function addContextToMessages(
    messageChain: Message[],
    user: User | undefined,
    spaceDek: AesGcmCryptoKey | undefined
): Promise<Message[]> {
    let messagesWithContext = messageChain;
    if (!user || !spaceDek) {
        return messageChain;
    }
    const dbApi = new DbApi(user.ID);
    await dbApi.initialize();
    const addContextToMessage = async (m: Message) => {
        if (m.context !== undefined) return m;
        if (!m.attachments) return m;
        const attachmentIds = m.attachments.map((a) => a.id);
        const serializedAttachments = await dbApi.getAttachments(attachmentIds);
        const attachmentsPromises = serializedAttachments.map((sa) => deserializeAttachment(sa, spaceDek));
        const attachmentsUnfiltered = await Promise.all(attachmentsPromises);
        const attachments = attachmentsUnfiltered.filter((a) => a !== null);
        if (attachments.length === 0) return m;
        return {
            ...m,
            context: flattenAttachmentsForLlm(attachments),
        };
    };
    messagesWithContext = await Promise.all(messageChain.map(addContextToMessage));
    return messagesWithContext;
}

// Retrieves a full copy with all fields defined (especially `data`, `markdown`) from a partial
// attachment that may have these fields undefined. The full copy is retrieved from IndexedDB,
// which serves as the source of truth for attachments and contains all fields.
export async function fillOneAttachmentData(
    attachment: Attachment,
    user: User | undefined,
    spaceDek: AesGcmCryptoKey | undefined,
    dbApi?: DbApi
): Promise<Attachment> {
    if (!user || !spaceDek) {
        return attachment;
    }
    if (!dbApi) {
        dbApi = new DbApi(user.ID);
        await dbApi.initialize();
    }
    const serializedAttachment = await dbApi.getAttachmentById(attachment.id);
    if (!serializedAttachment) return attachment;
    const fullAttachment = await deserializeAttachment(serializedAttachment, spaceDek);
    return fullAttachment ?? attachment;
}

// Turns shallow attachments into filled attachments with all fields defined (especially `data`, `markdown`) .
// We try to retrieve the full copies from Redux first and then from IndexedDB.
//
// Note that in guest mode, IndexedDB isn't available, but Redux has all the attachment data (since the
// conversation was necessarily started from this session); conversely, in authenticated mode, Redux may
// not have the full attachment data (e.g. if loading a previous conversation) but IndexedDB should have it.
export async function fillAttachmentData(
    attachments: Attachment[],
    attachmentMap: AttachmentMap,
    user: User | undefined,
    spaceDek: AesGcmCryptoKey | undefined
): Promise<Attachment[]> {
    const isNotShallow = (a: Attachment) => !isShallowAttachment(a);
    // Try to fill some or all from Redux (attachmentMap comes from the Redux state)
    const attachments1 = attachments.map((a) => attachmentMap[a.id] ?? a);
    if (attachments1.every(isNotShallow)) {
        return attachments1;
    }
    // If some unfilled attachments remain, try to get them via IndexedDB. However, this only works if we're in
    // authenticated mode, otherwise we can't get a `dbApi` (handle to IndexedDB) due to the absence of user
    // credentials.
    const dbApi = user && spaceDek ? new DbApi(user.ID) : undefined;
    if (dbApi) {
        await dbApi.initialize();
    }
    const fillIfNotShallow = (a: Attachment) => (isNotShallow(a) ? a : fillOneAttachmentData(a, user, spaceDek, dbApi));
    return Promise.all(attachments.map(fillIfNotShallow));
}
