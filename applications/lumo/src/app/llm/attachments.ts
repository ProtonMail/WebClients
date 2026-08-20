import partition from 'lodash/partition';

import type { User } from '@proton/shared/lib/interfaces';

import type { AesGcmCryptoKey } from '../crypto/types';
import { DbApi } from '../indexedDb/db';
import type { AttachmentMap } from '../redux/slices/core/attachments';
import { SearchService } from '../services/search/searchService';
import { deserializeAttachment } from '../serialization';
import { refreshAttachmentFromSearchIndex } from '../util/resolveProjectFiles';
import {
    type Attachment,
    type AttachmentId,
    type Message,
    type ShallowAttachment,
    isShallowAttachment,
} from '../types';
import { collapseCompactedChain } from './compaction/collapse';

// Maximum number of images sent to the backend per request. When a conversation
// contains more images than this, only the most recent ones are sent (older images
// are dropped). Kept in one place so the request-building logic (prepareTurns) and
// the UI warning use the exact same boundary.
export const MAX_IMAGES_PER_REQUEST = 10;

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

type ContextFilterLike = { messageId: string; excludedFiles: string[] };

/** Placeholder text substituted for image attachments excluded from the request. */
export const OMITTED_IMAGE_PLACEHOLDER = '[[Image omitted to save context size]]';

/** One placeholder line per omitted image, joined for inclusion in a turn's text content. */
export function formatOmittedImagePlaceholders(omittedImageCount: number): string {
    if (omittedImageCount <= 0) {
        return '';
    }
    return Array.from({ length: omittedImageCount }, () => OMITTED_IMAGE_PLACEHOLDER).join('\n');
}

/** Count image attachments on a message excluded from the request (context filters and/or image limit). */
export function countOmittedImageAttachments(
    attachments: ShallowAttachment[] | undefined,
    messageId: string,
    contextFilters: ContextFilterLike[],
    keptImageIds?: Set<string>
): number {
    if (!attachments?.length) {
        return 0;
    }
    const filter = contextFilters.find((f) => f.messageId === messageId);
    const excludedByFilter = filter?.excludedFiles.length ? new Set(filter.excludedFiles) : new Set<string>();

    return attachments.filter((att) => {
        if (!isImageAttachment(att as Attachment)) {
            return false;
        }
        if (excludedByFilter.has(att.filename)) {
            return true;
        }
        return keptImageIds !== undefined && !keptImageIds.has(att.id);
    }).length;
}

/**
 * Check if an attachment is an image based on its MIME type
 */
export function isImageAttachment(attachment: Attachment): boolean {
    return IMAGE_MIME_TYPES.some((type) => attachment.mimeType?.startsWith(type));
}

/**
 * Information about how the most-recent-images limit applies to a conversation.
 */
export type ImageLimitInfo = {
    /** Number of images included in the request (after sidebar exclusions). */
    totalImages: number;
    /** True when included images exceed the most-recent-N limit. */
    exceedsLimit: boolean;
    /** The IDs of the images that will actually be sent (the most recent ones). */
    keptImageIds: Set<AttachmentId>;
    /** The IDs of the images that are too old to be sent (everything before the boundary). */
    excludedImageIds: Set<AttachmentId>;
    /** The first (oldest) image that will be sent — i.e. the boundary "from this one onward". */
    boundaryImageId?: AttachmentId;
};

/**
 * Compute which images in a conversation will be sent to the backend, given the
 * "only send the most recent N images" rule. Images from compacted (summarized)
 * messages are dropped first to match the request, then images excluded via the
 * files sidebar; the limit applies only to images still included, then any
 * composer provisional attachments (not yet sent).
 */
export function getImageLimitInfo(
    messageChain: Message[],
    provisionalAttachments: Attachment[] = [],
    contextFilters: ContextFilterLike[] = [],
    maxImages: number = MAX_IMAGES_PER_REQUEST
): ImageLimitInfo {
    // Count images over the same post-compaction view that the request uses
    // (prepareTurns -> computeKeptImageIds). Summarized messages are dropped from the
    // chain before sending, so their images must not count toward the limit/warning.
    const { chain: effectiveChain } = collapseCompactedChain(messageChain);
    const orderedImageIds: AttachmentId[] = [];
    for (const message of effectiveChain) {
        const filter = contextFilters.find((f) => f.messageId === message.id);
        const excludedFilenames = filter?.excludedFiles ?? [];
        for (const attachment of message.attachments ?? []) {
            // Shallow attachments retain `mimeType`, so image detection works here.
            if (!isImageAttachment(attachment as Attachment)) {
                continue;
            }
            if (excludedFilenames.includes(attachment.filename)) {
                continue;
            }
            orderedImageIds.push(attachment.id);
        }
    }
    for (const attachment of provisionalAttachments) {
        if (isImageAttachment(attachment)) {
            orderedImageIds.push(attachment.id);
        }
    }

    const totalImages = orderedImageIds.length;
    const exceedsLimit = totalImages > maxImages;
    const splitIndex = exceedsLimit ? totalImages - maxImages : 0;
    const excludedIds = orderedImageIds.slice(0, splitIndex);
    const keptIds = orderedImageIds.slice(splitIndex);

    return {
        totalImages,
        exceedsLimit,
        keptImageIds: new Set(keptIds),
        excludedImageIds: new Set(excludedIds),
        boundaryImageId: exceedsLimit ? keptIds[0] : undefined,
    };
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
    spaceDek: AesGcmCryptoKey | undefined,
    spaceId?: string
): Promise<Attachment[]> {
    const isNotShallow = (a: Attachment) => !isShallowAttachment(a);
    const attachments1 = attachments.map((a) => attachmentMap[a.id] ?? a);
    if (attachments1.every(isNotShallow)) {
        return attachments1.map((a) => refreshIndexedAttachmentFromIndex(a, user, spaceId));
    }
    const dbApi = user && spaceDek ? new DbApi(user.ID) : undefined;
    if (dbApi) {
        await dbApi.initialize();
    }
    const fillIfNotShallow = async (a: Attachment): Promise<Attachment> => {
        if (isNotShallow(a)) {
            return refreshIndexedAttachmentFromIndex(a, user, spaceId);
        }
        const fromRedux = attachmentMap[a.id];
        if (fromRedux && isNotShallow(fromRedux)) {
            return refreshIndexedAttachmentFromIndex(fromRedux, user, spaceId);
        }
        const filled = await fillOneAttachmentData(a, user, spaceDek, dbApi);
        return refreshIndexedAttachmentFromIndex(filled, user, spaceId);
    };
    return Promise.all(attachments1.map(fillIfNotShallow));
}

function refreshIndexedAttachmentFromIndex(
    attachment: Attachment,
    user: User | undefined,
    spaceId?: string
): Attachment {
    if (!user?.ID || isImageAttachment(attachment)) {
        return attachment;
    }
    return refreshAttachmentFromSearchIndex(attachment, SearchService.get(user.ID), spaceId);
}
