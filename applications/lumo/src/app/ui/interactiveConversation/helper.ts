import { c } from 'ttag';

import type { Api } from '@proton/shared/lib/interfaces';

import { generateSpaceKeyBase64 } from '../../crypto';
import type { PersonalizationSettings } from '../../redux/slices/personalization';
import { PERSONALITY_OPTIONS } from '../../redux/slices/personalization';
import { sendMessageWithRedux } from '../../lib/lumo-api-client/integrations/redux';
import type { ContextFilter } from '../../llm';
import { ENABLE_U2L_ENCRYPTION, getFilteredTurns } from '../../llm';
import { SearchService } from '../../services/search/searchService';
import { flattenAttachmentsForLlm } from '../../llm/attachments';
import { newAttachmentId, pushAttachmentRequest, upsertAttachment } from '../../redux/slices/core/attachments';
import { resolveFileReferences } from '../../util/fileReferences';
import {
    addConversation,
    newConversationId,
    pushConversationRequest,
    updateConversationStatus,
} from '../../redux/slices/core/conversations';
import {
    addMessage,
    createDatePair,
    finishMessage,
    newMessageId,
    pushMessageRequest,
} from '../../redux/slices/core/messages';
import { addSpace, newSpaceId, pushSpaceRequest } from '../../redux/slices/core/spaces';
import type { LumoDispatch as AppDispatch } from '../../redux/store';
import { createGenerationError, getErrorTypeFromMessage } from '../../services/errors/errorHandling';
import type { AttachmentId, MessageId, ShallowAttachment } from '../../types';
import {
    type Attachment,
    type ConversationId,
    ConversationStatus,
    type Message,
    Role,
    type SpaceId,
    getAttachmentPriv,
    getAttachmentPub,
} from '../../types';
import type { GenerationToFrontendMessage } from '../../types-api';
import { calculateSingleAttachmentContextSize } from '../../llm/utils';

const SMALL_FILE_SET_TOKEN_THRESHOLD = 45000; // ~45k tokens threshold to include all uploaded files in the first message

