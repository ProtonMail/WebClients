import type { ContextFilter } from '../llm';
import { collapseCompactedChain, getSummarizedMessageIds } from '../llm/compaction';
import { type AttachmentMap, newAttachmentId } from '../redux/slices/core/attachments';
import { SearchService } from '../services/search/searchService';
import { type Attachment, type AttachmentId, type Message, type MessageId, Role, type ShallowAttachment } from '../types';
import { getMimeTypeFromName, isFileTypeSupported } from '../util/filetypes';
import { formatPercent } from '../util/formatting';

/**
 * Collect all attachment IDs that will be in the LLM context for this generation.
 *
 * This includes attachments from ALL messages in the chain (unless filtered) because
 * when we call prepareTurns(), the LLM sees the entire conversation history with each
 * message's file content embedded. For example:
 * - Message 1 with file A → Turn 1 includes A's content
 * - Response 1
 * - Message 2 with file B → Turn 2 includes B's content
 * - Response 2 (being generated) → Sees BOTH A and B
 *
 * This function returns the IDs to store in assistantMessage.contextFiles for
 * historical tracking and UI display purposes.
 */
export function collectContextAttachmentIds(
    messageChain: Message[],
    contextFilters: ContextFilter[] = [],
    messageMap?: Record<MessageId, Message>
): AttachmentId[] {
    const { chain: effectiveChain } = collapseCompactedChain(messageChain, messageMap);
    const summarizedIds = getSummarizedMessageIds(messageChain, messageMap);
    const contextFiles: AttachmentId[] = [];
    const seenIds = new Set<AttachmentId>();

    for (const message of effectiveChain) {
        if (summarizedIds.has(message.id)) {
            continue;
        }
        if (!message.attachments) continue;

        // Check if this message has any context filters
        const filter = contextFilters.find((f) => f.messageId === message.id);

        for (const attachment of message.attachments) {
            // Skip if we've already seen this attachment ID
            if (seenIds.has(attachment.id)) continue;

            // If there's no filter, or the file is not in the excluded list, include it
            if (!filter || !filter.excludedFiles.includes(attachment.filename)) {
                contextFiles.push(attachment.id);
                seenIds.add(attachment.id);
            }
        }
    }

    return contextFiles;
}

export function planRagAttachmentStorage(
    attachments: Attachment[],
    existingAttachments: AttachmentMap
): { toUpsert: Attachment[]; toPushIds: AttachmentId[] } {
    const toUpsert: Attachment[] = [];
    const toPushIds: AttachmentId[] = [];

    for (const attachment of attachments) {
        if (existingAttachments[attachment.id]) {
            continue;
        }
        toUpsert.push(attachment);
        if (!attachment.autoRetrieved) {
            toPushIds.push(attachment.id);
        }
    }

    return { toUpsert, toPushIds };
}

type RAGRetrievalResult = {
    context: string;
    attachments: Attachment[];
};

/**
 * Search for RAG documents and filter out zero-score, already-retrieved, and @mentioned files.
 */
async function retrieveRelevantRagFiles(
    searchService: SearchService,
    query: string,
    spaceId: string,
    alreadyRetrievedDocIds: Set<string>,
    referencedFileNames: Set<string>
) {
    console.log(`[RAG] Calling retrieveForRAG with query="${query.slice(0, 100)}", spaceId=${spaceId}`);
    const retrievedDocs = await searchService.retrieveForRAG(query, spaceId);
    const candidateDocs = retrievedDocs
        .filter((doc) => doc.score > 0)
        .filter((doc) => isFileTypeSupported(doc.name))
        .filter((doc) => !alreadyRetrievedDocIds.has(doc.id))
        .filter((doc) => !referencedFileNames.has(doc.name.toLowerCase()));
    console.log(
        `[RAG] retrieveForRAG returned ${candidateDocs.length} candidates:`,
        candidateDocs.map((d) => ({ name: d.name, score: d.score, coverage: d.coverage }))
    );
    return { nRetrieved: retrievedDocs.length, candidateDocs };
}

type CandidateDoc = {
    id: string;
    name: string;
    content: string;
    score: number;
    /** IDF-weighted share of the query this document matched (0–1). See `BM25Index`. */
    coverage?: number;
    isChunk?: boolean;
    chunkTitle?: string;
    parentDocumentId?: string;
};

/**
 * Hard ceiling on auto-retrieved documents per turn. Files are the dominant cost in a
 * request, and beyond a handful the extra documents are noise the model has to wade
 * through rather than useful context.
 */
const RAG_MAX_DOCS = 10;

/** Keep documents scoring within this fraction of the best hit. */
const RAG_MIN_RELATIVE_SCORE = 0.5;

/**
 * Minimum share of the query a document must address. This is the precision lever:
 * without it, a long file mentioning a single query word ranks alongside one that
 * answers the whole question.
 */
const RAG_MIN_QUERY_COVERAGE = 0.3;

