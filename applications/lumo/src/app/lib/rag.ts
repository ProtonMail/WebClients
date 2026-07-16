import type { ContextFilter } from '../llm';
import { type AttachmentMap, newAttachmentId } from '../redux/slices/core/attachments';
import { SearchService } from '../services/search/searchService';
import { type Attachment, type AttachmentId, type Message, Role } from '../types';
import { getMimeTypeFromName } from '../util/filetypes';
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
    contextFilters: ContextFilter[] = []
): AttachmentId[] {
    const contextFiles: AttachmentId[] = [];
    const seenIds = new Set<AttachmentId>();

    for (const message of messageChain) {
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
        .filter((doc) => !alreadyRetrievedDocIds.has(doc.id))
        .filter((doc) => !referencedFileNames.has(doc.name.toLowerCase()));
    console.log(
        `[RAG] retrieveForRAG returned ${candidateDocs.length} candidates:`,
        candidateDocs.map((d) => ({ name: d.name, score: d.score }))
    );
    return { nRetrieved: retrievedDocs.length, candidateDocs };
}

type CandidateDoc = {
    id: string;
    name: string;
    content: string;
    score: number;
    isChunk?: boolean;
    chunkTitle?: string;
    parentDocumentId?: string;
};
const RAG_MAX_DOCS = 50;
const RAG_MIN_RELATIVE_SCORE = 0.4;

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

function collectAlreadyRetrievedDocIds(messageChain: Message[], allAttachments: AttachmentMap): Set<string> {
    const alreadyRetrievedDocIds = new Set<string>();
    messageChain.forEach((msg) => {
        msg.attachments?.forEach((shallowAtt) => {
            const fullAtt = allAttachments[shallowAtt.id];
            if (fullAtt) {
                if (fullAtt.autoRetrieved && fullAtt.driveNodeId) {
                    alreadyRetrievedDocIds.add(fullAtt.driveNodeId);
                }
                alreadyRetrievedDocIds.add(fullAtt.id);
            }
        });
    });

    console.log(`[RAG] Already retrieved ${alreadyRetrievedDocIds.size} documents in this conversation`);
    return alreadyRetrievedDocIds;
}

function mostRelevantDocs(candidateDocs: CandidateDoc[]): CandidateDoc[] {
    const topScore = candidateDocs[0]?.score || 0;
    const scores = candidateDocs.map((d) => d.score);

    const sortedScores = [...scores].sort((a, b) => b - a);
    const percentile75Index = Math.floor(sortedScores.length * 0.25);
    const percentile75Threshold = sortedScores[Math.min(percentile75Index, sortedScores.length - 1)] || 0;

    const absoluteThreshold = topScore * RAG_MIN_RELATIVE_SCORE;
    const effectiveThreshold = Math.max(percentile75Threshold, absoluteThreshold);

    console.log(
        [
            `[RAG] Thresholds:`,
            `top=${topScore.toFixed(4)},`,
            `p75=${percentile75Threshold.toFixed(4)},`,
            `min40%=${absoluteThreshold.toFixed(4)},`,
            `effective=${effectiveThreshold.toFixed(4)}`,
        ].join(' ')
    );

    const relevantDocs: typeof candidateDocs = [];

    for (let i = 0; i < candidateDocs.length && relevantDocs.length < RAG_MAX_DOCS; i++) {
        const doc = candidateDocs[i]!;

        if (doc.score < effectiveThreshold) {
            console.log(
                `[RAG] Stopping at doc ${i}: score ${doc.score.toFixed(4)} below threshold ${effectiveThreshold.toFixed(4)}`
            );
            break;
        }

        if (i > 0) {
            const prevScore = candidateDocs[i - 1]!.score;
            const dropRatio = doc.score / prevScore;
            if (dropRatio < 0.5) {
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
    referencedFileNames: Set<string> = new Set()
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
    const alreadyRetrievedDocIds = collectAlreadyRetrievedDocIds(messageChain, allAttachments);

    try {
        const { nRetrieved, candidateDocs } = await retrieveRelevantRagFiles(
            searchService,
            query,
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
                `  Top score: ${topScore.toFixed(4)}, Threshold: ${(topScore * RAG_MIN_RELATIVE_SCORE).toFixed(4)}`,
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