function getContextFilesForMessage(
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

const createLumoErrorHandler = () => (message: GenerationToFrontendMessage, cId: string) =>
    createGenerationError(getErrorTypeFromMessage(message.type), cId, message);

interface RAGRetrievalResult {
    context: string;
    attachments: Attachment[];
}

/**
 * Get all uploaded files for a project space and calculate their total token count.
 * This is used to determine if we should include all files in the first message
 * instead of relying on search-based retrieval.
 * 
 * @param spaceId - The project space ID
 * @param allAttachments - All attachments from Redux state
 * @param alreadyRetrievedDocIds - Set of document IDs already used in conversation
 * @param referencedFileNames - Set of @mentioned file names to exclude
 * @returns Object with uploaded files and their total token count
 */
function getUploadedProjectFiles(
    spaceId: string,
    allAttachments: Record<string, Attachment>,
    alreadyRetrievedDocIds: Set<string>,
    referencedFileNames: Set<string>
): { files: Attachment[], totalTokens: number } {
    const uploadedFiles: Attachment[] = [];
    let totalTokens = 0;

    for (const attachment of Object.values(allAttachments)) {
        // Only include files that:
        // 1. Belong to this project space
        // 2. Are uploaded files (not auto-retrieved from Drive)
        // 3. Haven't been used in the conversation yet
        // 4. Weren't explicitly @mentioned
        // 5. Have markdown content (successfully processed)
        if (
            attachment.spaceId === spaceId &&
            !attachment.autoRetrieved &&
            !alreadyRetrievedDocIds.has(attachment.id) &&
            !referencedFileNames.has(attachment.filename.toLowerCase()) &&
            attachment.markdown
        ) {
            uploadedFiles.push(attachment);
            totalTokens += calculateSingleAttachmentContextSize(attachment);
        }
    }

    return { files: uploadedFiles, totalTokens };
}

/**
 * Retrieve relevant documents from the project's indexed Drive folder and format them for the LLM context.
 * This is the RAG (Retrieval Augmented Generation) function for automatic document injection.
 *
 * Documents are only retrieved for the FIRST user message in a conversation.
 * Follow-up questions already have the document context from the first turn in the conversation history,
 * so re-injecting would cause duplication.
 *
 * Smart filtering:
 * - Gets top N documents by BM25 score
 * - Filters out documents with < 10% relevance relative to the top document
 * - Creates real Attachment objects for persistence and UI display
 *
 * @param query - The user's prompt/question
 * @param spaceId - The project spaceId
 * @param userId - The user's ID for accessing the search service
 * @param isProject - Whether this is a project conversation
 * @param messageChain - The message chain including the current message
 * @returns RAG result with context string and attachments, or undefined if not applicable
 */
async function retrieveDocumentContextForProject(
    query: string,
    spaceId: string,
    userId: string | undefined,
    isProject: boolean,
    messageChain: Message[] = [],
    allAttachments: Record<string, Attachment> = {},
    referencedFileNames: Set<string> = new Set()
): Promise<RAGRetrievalResult | undefined> {
    const userMessageCount = messageChain.filter(m => m.role === Role.User).length;

    console.log(`[RAG] retrieveDocumentContextForProject called: isProject=${isProject}, spaceId=${spaceId}, userId=${userId ? 'present' : 'missing'}, userMessages=${userMessageCount}`);

    // Only retrieve documents for project conversations
    if (!isProject || !userId) {
        console.log(`[RAG] Skipping: isProject=${isProject}, userId=${!!userId}`);
        return undefined;
    }

    // Collect document IDs that have already been used in this conversation
    // This includes both driveNodeIds (for Drive files) and attachment IDs (for uploaded files)
    const alreadyRetrievedDocIds = new Set<string>();
    messageChain.forEach(msg => {
        msg.attachments?.forEach(shallowAtt => {
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

    // For the first message in a project, check if we should include all uploaded files
    // instead of relying on search. This ensures better responses for small file sets.
    const isFirstMessage = userMessageCount === 1;

    if (isFirstMessage) {
        const { files: uploadedFiles, totalTokens } = getUploadedProjectFiles(
            spaceId,
            allAttachments,
            alreadyRetrievedDocIds,
            referencedFileNames
        );

        console.log(`[RAG] First message - found ${uploadedFiles.length} uploaded files with ${totalTokens} total tokens`);

        // If total tokens are under threshold, include all uploaded files directly
        if (uploadedFiles.length > 0 && totalTokens <= SMALL_FILE_SET_TOKEN_THRESHOLD) {
            console.log(`[RAG] Including all ${uploadedFiles.length} uploaded files (${totalTokens} tokens < ${SMALL_FILE_SET_TOKEN_THRESHOLD} threshold)`);
            
            // Mark files as auto-retrieved for consistent handling
            const attachments: Attachment[] = uploadedFiles.map(file => ({
                ...file,
                autoRetrieved: true,
                isUploadedProjectFile: true,
                relevanceScore: 1.0, // All files are equally relevant when including everything
            }));

            // Format context for all files
            const searchService = SearchService.get(userId);
            const formattedDocs = uploadedFiles.map(file => ({
                id: file.id,
                name: file.filename,
                content: file.markdown || '',
                score: 1.0,
            }));

            return {
                context: searchService.formatRAGContext(formattedDocs),
                attachments,
            };
        } else if (uploadedFiles.length > 0) {
            console.log(`[RAG] Uploaded files exceed threshold (${totalTokens} > ${SMALL_FILE_SET_TOKEN_THRESHOLD}), falling back to search-based retrieval`);
        }
    }

    try {
        const searchService = SearchService.get(userId);
        // Get candidates for intelligent filtering (use higher limit to allow more relevant docs through)
        const candidateDocs = await searchService.retrieveForRAG(query, spaceId, 50, 0);

        // Filter out zero-score documents, already-retrieved documents, and @mentioned files
        const nonZeroDocs = candidateDocs.filter(doc => {
            if (doc.score <= 0) return false;
            if (alreadyRetrievedDocIds.has(doc.id)) return false;
            // Exclude files that were explicitly @mentioned (their content is already in the message)
            if (referencedFileNames.has(doc.name.toLowerCase())) {
                console.log(`[RAG] Excluding @mentioned file from RAG: ${doc.name}`);
                return false;
            }
            return true;
        });

        if (nonZeroDocs.length === 0) {
            console.log(`[RAG] No relevant documents found for project ${spaceId}`);
            return undefined;
        }

        // Smart percentile-based filtering
        const topScore = nonZeroDocs[0]?.score || 0;
        const scores = nonZeroDocs.map(d => d.score);

        // Calculate the 75th percentile threshold (top 25% of documents)
        // This means we only include documents scoring in the top quarter
        const sortedScores = [...scores].sort((a, b) => b - a);
        const percentile75Index = Math.floor(sortedScores.length * 0.25);
        const percentile75Threshold = sortedScores[Math.min(percentile75Index, sortedScores.length - 1)] || 0;

        // Also require at least 40% of top score (absolute quality gate)
        const MIN_RELATIVE_SCORE = 0.40;
        const absoluteThreshold = topScore * MIN_RELATIVE_SCORE;

        // Use the higher of the two thresholds
        const effectiveThreshold = Math.max(percentile75Threshold, absoluteThreshold);

        console.log(`[RAG] Thresholds: top=${topScore.toFixed(4)}, p75=${percentile75Threshold.toFixed(4)}, min40%=${absoluteThreshold.toFixed(4)}, effective=${effectiveThreshold.toFixed(4)}`);

        // Select documents above threshold, with gap detection
        const relevantDocs: typeof nonZeroDocs = [];
        const MAX_DOCS = 50; // Allow retrieving all relevant documents (quality gates will filter)

        for (let i = 0; i < nonZeroDocs.length && relevantDocs.length < MAX_DOCS; i++) {
            const doc = nonZeroDocs[i];

            // Must meet the effective threshold
            if (doc.score < effectiveThreshold) {
                console.log(`[RAG] Stopping at doc ${i}: score ${doc.score.toFixed(4)} below threshold ${effectiveThreshold.toFixed(4)}`);
                break;
            }

            // Check for score gap with previous doc (if not first) - detect relevance cliffs
            if (i > 0) {
                const prevScore = nonZeroDocs[i - 1].score;
                const dropRatio = doc.score / prevScore;
                if (dropRatio < 0.5) {
                    // More than 50% drop from previous - this is a relevance cliff
                    console.log(`[RAG] Stopping at doc ${i}: score gap detected (${(dropRatio * 100).toFixed(0)}% of previous)`);
                    break;
                }
            }

            relevantDocs.push(doc);
        }

        if (relevantDocs.length === 0) {
            console.log(`[RAG] No sufficiently relevant documents found for project ${spaceId}`);
            return undefined;
        }

        // Create Attachment objects from retrieved documents
        // - For uploaded files: reuse existing attachment (document ID = attachment ID)
        // - For Drive files: check driveNodeId, or create new attachment
        const attachments: Attachment[] = relevantDocs.map(doc => {
            const normalizedScore = topScore > 0 ? doc.score / topScore : 0;
            // Extract chunk info from doc if present
            const isChunk = (doc as { isChunk?: boolean }).isChunk;
            const chunkTitle = (doc as { chunkTitle?: string }).chunkTitle;
            // Get parent document ID for chunks
            const parentDocumentId = (doc as { parentDocumentId?: string }).parentDocumentId;
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
                att => att.autoRetrieved && att.driveNodeId === originalDocId
            );

            if (existingAutoRetrieved) {
                // Reuse the existing auto-retrieved attachment, update the relevance score
                console.log(`[RAG] Reusing existing auto-retrieved attachment for ${doc.name} (ID: ${existingAutoRetrieved.id})`);
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
        });

        console.log(`[RAG] Retrieved ${attachments.length} relevant documents for project ${spaceId}:`,
            `\n  Candidates: ${candidateDocs.length}, Non-zero: ${nonZeroDocs.length}, Selected: ${relevantDocs.length}`,
            `\n  Top score: ${topScore.toFixed(4)}, Threshold: ${(topScore * MIN_RELATIVE_SCORE).toFixed(4)}`,
            `\n  Selected: ${attachments.map(a => {
                const chunkInfo = a.isChunk ? ` [CHUNK: ${a.chunkTitle || 'untitled'}]` : '';
                return `${a.filename}${chunkInfo} (${((a.relevanceScore ?? 0) * 100).toFixed(0)}%)`;
            }).join(', ')}`);

        return {
            context: searchService.formatRAGContext(relevantDocs),
            attachments,
        };
    } catch (error) {
        console.warn('[RAG] Failed to retrieve document context:', error);
        return undefined;
    }
}

/** Get MIME type from filename */
function getMimeTypeFromName(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'md': 'text/markdown',
        'csv': 'text/csv',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'json': 'application/json',
        'html': 'text/html',
        'xml': 'application/xml',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// // TODO: break up logic between send and edit and improve error handling
export function sendMessage({
    api,
    newMessageContent,
    attachments,
    messageChain,
    conversationId,
    spaceId,
    signal,
    navigateCallback,
    isEdit,
    updateSibling,
    enableExternalToolsToggled,
    enableSmoothing = true,
    contextFilters = [],
    datePair,
}: {
    api: Api;
    newMessageContent: string;
    attachments: Attachment[];
    messageChain: Message[];
    conversationId: ConversationId | undefined;
    spaceId: SpaceId | undefined;
    signal: AbortSignal;
    navigateCallback?: (conversationId: ConversationId) => void;
    isEdit?: boolean;
    updateSibling?: (message: Message | undefined) => void;
    enableExternalToolsToggled: boolean;
    enableSmoothing?: boolean;
    contextFilters?: any[];
    datePair?: [string, string];
}) {
    return async (dispatch: AppDispatch, getState: () => any): Promise<Message | undefined> => {
        if (!newMessageContent.trim()) {
            return undefined;
        }

        const [date1, date2] = datePair || createDatePair();
        const lastMessage = messageChain.at(-1);

        // Check if phantom chat mode is enabled
        const state = getState();
        const isGhostMode = state.ghostChat?.isGhostChatMode || false;

        // TODO: check if this is needed, should be handled in useLumoActions
        if (!spaceId || !conversationId) {
            ({ conversationId, spaceId } = initializeNewSpaceAndConversation(dispatch, date1, isGhostMode));
        } else {
            dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.GENERATING }));
        }

        // Get space-level attachments (project files) and include them with the message
        const allAttachmentsState = state.attachments;

        // Get space attachments (project-level files) - these should be available for @ references
        const spaceAssets: Attachment[] = Object.values(allAttachmentsState || {})
            .filter((attachment: any) => {
                return attachment && typeof attachment === 'object' && attachment.spaceId === spaceId && !attachment.processing && !attachment.error;
            })
            .map((attachment: any) => attachment as Attachment);

        // Get attachments from current conversation messages - these should be available for @ references
        const conversationAttachments: Attachment[] = [];
        messageChain.forEach((message) => {
            if (message.attachments) {
                message.attachments.forEach((shallowAtt) => {
                    const fullAtt = allAttachmentsState[shallowAtt.id];
                    if (fullAtt && !conversationAttachments.some((a) => a.id === fullAtt.id)) {
                        conversationAttachments.push(fullAtt as Attachment);
                    }
                });
            }
        });

        // Combine space assets, conversation attachments, and provisional attachments for @ references
        // Exclude space attachments from other conversations
        const allMessageAttachments: Attachment[] = [...spaceAssets, ...conversationAttachments];
        attachments.forEach((att) => {
            if (!allMessageAttachments.some((a) => a.id === att.id)) {
                allMessageAttachments.push(att);
            }
        });

        const fileResolver = async (fileName: string): Promise<{ content: string; fileName: string } | null> => {

            const foundFile = allMessageAttachments.find(
                (att) => att.filename.toLowerCase() === fileName.toLowerCase()
            );

            if (foundFile && foundFile.markdown) {
                return { content: foundFile.markdown, fileName: foundFile.filename };
            }

            return null;
        };

        const { content: resolvedContent, referencedFiles } = await resolveFileReferences(
            newMessageContent,
            fileResolver
        );
        const processedContent: string = resolvedContent;

        // Identify which attachments came from @ file references
        const referencedFileNames = new Set(referencedFiles.map(f => f.fileName.toLowerCase()));

        // For space assignment, only consider provisional attachments (those without spaceId)
        // Referenced files should not be assigned to space regardless of their source
        const nonReferencedAttachments = attachments.filter(att =>
            !referencedFileNames.has(att.filename.toLowerCase())
        );

        // Identify provisional referenced attachments (from composer)
        const provisionalReferencedAttachments = attachments.filter(att =>
            referencedFileNames.has(att.filename.toLowerCase())
        );

        // Only attach provisional files from the composer (files explicitly uploaded to this message)
        // Project files (spaceAssets) should NOT be attached to messages even if @referenced:
        // - Their content is already resolved into the message via resolveFileReferences
        // - They're tracked in the project's knowledge base
        // - RAG will retrieve them if relevant (with isUploadedProjectFile flag)
        const messageAttachments = attachments;

        const { userMessage, assistantMessage } = createMessagePair(
            processedContent,
            messageAttachments,
            conversationId,
            lastMessage,
            date1,
            date2
        );
        dispatch(addMessage(userMessage));
        dispatch(
            finishMessage({
                messageId: userMessage.id,
                conversationId,
                spaceId,
                status: 'succeeded',
                content: userMessage.content ?? '',
                role: Role.User,
            })
        );
        // NOTE: Don't push the user message here - it will be pushed in fetchAssistantResponse
        // after RAG attachments are added. This ensures attachments are included in the push.

        // Define the sequence of message the assistant will respond to.
        // Obviously this must include the new user message containing the latest request.
        const newLinearChain = [...messageChain, userMessage];

        // Calculate which files will actually be used for the assistant response
        // Note: Project files are retrieved via RAG, so only message attachments are tracked here
        const contextFilesForResponse = getContextFilesForMessage(newLinearChain, contextFilters);

        // Update the assistant message with the context files that will be used
        const assistantMessageWithContext: Message = {
            ...assistantMessage,
            ...(contextFilesForResponse.length > 0 && { contextFiles: contextFilesForResponse }),
        };
        dispatch(addMessage(assistantMessageWithContext));

        // Only assign non-referenced attachments to the space
        // Referenced files (from @ mentions) should remain conversation-specific
        dispatch(assignProvisionalAttachmentsToSpace(nonReferencedAttachments, spaceId));

        // Push referenced attachments to server without assigning them to space
        // Only push provisional referenced attachments (those from the composer)
        provisionalReferencedAttachments.forEach((attachment) => {
            dispatch(pushAttachmentRequest({ id: attachment.id }));
        });

        // Navigate to /c/:conversationId
        if (!isEdit && navigateCallback) navigateCallback(conversationId);

        // In case of edit, pin the current message so it shows e.g. `< 2 / 2 >`.
        // If we didn't do this, the new message would be hidden, and we'd see `< 1 / 2 >`.
        if (isEdit && updateSibling) updateSibling(userMessage);

        // When we attach files, disable web search, otherwise this feels awkward.
        const noAttachment = attachments.length === 0;

        // Call the LLM.
        try {
            // Request title for new conversations (when messageChain is empty, it's the first message)
            const shouldRequestTitle = messageChain.length === 0;

            // Get personalization prompt for all messages (not just new conversations)
            let personalizationPrompt: string | undefined;
            const state = getState();
            const personalization = state.personalization;
            if (personalization?.enableForNewChats) {
                personalizationPrompt = getPersonalizationPromptFromState(personalization);
            }

            // Get project instructions from space if this is a project conversation
            let projectInstructions: string | undefined;
            let isProject = false;
            if (spaceId) {
                const space = state.spaces[spaceId];
                if (space?.isProject) {
                    isProject = true;
                    if (space?.projectInstructions) {
                        projectInstructions = space.projectInstructions;
                    }
                }
            }

            // Get user ID for RAG retrieval
            const userId = state.user?.value?.ID;

            await fetchAssistantResponse({
                api,
                dispatch,
                linearChain: newLinearChain,
                spaceId,
                conversationId,
                assistantMessageId: assistantMessageWithContext.id,
                signal,
                enableExternalTools: noAttachment && enableExternalToolsToggled,
                enableSmoothing,
                requestTitle: shouldRequestTitle,
                contextFilters,
                personalizationPrompt,
                projectInstructions,
                userId,
                isProject,
                allAttachments: state.attachments,
                referencedFileNames,
            });
        } catch (error) {
            console.warn('error: ', error);
            throw error;
        }

        return userMessage;
    };
}

// TODO: improve error handling
export function regenerateMessage(
    api: Api,
    spaceId: SpaceId,
    conversationId: ConversationId,
    assistantMessageId: MessageId,
    messagesWithContext: Message[],
    signal: AbortSignal,
    enableExternalTools: boolean,
    enableSmoothing: boolean = true,
    contextFilters: any[] = [],
    retryInstructions?: string
) {
    return async (dispatch: AppDispatch, getState: () => any) => {
        dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.GENERATING }));

        // Calculate which files will actually be used for the regenerated response
        // Note: Project files are retrieved via RAG
        const state = getState();
        const contextFilesForResponse = getContextFilesForMessage(messagesWithContext, contextFilters);

        // Update the assistant message with context files before regenerating
        const assistantMessage = messagesWithContext.find((m) => m.id === assistantMessageId);
        if (assistantMessage) {
            const updatedAssistantMessage: Message = {
                ...assistantMessage,
                ...(contextFilesForResponse.length > 0 && { contextFiles: contextFilesForResponse }),
            };
            dispatch(addMessage(updatedAssistantMessage));
        }

        try {
            // Get personalization prompt for regeneration as well
            const personalization = state.personalization;
            let personalizationPrompt: string | undefined;
            if (personalization?.enableForNewChats) {
                personalizationPrompt = getPersonalizationPromptFromState(personalization);
            }

            // Get project instructions from space if this is a project conversation
            let projectInstructions: string | undefined;
            let isProject = false;
            const space = state.spaces[spaceId];
            if (space?.isProject) {
                isProject = true;
                if (space?.projectInstructions) {
                    projectInstructions = space.projectInstructions;
                }
            }

            // Retrieve document context for RAG (only for projects)
            // Pass allAttachments so we can filter out already-retrieved documents
            const userId = state.user?.value?.ID;
            const allAttachments = state.attachments;
            const lastUserMessage = messagesWithContext.filter(m => m.role === Role.User).pop();
            const userQuery = lastUserMessage?.content || '';
            const ragResult = await retrieveDocumentContextForProject(
                userQuery,
                spaceId,
                userId,
                isProject,
                messagesWithContext,
                allAttachments
            );

            console.log('[RAG] Context retrieval result:', {
                personalizationPrompt: !!personalizationPrompt,
                projectInstructions: !!projectInstructions,
                documentContext: !!ragResult?.context,
                documentContextLength: ragResult?.context?.length || 0,
                ragAttachments: ragResult?.attachments?.length || 0,
                userQuery: userQuery.slice(0, 50),
                spaceId,
                isProject,
            });

            // If we have RAG attachments, store them and add to the user message
            let updatedMessagesWithContext = messagesWithContext;
            if (ragResult?.attachments && ragResult.attachments.length > 0 && lastUserMessage) {
                // Store each attachment in Redux
                // Skip uploaded project files (they're already in Redux)
                // Don't persist auto-retrieved Drive files to server
                for (const attachment of ragResult.attachments) {
                    if (attachment.isUploadedProjectFile) {
                        // Skip - uploaded files are already in Redux
                        console.log(`[RAG] Skipping upsert for uploaded project file: ${attachment.filename}`);
                        continue;
                    }
                    dispatch(upsertAttachment(attachment));
                    if (!attachment.autoRetrieved) {
                        dispatch(pushAttachmentRequest({ id: attachment.id }));
                    }
                }

                // Create shallow attachment refs for the message
                const existingAttachments = lastUserMessage.attachments || [];
                const existingAttachmentIds = new Set(existingAttachments.map(att => att.id));

                // Only add attachments that aren't already in the message (avoid duplicates)
                const newShallowAttachments: ShallowAttachment[] = ragResult.attachments
                    .filter(att => !existingAttachmentIds.has(att.id))
                    .map(att => {
                        const { data, markdown, ...shallow } = att;
                        return shallow as ShallowAttachment;
                    });

                const updatedUserMessage: Message = {
                    ...lastUserMessage,
                    attachments: [...existingAttachments, ...newShallowAttachments],
                };
                dispatch(addMessage(updatedUserMessage));
                dispatch(pushMessageRequest({ id: lastUserMessage.id }));

                // Update messagesWithContext to include the updated user message
                updatedMessagesWithContext = messagesWithContext.map(msg =>
                    msg.id === lastUserMessage.id ? updatedUserMessage : msg
                );

                // Recalculate contextFiles to include the auto-retrieved attachments
                const updatedContextFiles = getContextFilesForMessage(updatedMessagesWithContext, contextFilters);

                // Update the assistant message's contextFiles
                const assistantMessage = state.messages[assistantMessageId];
                if (assistantMessage) {
                    const updatedAssistantMessage: Message = {
                        ...assistantMessage,
                        contextFiles: updatedContextFiles,
                    };
                    dispatch(addMessage(updatedAssistantMessage));
                }
            }

            const turns = getFilteredTurns(updatedMessagesWithContext, contextFilters, personalizationPrompt, projectInstructions, ragResult?.context);

            // Add retry instructions if provided
            if (retryInstructions) {
                // Insert a system message with retry instructions before the final assistant turn
                const systemTurn = {
                    role: Role.System,
                    content: retryInstructions,
                };
                // Insert the system turn before the last turn (which should be the empty assistant turn)
                turns.splice(-1, 0, systemTurn);
            }

            await dispatch(
                sendMessageWithRedux(api, turns, {
                    messageId: assistantMessageId,
                    conversationId,
                    spaceId,
                    signal,
                    enableExternalTools,
                    config: {
                        enableU2LEncryption: ENABLE_U2L_ENCRYPTION,
                        enableSmoothing,
                    },
                    errorHandler: createLumoErrorHandler(),
                })
            );
        } catch (error) {
            console.warn('error: ', error);
            throw error;
        }
    };
}