/** A step down this steep between consecutive hits marks the end of the relevant run. */
const RAG_SCORE_DROP_RATIO = 0.6;

function computeNormalizedScore(topScore: number, doc: CandidateDoc) {
    return topScore > 0 ? doc.score / topScore : 0;
}

/* Create Attachment objects from retrieved documents
 * - For uploaded files: reuse existing attachment (document ID = attachment ID)
 * - For Drive files: check driveNodeId, or create new attachment
 */
function ragDocToAttachment(doc: CandidateDoc, topScore: number, spaceId: string, allAttachments: AttachmentMap) {
    const normalizedScore = computeNormalizedScore(topScore, doc);
    const { isChunk, chunkTitle, parentDocumentId } = doc;
    const originalDocId = parentDocumentId || doc.id;

    // Check if this is an uploaded file (document ID matches an existing attachment ID)
    const uploadedFileAttachment = allAttachments[originalDocId];
    if (uploadedFileAttachment && !uploadedFileAttachment.autoRetrieved) {
        console.log(`[RAG] Using uploaded file attachment for ${doc.name} (ID: ${uploadedFileAttachment.id})`);
        return {
            ...uploadedFileAttachment,
            markdown: doc.content,
            rawBytes: new TextEncoder().encode(doc.content).length,
            relevanceScore: normalizedScore,
            autoRetrieved: true,
            ...(isChunk && { isChunk, chunkTitle }),
        };
    }

    // Check if we already have an auto-retrieved attachment for this driveNodeId
    const existingAutoRetrieved = Object.values(allAttachments).find(
        (att) => att.autoRetrieved && att.driveNodeId === originalDocId
    );

    if (existingAutoRetrieved) {
        console.log(
            `[RAG] Reusing existing auto-retrieved attachment for ${doc.name} (ID: ${existingAutoRetrieved.id})`
        );
        return {
            ...existingAutoRetrieved,
            markdown: doc.content,
            rawBytes: new TextEncoder().encode(doc.content).length,
            relevanceScore: normalizedScore,
            ...(isChunk && { isChunk, chunkTitle }),
        };
    }

    // Create a new attachment for Drive files
    return {
        id: newAttachmentId(),
        spaceId,
        uploadedAt: new Date().toISOString(),
        mimeType: getMimeTypeFromName(doc.name),
        rawBytes: new TextEncoder().encode(doc.content).length,
        autoRetrieved: true,
        driveNodeId: originalDocId,
        relevanceScore: normalizedScore,
        ...(isChunk && { isChunk, chunkTitle }),
        filename: doc.name,
        markdown: doc.content,
    };
}

function ragDocsToAttachments(
    relevantDocs: CandidateDoc[],
    topScore: number,
    spaceId: string,
    allAttachments: AttachmentMap
) {
    return relevantDocs.map((doc) => ragDocToAttachment(doc, topScore, spaceId, allAttachments));
}

/** Normalize a user query so minor punctuation edits do not change RAG retrieval. */
export function normalizeRagQuery(query: string): string {
    return query.trim().replace(/\s+/g, ' ').replace(/[^\w\s]+$/g, '').trim();
}

function trackRetrievedDocumentId(
    alreadyRetrievedDocIds: Set<string>,
    shallowAtt: ShallowAttachment,
    fullAtt?: Attachment
): void {
    alreadyRetrievedDocIds.add(shallowAtt.id);

    const driveNodeId = fullAtt?.driveNodeId ?? shallowAtt.driveNodeId;
    if (driveNodeId) {
        alreadyRetrievedDocIds.add(driveNodeId);
    }
}

function collectAlreadyRetrievedDocIds(
    messageChain: Message[],
    allAttachments: AttachmentMap,
    allConversationMessages?: Message[]
): Set<string> {
    const alreadyRetrievedDocIds = new Set<string>();
    const messages = allConversationMessages ?? messageChain;

    messages.forEach((msg) => {
        msg.attachments?.forEach((shallowAtt) => {
            trackRetrievedDocumentId(alreadyRetrievedDocIds, shallowAtt, allAttachments[shallowAtt.id]);
        });
    });

    console.log(`[RAG] Already retrieved ${alreadyRetrievedDocIds.size} documents in this conversation`);
    return alreadyRetrievedDocIds;
}

/**
 * Narrow ranked candidates down to the documents worth sending.
 *
 * Thresholds are deliberately independent of how many candidates came back. An earlier
 * percentile cutoff kept the top quarter of the pool, so a large project returned a
 * large pile of weak matches — the more files indexed, the more noise was retrieved.
 * These rules instead judge each document on its own: how much of the query it covers,
 * how it compares to the best hit, and whether the ranking has already fallen off.
 */
