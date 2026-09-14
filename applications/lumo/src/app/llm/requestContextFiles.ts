import { isGeneratedImageAttachment } from '../lib/imageAttachment';
import type { ContextFilter } from './contextFilter';
import { getImageLimitInfo, isImageAttachment } from './attachments';
import { getAttachmentDocumentKey } from '../util/resolveProjectFiles';
import { calculateAttachmentContextSize, countAttachmentToken } from './utils';
import type { Attachment, Message, ShallowAttachment } from '../types';

function filterMessageAttachments(
    attachments: ShallowAttachment[] | undefined,
    messageId: string,
    contextFilters: ContextFilter[]
): ShallowAttachment[] | undefined {
    if (!attachments || attachments.length === 0) {
        return attachments;
    }

    const filter = contextFilters.find((f) => f.messageId === messageId);
    if (!filter || filter.excludedFiles.length === 0) {
        return attachments;
    }

    return attachments.filter((att) => !filter.excludedFiles.includes(att.filename));
}

function hasSendableFileContent(attachment: Attachment): boolean {
    if (attachment.processing) {
        return false;
    }
    if (attachment.tokenCount !== undefined && attachment.tokenCount > 0) {
        return true;
    }
    if (attachment.markdown?.trim()) {
        return true;
    }
    return Boolean(attachment.error);
}

function shouldIncludeAttachment(
    attachment: Attachment,
    keptImageIds: Set<string>,
    sentDocumentKeys: Set<string>
): boolean {
    if (attachment.role === 'assistant' && !isGeneratedImageAttachment(attachment)) {
        return false;
    }

    if (isImageAttachment(attachment)) {
        if (!keptImageIds.has(attachment.id)) {
            return false;
        }
    } else if (!hasSendableFileContent(attachment)) {
        return false;
    }

    const documentKey = getAttachmentDocumentKey(attachment);
    if (sentDocumentKeys.has(documentKey)) {
        return false;
    }

    sentDocumentKeys.add(documentKey);
    return true;
}

/**
 * Files the user chose outrank files RAG guessed at; within each group, stronger
 * relevance wins, then recency. Shedding starts from the bottom of this order.
 */
function compareSheddingPriority(a: RankedAttachment, b: RankedAttachment): number {
    const aManual = a.attachment.autoRetrieved ? 0 : 1;
    const bManual = b.attachment.autoRetrieved ? 0 : 1;
    if (aManual !== bManual) {
        return bManual - aManual;
    }

    const scoreDelta = (b.attachment.relevanceScore ?? 0) - (a.attachment.relevanceScore ?? 0);
    if (scoreDelta !== 0) {
        return scoreDelta;
    }

    return b.order - a.order;
}

type RankedAttachment = {
    attachment: Attachment;
    order: number;
};

export type RequestContextFileSelection = {
    /** Files that will be expanded into the next request, in chain order. */
    files: Attachment[];
    /** Ids of the non-image files above; `prepareTurns` sends exactly these. */
    sentDocumentIds: Set<string>;
    /** Files left out only because the file budget ran out, in the order they were shed. */
    droppedForBudget: Attachment[];
};

/**
 * Pick the files for the next request and drop the weakest ones once they no longer fit
 * `fileTokenBudget`. Summarizing history cannot shrink file content, so without this a
 * single question carrying many auto-retrieved documents overflows the window no matter
 * how many times the conversation is compacted.
 */
export function resolveRequestContextFiles(
    effectiveChain: Message[],
    contextFilters: ContextFilter[],
    allAttachments: Record<string, Attachment>,
    extraAttachments: Attachment[] = [],
    fileTokenBudget = Number.POSITIVE_INFINITY
): RequestContextFileSelection {
    const collected = collectRequestContextFiles(effectiveChain, contextFilters, allAttachments, extraAttachments);

    const documents: RankedAttachment[] = [];
    const images: Attachment[] = [];
    collected.forEach((attachment, order) => {
        if (isImageAttachment(attachment)) {
            images.push(attachment);
        } else {
            documents.push({ attachment, order });
        }
    });

    // Images are already limited by MAX_IMAGES_PER_REQUEST, so only documents are shed.
    const imageTokens = calculateAttachmentContextSize(images);
    const documentBudget = Math.max(0, fileTokenBudget - imageTokens);

    const keptDocumentIds = new Set<string>();
    const droppedForBudget: Attachment[] = [];
    let documentTokens = 0;

    for (const ranked of [...documents].sort(compareSheddingPriority)) {
        const tokens = countAttachmentToken(ranked.attachment);
        if (keptDocumentIds.size > 0 && documentTokens + tokens > documentBudget) {
            droppedForBudget.push(ranked.attachment);
            continue;
        }
        documentTokens += tokens;
        keptDocumentIds.add(ranked.attachment.id);
    }

    return {
        files: collected.filter((attachment) => isImageAttachment(attachment) || keptDocumentIds.has(attachment.id)),
        sentDocumentIds: keptDocumentIds,
        droppedForBudget,
    };
}

/**
 * Collect attachments that would be expanded into the next request, mirroring
 * `prepareTurns` document deduplication, context filters, image limits, and
 * non-sendable attachment skipping.
 */
export function collectRequestContextFiles(
    effectiveChain: Message[],
    contextFilters: ContextFilter[],
    allAttachments: Record<string, Attachment>,
    extraAttachments: Attachment[] = []
): Attachment[] {
    const { keptImageIds } = getImageLimitInfo(effectiveChain, [], contextFilters);
    const sentDocumentKeys = new Set<string>();
    const activeFiles: Attachment[] = [];

    const addAttachment = (attachment: Attachment) => {
        if (!attachment.filename) {
            return;
        }
        if (!shouldIncludeAttachment(attachment, keptImageIds, sentDocumentKeys)) {
            return;
        }
        activeFiles.push(attachment);
    };

    for (const message of effectiveChain) {
        const filtered = filterMessageAttachments(message.attachments, message.id, contextFilters) ?? [];
        for (const shallow of filtered) {
            const full = allAttachments[shallow.id] ?? (shallow as Attachment);
            addAttachment(full);
        }
    }

    for (const attachment of extraAttachments) {
        addAttachment(attachment);
    }

    return activeFiles;
}