export async function retrySendMessage({
    api,
    dispatch,
    lastUserMessage,
    messageChain,
    spaceId,
    conversationId,
    signal,
    enableExternalTools,
    contextFilters = [],
    personalizationPrompt,
    projectInstructions,
    allAttachments = {},
}: {
    api: Api;
    dispatch: AppDispatch;
    lastUserMessage: Message;
    messageChain: Message[];
    spaceId: SpaceId;
    conversationId: ConversationId;
    signal: AbortSignal;
    enableExternalTools: boolean;
    contextFilters?: any[];
    personalizationPrompt?: string;
    projectInstructions?: string;
    allAttachments?: Record<string, Attachment>;
}) {
    const [, date2] = createDatePair();

    // Update conversation status to generating
    dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.GENERATING }));

    // Create a new assistant message for the retry
    const assistantMessageId = newMessageId();
    const assistantMessage: Message = {
        id: assistantMessageId,
        parentId: lastUserMessage.id,
        createdAt: date2,
        content: '',
        role: Role.Assistant,
        placeholder: true,
        conversationId,
    };

    // Note: Project files are retrieved via RAG
    const contextFilesForResponse = getContextFilesForMessage(messageChain, contextFilters);

    // Update the assistant message with the context files that will be used
    const assistantMessageWithContext: Message = {
        ...assistantMessage,
        ...(contextFilesForResponse.length > 0 && { contextFiles: contextFilesForResponse }),
    };

    dispatch(addMessage(assistantMessageWithContext));

    // Call the LLM
    try {
        await fetchAssistantResponse({
            api,
            dispatch,
            linearChain: messageChain,
            spaceId,
            conversationId,
            assistantMessageId,
            signal,
            enableExternalTools,
            requestTitle: messageChain.length === 1, // only request title if retrying first message
            contextFilters,
            personalizationPrompt,
            projectInstructions,
            allAttachments,
        });
    } catch (error) {
        console.warn('retry error: ', error);
        throw error;
    }

    return assistantMessage;
}

