import type { ContextFilter } from '../llm';
import { countAttachmentToken } from '../llm/utils';
import { type AttachmentMap, newAttachmentId } from '../redux/slices/core/attachments';
import { SearchService } from '../services/search/searchService';
import { type Attachment, type AttachmentId, type Message, Role } from '../types';
import { getMimeTypeFromName } from '../util/filetypes';
import { formatPercent } from '../util/formatting';

const SMALL_FILE_SET_TOKEN_THRESHOLD = 30000; // ~30k tokens threshold to include all uploaded files in the first message
const MAX_SINGLE_FILE_TOKENS = 15000; // Max tokens for a single file when including all files (prevents one large file from dominating context)

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

type RAGRetrievalResult = {
    context: string;
    attachments: Attachment[];
};

/**
 * Calculate total token count for a list of attachments.
 */
function countTokens(attachments: Attachment[]): number {
    return attachments.map((attachment) => countAttachmentToken(attachment)).reduce((sum, tokens) => sum + tokens, 0);
}

/**
 * Get all uploaded files for a project space, excluding already-used and @mentioned files.
 */
function getUploadedProjectFiles(
    spaceId: string,
    allAttachments: AttachmentMap,
    alreadyRetrievedDocIds: Set<string>,
    referencedFileNames: Set<string>,
    maxSingleFileTokens: number = MAX_SINGLE_FILE_TOKENS
): { files: Attachment[]; hasOversizedFile: boolean } {
    // Only include files that:
    // 1. Belong to this project space
    // 2. Are uploaded files (not auto-retrieved from Drive)
    // 3. Haven't been used in the conversation yet
    // 4. Weren't explicitly @mentioned
    // 5. Have markdown content (successfully processed)
    const taggedFiles = Object.values(allAttachments)
        .filter((attachment) => {
            const { spaceId: attachmentSpaceId, autoRetrieved, id, filename, markdown } = attachment;
            return (
                attachmentSpaceId === spaceId &&
                !autoRetrieved &&
                !alreadyRetrievedDocIds.has(id) &&
                !referencedFileNames.has(filename.toLowerCase()) &&
                markdown
            );
        })
        .map((attachment) => {
            const tokens = countAttachmentToken(attachment);
            const isOversize = maxSingleFileTokens !== undefined && tokens > maxSingleFileTokens;
            return { attachment, tokens, isOversize };
        });

    const acceptedFiles = taggedFiles.filter((item) => !item.isOversize);

    const files = acceptedFiles.map((item) => item.attachment);
    const hasOversizedFile = taggedFiles.some((item) => item.isOversize);

    for (const {
        attachment: { filename },
        tokens,
    } of taggedFiles.filter((f) => f.isOversize)) {
        console.log(`[RAG] File ${filename} exceeds per-file limit: ${tokens} > ${maxSingleFileTokens} tokens`);
    }

    return { files, hasOversizedFile };
}

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
    isChunk?: boolean; // unsure (duplicated from Attachment?)
    chunkTitle?: string; // unsure
    parentDocumentId?: string; // unsure
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
        // This is an uploaded project file - mark as autoRetrieved for consistent handling with Drive files
        console.log(`[RAG] Using uploaded file attachment for ${doc.name} (ID: ${uploadedFileAttachment.id})`);
        return {
            ...uploadedFileAttachment,
            relevanceScore: normalizedScore,
            autoRetrieved: true, // Mark as auto-retrieved (same as Drive files)
            isUploadedProjectFile: true, // Also mark that this came from project files
            ...(isChunk && { isChunk, chunkTitle }),
        };
    }

    // Check if we already have an auto-retrieved attachment for this driveNodeId
    const existingAutoRetrieved = Object.values(allAttachments).find(
        (att) => att.autoRetrieved && att.driveNodeId === originalDocId
    );

    if (existingAutoRetrieved) {
        // Reuse the existing auto-retrieved attachment, update the relevance score
        console.log(
            `[RAG] Reusing existing auto-retrieved attachment for ${doc.name} (ID: ${existingAutoRetrieved.id})`
        );
        return {
            ...existingAutoRetrieved,
            relevanceScore: normalizedScore,
            ...(isChunk && { isChunk, chunkTitle }),
        };
    }

    // Create a new attachment for Drive files
    return {
        // AttachmentPub
        id: newAttachmentId(),
        spaceId,
        uploadedAt: new Date().toISOString(),
        mimeType: getMimeTypeFromName(doc.name),
        rawBytes: new TextEncoder().encode(doc.content).length,
        autoRetrieved: true,
        driveNodeId: originalDocId,
        relevanceScore: normalizedScore,
        ...(isChunk && { isChunk, chunkTitle }),
        // AttachmentPriv
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
    // Collect document IDs that have already been used in this conversation
    // This includes both driveNodeIds (for Drive files) and attachment IDs (for uploaded files)
    const alreadyRetrievedDocIds = new Set<string>();
    messageChain.forEach((msg) => {
        msg.attachments?.forEach((shallowAtt) => {
            const fullAtt = allAttachments[shallowAtt.id];
            if (fullAtt) {
                // For auto-retrieved files (Drive), check driveNodeId
                if (fullAtt.autoRetrieved && fullAtt.driveNodeId) {
                    alreadyRetrievedDocIds.add(fullAtt.driveNodeId);
                }
                // For uploaded files, the attachment ID IS the document ID
                alreadyRetrievedDocIds.add(fullAtt.id);
            }
        });
    });

    console.log(`[RAG] Already retrieved ${alreadyRetrievedDocIds.size} documents in this conversation`);
    return alreadyRetrievedDocIds;
}