function mostRelevantDocs(candidateDocs: CandidateDoc[]): CandidateDoc[] {
    const covering = candidateDocs.filter((doc) => (doc.coverage ?? 1) >= RAG_MIN_QUERY_COVERAGE);

    if (covering.length < candidateDocs.length) {
        console.log(
            `[RAG] Dropped ${candidateDocs.length - covering.length} candidates below ${formatPercent(RAG_MIN_QUERY_COVERAGE)} query coverage`
        );
    }

    const topScore = covering[0]?.score || 0;
    const scoreThreshold = topScore * RAG_MIN_RELATIVE_SCORE;

    console.log(
        `[RAG] Thresholds: top=${topScore.toFixed(4)}, min=${scoreThreshold.toFixed(4)}, coverage>=${formatPercent(RAG_MIN_QUERY_COVERAGE)}`
    );

    const relevantDocs: CandidateDoc[] = [];

    for (let i = 0; i < covering.length && relevantDocs.length < RAG_MAX_DOCS; i++) {
        const doc = covering[i]!;

        if (doc.score < scoreThreshold) {
            console.log(
                `[RAG] Stopping at doc ${i}: score ${doc.score.toFixed(4)} below threshold ${scoreThreshold.toFixed(4)}`
            );
            break;
        }

        if (i > 0) {
            const dropRatio = doc.score / covering[i - 1]!.score;
            if (dropRatio < RAG_SCORE_DROP_RATIO) {
                console.log(`[RAG] Stopping at doc ${i}: score gap detected (${formatPercent(dropRatio)} of previous)`);
                break;
            }
        }

        relevantDocs.push(doc);
    }
    return relevantDocs;
}

const debugAttachment = (a: Attachment) => {
    const { isChunk, chunkTitle, filename, relevanceScore } = a;
    const chunkInfo = isChunk ? ` [CHUNK: ${chunkTitle || 'untitled'}]` : '';
    return `${filename}${chunkInfo} (${formatPercent(relevanceScore)})`;
};

function debugAttachmentsAsList(attachments: Attachment[]) {
    return attachments
        .map(debugAttachment)
        .map((s) => `    - ${s}`)
        .join('\n');
}

/**
 * Retrieve relevant documents from the project's search index for LLM context.
 *
 * All file retrieval (local uploads and Drive) goes through the search index.
 * Large documents are returned as their best-matching chunk.
 */
export async function retrieveDocumentContextForProject(
    query: string,
    spaceId: string,
    userId: string | undefined,
    isProject: boolean,
    messageChain: Message[] = [],
    allAttachments: AttachmentMap = {},
    referencedFileNames: Set<string> = new Set(),
    allConversationMessages?: Message[]
): Promise<RAGRetrievalResult | undefined> {
    const userMessageCount = messageChain.filter((m) => m.role === Role.User).length;
    console.log(
        [
            `[RAG] retrieveDocumentContextForProject called:`,
            `- isProject=${isProject}`,
            `- spaceId=${spaceId}`,
            `- userId=${userId ? 'present' : 'missing'}`,
            `- userMessages=${userMessageCount}`,
        ].join('\n')
    );
    if (!isProject || !userId) {
        console.log(`[RAG] Skipping: isProject=${isProject}, userId=${!!userId}`);
        return undefined;
    }
    const searchService = SearchService.get(userId);
    const normalizedQuery = normalizeRagQuery(query);
    const alreadyRetrievedDocIds = collectAlreadyRetrievedDocIds(
        messageChain,
        allAttachments,
        allConversationMessages
    );

    try {
        const { nRetrieved, candidateDocs } = await retrieveRelevantRagFiles(
            searchService,
            normalizedQuery,
            spaceId,
            alreadyRetrievedDocIds,
            referencedFileNames
        );

        const nCandidates = candidateDocs.length;
        if (nCandidates === 0) {
            console.log(`[RAG] No relevant documents found for project ${spaceId}`);
            return undefined;
        }

        const topScore = candidateDocs[0]?.score || 0;
        const relevantDocs = mostRelevantDocs(candidateDocs);
        const nRelevant = relevantDocs.length;
        if (nRelevant === 0) {
            console.log(`[RAG] No sufficiently relevant documents found for project ${spaceId}`);
            return undefined;
        }

        const attachments: Attachment[] = ragDocsToAttachments(relevantDocs, topScore, spaceId, allAttachments);
        console.log(
            [
                `[RAG] Retrieved ${attachments.length} relevant documents for project ${spaceId}:`,
                `  Retrieved: ${nRetrieved}, candidates: ${nCandidates}, relevant: ${nRelevant}`,
                `  Top score: ${topScore.toFixed(4)}, threshold: ${(topScore * RAG_MIN_RELATIVE_SCORE).toFixed(4)}, max docs: ${RAG_MAX_DOCS}`,
                `  Selected docs: \n${debugAttachmentsAsList(attachments)}`,
            ].join('\n')
        );
        return {
            context: SearchService.formatRAGContext(relevantDocs),
            attachments,
        };
    } catch (error) {
        console.warn('[RAG] Failed to retrieve document context:', error);
        return undefined;
    }
}