export function initializeNewSpaceAndConversation(
    dispatch: AppDispatch,
    createdAt: string,
    isGhostMode: boolean = false
): { conversationId: ConversationId; spaceId: SpaceId } {
    const spaceId = newSpaceId();
    dispatch(addSpace({ id: spaceId, createdAt, spaceKey: generateSpaceKeyBase64() }));
    dispatch(pushSpaceRequest({ id: spaceId }));

    const conversationId = newConversationId();
    dispatch(
        addConversation({
            id: conversationId,
            spaceId,
            title: c('collider_2025: Placeholder').t`New chat`,
            createdAt,
            status: ConversationStatus.GENERATING,
            ...(isGhostMode && { ghost: true }),
        })
    );
    dispatch(pushConversationRequest({ id: conversationId }));

    return { conversationId, spaceId };
}

function createMessagePair(
    content: string,
    attachments: Attachment[],
    conversationId: ConversationId,
    lastMessage: Message | undefined,
    date1: string,
    date2: string,
    contextFiles: AttachmentId[] = [] // Files that will be used in LLM context for the assistant response
) {
    const context = flattenAttachmentsForLlm(attachments);
    const shallowAttachments = stripDataFromAttachments(attachments);

    const userMessage: Message = {
        id: newMessageId(),
        parentId: lastMessage?.id,
        conversationId,
        createdAt: date1,
        role: Role.User,
        status: 'succeeded', //This should align with ConversationStatus?
        content,
        context,
        ...(shallowAttachments.length && { attachments: shallowAttachments }),
    };

    const assistantMessage: Message = {
        id: newMessageId(),
        parentId: userMessage.id,
        createdAt: date2,
        content: '',
        role: Role.Assistant,
        placeholder: true,
        conversationId,
        ...(contextFiles.length > 0 && { contextFiles }), // Record which files will be used
    };

    return { userMessage, assistantMessage };
}

