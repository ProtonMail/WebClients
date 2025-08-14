import type { User } from '@proton/shared/lib/interfaces';

import type { AesGcmCryptoKey } from '../crypto/types';
import { DbApi } from '../indexedDb/db';
import { deserializeAttachment } from '../serialization';
import type { Attachment, Message } from '../types';

// Generates a multiline string for the LLM (the "context") that represents the aggregated contents of the attachments.
export function flattenAttachmentsForLlm(attachments: Attachment[]) {
    const contextLines = attachments.flatMap((a) => {
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
        const fileCount = attachments.filter((a) => a.markdown || a.error).length;
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
    }
    const serializedAttachment = await dbApi.getAttachmentById(attachment.id);
    if (!serializedAttachment) return attachment;
    const fullAttachment = await deserializeAttachment(serializedAttachment, spaceDek);
    return fullAttachment ?? attachment;
}

// Retrieves full copies with all fields defined (especially `data`, `markdown`) from partial
// attachments that may have these fields undefined. The full copies are retrieved from IndexedDB,
// which serves as the source of truth for attachments and contains all fields.
export async function fillAttachmentData(
    attachments: Attachment[],
    user: User | undefined,
    spaceDek: AesGcmCryptoKey | undefined
): Promise<Attachment[]> {
    if (!user || !spaceDek) {
        return attachments;
    }
    const dbApi = new DbApi(user.ID);
    return Promise.all(attachments.map((a) => fillOneAttachmentData(a, user, spaceDek, dbApi)));
}
