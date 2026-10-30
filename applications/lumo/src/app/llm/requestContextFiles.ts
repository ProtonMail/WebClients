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

/** Smallest excerpt of a manually attached file worth sending; below this it is dropped. */
const MIN_EXCERPT_TOKENS = 2_000;

export type RequestContextFileSelection = {
    /**
     * Files that will be expanded into the next request, in chain order. Excerpted files
     * appear with `tokenCount` set to their excerpt size.
     */
    files: Attachment[];
    /** Ids of the non-image files above; `prepareTurns` sends exactly these. */
    sentDocumentIds: Set<string>;
    /** Files left out only because the file budget ran out, in the order they were shed. */
    droppedForBudget: Attachment[];
    /** Manually attached files sent as an excerpt because they exceed the budget: id → excerpt tokens. */
    excerptedForBudget: Map<string, number>;
    /**
     * Files sent as a card pointing at the lookup tools, and why: `size` when the file is over
     * the inline limit, `budget` when it no longer fits the room left.
     */
    cardedFiles: Map<string, 'size' | 'budget'>;
};

/** Set when the lookup tools are registered: large files then travel as cards, read on demand. */
export type FileCardPolicy = {
    /** Larger documents are never sent in full, so one file cannot crowd out the rest. */
    maxInlineTokens: number;
    cardTokens: (attachment: Attachment) => number;
};

/**
 * Pick the files for the next request and drop the weakest ones once they no longer fit
 * `fileTokenBudget`. Summarizing history cannot shrink file content, so without this a
 * single question carrying many auto-retrieved documents overflows the window no matter
 * how many times the conversation is compacted.
 *
 * Nothing is sent over budget: a file the user attached that does not fit is excerpted to
 * the room left, and an auto-retrieved one is dropped. With `fileCards`, files over the inline
 * limit or the room left are sent as cards instead.
 */
export function resolveRequestContextFiles(
    effectiveChain: Message[],
    contextFilters: ContextFilter[],
    allAttachments: Record<string, Attachment>,
    extraAttachments: Attachment[] = [],
    fileTokenBudget = Number.POSITIVE_INFINITY,
    fileCards?: FileCardPolicy
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
    const excerptedForBudget = new Map<string, number>();
    const cardedFiles = new Map<string, 'size' | 'budget'>();
    const sentTokens = new Map<string, number>();
    let documentTokens = 0;

    for (const ranked of [...documents].sort(compareSheddingPriority)) {
        const tokens = countAttachmentToken(ranked.attachment);
        const remaining = documentBudget - documentTokens;
        const overInlineLimit = fileCards !== undefined && tokens > fileCards.maxInlineTokens;
        if (fileCards && (overInlineLimit || tokens > remaining)) {
            const cardTokens = fileCards.cardTokens(ranked.attachment);
            if (cardTokens <= remaining) {
                documentTokens += cardTokens;
                keptDocumentIds.add(ranked.attachment.id);
                cardedFiles.set(ranked.attachment.id, overInlineLimit ? 'size' : 'budget');
                sentTokens.set(ranked.attachment.id, cardTokens);
            } else {
                droppedForBudget.push(ranked.attachment);
            }
            continue;
        }
        if (tokens <= remaining) {
            documentTokens += tokens;
            keptDocumentIds.add(ranked.attachment.id);
            continue;
        }
        if (!ranked.attachment.autoRetrieved && remaining >= MIN_EXCERPT_TOKENS) {
            documentTokens += remaining;
            keptDocumentIds.add(ranked.attachment.id);
            excerptedForBudget.set(ranked.attachment.id, remaining);
            sentTokens.set(ranked.attachment.id, remaining);
            continue;
        }
        droppedForBudget.push(ranked.attachment);
    }

    return {
        files: collected
            .filter((attachment) => isImageAttachment(attachment) || keptDocumentIds.has(attachment.id))
            .map((attachment) => {
                const tokens = sentTokens.get(attachment.id);
                return tokens === undefined ? attachment : { ...attachment, tokenCount: tokens };
            }),
        sentDocumentIds: keptDocumentIds,
        droppedForBudget,
        excerptedForBudget,
        cardedFiles,
    };
}

/**
 * Collect attachments that would be expanded into the next request, mirroring
 * `prepareTurns` document deduplication, context filters, image limits, and
 * non-sendable attachment skipping.
 */
function collectRequestContextFiles(
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