function stripDataFromAttachments(attachments: Attachment[]): ShallowAttachment[] {
    return attachments.map((a) => {
        const { processing, ...attachmentPub } = getAttachmentPub(a);
        // Strip down heavy fields from the attachment priv, keep only the lightweight metadata
        const { data, markdown, ...attachmentPriv } = getAttachmentPriv(a);
        return {
            ...attachmentPub,
            ...attachmentPriv,
        };
    });
}

// Sets the space id for each provisional attachment, thereby assigning them to the space.
// This should remove them from the composer area.
// ("Provisional" attachments are defined as those not yet assigned to a space.)
function assignProvisionalAttachmentsToSpace(attachments: Attachment[], spaceId: SpaceId) {
    return (dispatch: AppDispatch) => {
        attachments.forEach((a) => {
            dispatch(upsertAttachment({ ...a, spaceId }));
            // Now that the attachment has a spaceId, push it to the server
            dispatch(pushAttachmentRequest({ id: a.id }));
        });
    };
}

export async function fetchAssistantResponse({
    api,
    dispatch,
    linearChain,
    spaceId,
    conversationId,
    assistantMessageId,
    signal,
    enableExternalTools,
    enableSmoothing = true,
    requestTitle = false,
    contextFilters = [],
    personalizationPrompt,
    projectInstructions,
    userId,
    isProject = false,
    allAttachments = {},
    referencedFileNames = new Set<string>(),
}: {
    api: Api;
    dispatch: AppDispatch;
    linearChain: Message[];
    spaceId: SpaceId;
    conversationId: ConversationId;
    assistantMessageId: string;
    signal: AbortSignal;
    enableExternalTools: boolean;
    enableSmoothing?: boolean;
    requestTitle?: boolean;
    contextFilters?: any[];
    personalizationPrompt?: string;
    projectInstructions?: string;
    userId?: string;
    isProject?: boolean;
    allAttachments?: Record<string, Attachment>;
    referencedFileNames?: Set<string>;
}) {
    // Extract the user's query from the last user message for RAG retrieval
    const lastUserMessage = linearChain.filter(m => m.role === Role.User).pop();
    const userQuery = lastUserMessage?.content || '';

    // Retrieve relevant documents from the project's indexed Drive folder (RAG)
    // Pass allAttachments so we can filter out already-retrieved documents
    // Pass referencedFileNames to exclude files that were explicitly @mentioned
    const ragResult = await retrieveDocumentContextForProject(
        userQuery,
        spaceId,
        userId,
        isProject,
        linearChain,
        allAttachments || {},
        referencedFileNames
    );

    console.log('[RAG] fetchAssistantResponse context:', {
        personalizationPrompt: !!personalizationPrompt,
        projectInstructions: !!projectInstructions,
        documentContext: !!ragResult?.context,
        documentContextLength: ragResult?.context?.length || 0,
        ragAttachments: ragResult?.attachments?.length || 0,
        userQuery: userQuery.slice(0, 50),
        spaceId,
        isProject,
    });

    // If we have RAG attachments, store them and add to the user message
    let updatedLinearChain = linearChain;
    if (ragResult?.attachments && ragResult.attachments.length > 0 && lastUserMessage) {
        // Store each attachment in Redux
        // Skip uploaded project files (they're already in Redux)
        // Don't persist auto-retrieved Drive files to server
        for (const attachment of ragResult.attachments) {
            if (attachment.isUploadedProjectFile) {
                // Skip - uploaded files are already in Redux
                console.log(`[RAG] Skipping upsert for uploaded project file: ${attachment.filename}`);
                continue;
            }
            dispatch(upsertAttachment(attachment));
            if (!attachment.autoRetrieved) {
                dispatch(pushAttachmentRequest({ id: attachment.id }));
            }
        }

        // Create shallow attachment refs for the message
        const existingAttachments = lastUserMessage.attachments || [];
        const existingAttachmentIds = new Set(existingAttachments.map(att => att.id));

        // Only add new attachments that aren't already in the message (avoid duplicates when reusing IDs)
        const newShallowAttachments: ShallowAttachment[] = ragResult.attachments
            .filter(att => !existingAttachmentIds.has(att.id))
            .map(att => {
                const { data, markdown, ...shallow } = att;
                return shallow as ShallowAttachment;
            });

        const updatedUserMessage: Message = {
            ...lastUserMessage,
            attachments: [...existingAttachments, ...newShallowAttachments],
        };
        dispatch(addMessage(updatedUserMessage));
        dispatch(pushMessageRequest({ id: lastUserMessage.id }));

        // Update the linearChain with the updated user message
        updatedLinearChain = linearChain.map(msg =>
            msg.id === lastUserMessage.id ? updatedUserMessage : msg
        );

        // Recalculate contextFiles to include the auto-retrieved attachments
        const updatedContextFiles = getContextFilesForMessage(updatedLinearChain, contextFilters);

        console.log(`[RAG] Updated contextFiles after adding auto-retrieved attachments:`, updatedContextFiles);

        // IMMEDIATELY update the assistant message's contextFiles BEFORE streaming starts
        // This ensures the "X files" button appears right away
        dispatch((innerDispatch: AppDispatch, getState: () => any) => {
            const state = getState();
            const assistantMessage = state.messages[assistantMessageId];
            if (assistantMessage) {
                const updatedAssistantMessage: Message = {
                    ...assistantMessage,
                    contextFiles: updatedContextFiles,
                };
                innerDispatch(addMessage(updatedAssistantMessage));
                // Note: Don't push to server yet - the message is still being generated
            }
        });
    } else if (lastUserMessage) {
        // No RAG attachments, but still need to push the user message
        // (it wasn't pushed earlier to allow for RAG attachments to be added first)
        dispatch(pushMessageRequest({ id: lastUserMessage.id }));
    }

    const turns = getFilteredTurns(updatedLinearChain, contextFilters, personalizationPrompt, projectInstructions, ragResult?.context);
    await dispatch(
        sendMessageWithRedux(api, turns, {
            messageId: assistantMessageId,
            conversationId,
            spaceId,
            signal,
            enableExternalTools,
            requestTitle,
            config: {
                enableU2LEncryption: ENABLE_U2L_ENCRYPTION,
                enableSmoothing,
            },
            errorHandler: createLumoErrorHandler(),
        })
    );

    // After sending the message, persist the assistant message with contextFiles
    if (ragResult?.attachments && ragResult.attachments.length > 0) {
        // Persist the assistant message with its contextFiles after the stream completes
        dispatch(pushMessageRequest({ id: assistantMessageId }));
    }
}