function trySmallDataOptimization(
    spaceId: string,
    allAttachments: AttachmentMap,
    alreadyRetrievedDocIds: Set<string>,
    referencedFileNames: Set<string>
): RAGRetrievalResult | undefined {
    const { files: uploadedFiles, hasOversizedFile } = getUploadedProjectFiles(
        spaceId,
        allAttachments,
        alreadyRetrievedDocIds,
        referencedFileNames
    );
    const totalTokens = countTokens(uploadedFiles);

    console.log(
        `[RAG] First message - found ${uploadedFiles.length} uploaded files with ${totalTokens} total tokens${hasOversizedFile ? ' (some files excluded due to size)' : ''}`
    );

    // If total tokens are under threshold AND no files were excluded due to size, include all uploaded files directly
    // If we had to exclude oversized files, fall back to search-based retrieval to ensure fair selection
    if (uploadedFiles.length > 0 && totalTokens <= SMALL_FILE_SET_TOKEN_THRESHOLD && !hasOversizedFile) {
        console.log(
            `[RAG] Including all ${uploadedFiles.length} uploaded files (${totalTokens} tokens < ${SMALL_FILE_SET_TOKEN_THRESHOLD} threshold)`
        );

        // Mark files as auto-retrieved for consistent handling
        const attachments: Attachment[] = uploadedFiles.map((file) => ({
            ...file,
            autoRetrieved: true,
            isUploadedProjectFile: true,
            relevanceScore: 1.0, // All files are equally relevant when including everything
        }));

        // Format context for all files
        const formattedDocs = uploadedFiles.map((file) => ({
            id: file.id,
            name: file.filename,
            content: file.markdown || '',
            score: 1.0,
        }));

        return {
            context: SearchService.formatRAGContext(formattedDocs),
            attachments,
        };
    } else if (uploadedFiles.length > 0 || hasOversizedFile) {
        const reason = hasOversizedFile
            ? 'some files exceed per-file limit'
            : `total tokens (${totalTokens}) > ${SMALL_FILE_SET_TOKEN_THRESHOLD}`;
        console.log(`[RAG] Falling back to search-based retrieval: ${reason}`);
    }
}

function mostRelevantDocs(candidateDocs: CandidateDoc[]): CandidateDoc[] {
    // Smart percentile-based filtering
    const topScore = candidateDocs[0]?.score || 0;
    const scores = candidateDocs.map((d) => d.score);

    // Calculate the 75th percentile threshold (top 25% of documents)
    // This means we only include documents scoring in the top quarter
    const sortedScores = [...scores].sort((a, b) => b - a);
    const percentile75Index = Math.floor(sortedScores.length * 0.25);
    const percentile75Threshold = sortedScores[Math.min(percentile75Index, sortedScores.length - 1)] || 0;

    // Also require at least 40% of top score (absolute quality gate)
    const absoluteThreshold = topScore * RAG_MIN_RELATIVE_SCORE;

    // Use the higher of the two thresholds
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
    // Select documents above threshold, with gap detection
    const relevantDocs: typeof candidateDocs = [];

    for (let i = 0; i < candidateDocs.length && relevantDocs.length < RAG_MAX_DOCS; i++) {
        const doc = candidateDocs[i]!;

        // Must meet the effective threshold
        if (doc.score < effectiveThreshold) {
            console.log(
                `[RAG] Stopping at doc ${i}: score ${doc.score.toFixed(4)} below threshold ${effectiveThreshold.toFixed(4)}`
            );
            break;
        }

        // Check for score gap with previous doc (if not first) - detect relevance cliffs
        if (i > 0) {
            const prevScore = candidateDocs[i - 1]!.score;
            const dropRatio = doc.score / prevScore;
            if (dropRatio < 0.5) {
                // More than 50% drop from previous - this is a relevance cliff
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
 * Retrieve relevant documents from the project's indexed Drive folder for LLM context.
 *
 * Smart filtering:
 * - Gets top N documents by BM25 score
 * - Filters using percentile (top 25%) and absolute (40% of top) thresholds
 * - Creates Attachment objects for persistence and UI display
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
    // Early validation and setup
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

    // Small data optimization: include all files if under token threshold (first message only)
    const isFirstMessage = userMessageCount === 1;
    if (isFirstMessage) {
        const smallDataRagResult = trySmallDataOptimization(
            spaceId,
            allAttachments,
            alreadyRetrievedDocIds,
            referencedFileNames
        );
        if (smallDataRagResult) {
            return smallDataRagResult;
        }
    }

    // Search and filter candidate documents
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

        // Apply smart threshold filtering (percentile + gap detection)
        const relevantDocs = mostRelevantDocs(candidateDocs);
        const nRelevant = relevantDocs.length;
        if (nRelevant === 0) {
            console.log(`[RAG] No sufficiently relevant documents found for project ${spaceId}`);
            return undefined;
        }

        // Convert documents to attachments and return results
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