export function generateFakeConversationToShowTierError({
    newMessageContent,
    navigateCallback,
}: {
    newMessageContent: string;
    navigateCallback: (conversationId: ConversationId) => void;
}) {
    return async (dispatch: AppDispatch): Promise<Message | undefined> => {
        if (!newMessageContent.trim()) {
            return undefined;
        }

        const [date1, date2] = createDatePair();

        // Create new space and conversation just like in sendMessage
        const { conversationId, spaceId } = initializeNewSpaceAndConversation(dispatch, date1);

        const { userMessage, assistantMessage } = createMessagePair(
            newMessageContent,
            [],
            conversationId,
            undefined,
            date1,
            date2
        );
        dispatch(addMessage(userMessage));
        dispatch(
            finishMessage({
                messageId: userMessage.id,
                conversationId,
                spaceId,
                status: 'succeeded',
                content: userMessage.content ?? '',
                role: Role.User,
            })
        );
        dispatch(addMessage(assistantMessage));

        navigateCallback(conversationId);

        dispatch(
            finishMessage({
                messageId: assistantMessage.id,
                conversationId,
                spaceId,
                status: 'succeeded',
                content: assistantMessage.content ?? '',
                role: Role.Assistant,
            })
        );

        dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.COMPLETED }));

        return userMessage;
    };
}

// Helper function to generate personalization prompt from state (without using hooks)
export function getPersonalizationPromptFromState(personalization: PersonalizationSettings): string {
    if (!personalization.enableForNewChats) {
        return '';
    }

    const parts: string[] = [];

    if (personalization.nickname) {
        parts.push(`Please address me as ${personalization.nickname}.`);
    }

    if (personalization.jobRole) {
        parts.push(`My role/job: ${personalization.jobRole}.`);
    }

    if (personalization.personality !== 'default') {
        const personalityOption = PERSONALITY_OPTIONS.find(p => p.value === personalization.personality);
        const description = personalityOption?.description;
        if (description) {
            parts.push(`Please adopt a ${description.toLowerCase()} personality.`);
        }
    }

    if (personalization.lumoTraits) {
        parts.push(`Lumo traits: ${personalization.lumoTraits}`);
    }

    if (personalization.additionalContext) {
        parts.push(`Additional context: ${personalization.additionalContext}`);
    }

    return parts.join(' ');
}
