import { c } from 'ttag';

import type { Api } from '@proton/shared/lib/interfaces';

import { generateSpaceKeyBase64 } from '../../crypto';
import { sendMessageWithRedux } from '../../lib/lumo-api-client/integrations/redux';
import { collectContextAttachmentIds, retrieveDocumentContextForProject } from '../../lib/rag';
import { type ContextFilter, ENABLE_U2L_ENCRYPTION, prepareTurns } from '../../llm';
import { flattenAttachmentsForLlm } from '../../llm/attachments';
import type { AttachmentMap } from '../../redux/slices/core/attachments';
import { pushAttachmentRequest, upsertAttachment } from '../../redux/slices/core/attachments';
import {
    addConversation,
    newConversationId,
    pushConversationRequest,
    updateConversationStatus,
} from '../../redux/slices/core/conversations';
import {
    addMessage,
    createDate,
    createDatePair,
    finishMessage,
    newMessageId,
    pushMessageRequest,
} from '../../redux/slices/core/messages';
import { addSpace, newSpaceId, pushSpaceRequest } from '../../redux/slices/core/spaces';
import { PERSONALITY_OPTIONS, type PersonalizationSettings } from '../../redux/slices/personalization';
import type { LumoDispatch as AppDispatch, LumoDispatch } from '../../redux/store';
import { createGenerationError, getErrorTypeFromMessage } from '../../services/errors/errorHandling';
import type { MessageId, ShallowAttachment } from '../../types';
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
import type { GenerationResponseMessage } from '../../types-api';
import { parseFileReferences } from '../../util/fileReferences';

const createLumoErrorHandler = () => (message: GenerationResponseMessage, cId: string) =>
    createGenerationError(getErrorTypeFromMessage(message.type), cId, message);

export type ApplicationContext = {
    api: Api;
    signal: AbortSignal;
    userId?: string;
};

export type NewMessageData = {
    content: string;
    attachments: Attachment[];
};

export type ConversationContext = {
    spaceId: SpaceId;
    conversationId: ConversationId;
    allConversationAttachments: Attachment[];
    messageChain: Message[];
    contextFilters: ContextFilter[];
};

export type ProjectContext = {
    isProject: boolean;
    projectInstructions?: string;
    allAttachments: AttachmentMap;
};

export type UiContext = {
    isEdit?: boolean; // todo remove optional
    updateSibling?: (message: Message | undefined) => void; // todo remove optional
    enableExternalTools: boolean;
    enableImageTools: boolean;
    enableSmoothing?: boolean; // todo remove optional
    navigateCallback?: (conversationId: ConversationId) => void; // todo remove optional
    isGhostMode?: boolean; // todo remove optional
};

export type SettingsContext = {
    personalization?: PersonalizationSettings;
};

const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
    nickname: '',
    jobRole: '',
    personality: 'default',
    traits: [],
    lumoTraits: '',
    additionalContext: '',
    enableForNewChats: true,
};

function ensureConversation(c: ConversationContext, ui: UiContext, createdAt: string) {
    return (dispatch: LumoDispatch) => {
        const { conversationId, spaceId } = c;
        if (!spaceId || !conversationId) {
            return dispatch(initializeNewSpaceAndConversation(createdAt, ui.isGhostMode));
        }
        dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.GENERATING }));
        return { spaceId, conversationId };
    };
}

function populateMessageContext(message: Message, messageChain: Message[], c: ConversationContext) {
    // Calculate which files will actually be used for the assistant response
    // Note: Project files are retrieved via RAG, so only message attachments are tracked here
    const contextFiles = collectContextAttachmentIds(messageChain, c.contextFilters);

    // Update the message with the context files that will be used
    return {
        ...message,
        ...(contextFiles.length > 0 && { contextFiles }),
    };
}

function updateUi(userMessage: Message, conversationId: ConversationId, ui: UiContext) {
    const { isEdit, navigateCallback, updateSibling } = ui;
    // Navigate to /c/:conversationId
    if (!isEdit && navigateCallback) navigateCallback(conversationId);

    // In case of edit, pin the current message so it shows e.g. `< 2 / 2 >`.
    // If we didn't do this, the new message would be hidden, and we'd see `< 1 / 2 >`.
    if (isEdit && updateSibling) updateSibling(userMessage);
}

export function sendMessage({
    applicationContext: a,
    newMessageData: m,
    conversationContext: c,
    uiContext: ui,
    settingsContext: s,
}: {
    applicationContext: ApplicationContext;
    newMessageData: NewMessageData;
    conversationContext: ConversationContext;
    uiContext: UiContext;
    settingsContext: SettingsContext;
}) {
    return async (dispatch: AppDispatch, getState: () => any): Promise<Message | undefined> => {
        if (!m.content.trim()) {
            return undefined;
        }

        const state = getState();

        // Initialize
        const [date1, date2] = createDatePair();
        const { conversationId, spaceId } = dispatch(ensureConversation(c, ui, date1));

        // Get space-level attachments (project files) and include them with the message
        const allAttachmentsState = state.attachments;

        // Get space attachments (project-level files) - these should be available for @ references
        const spaceAssets: Attachment[] = Object.values(allAttachmentsState || {})
            .filter((attachment: any) => {
                return (
                    attachment &&
                    typeof attachment === 'object' &&
                    attachment.spaceId === spaceId &&
                    !attachment.processing &&
                    !attachment.error
                );
            })
            .map((attachment: any) => attachment as Attachment);

        // Get attachments from current conversation messages - these should be available for @ references
        const conversationAttachments: Attachment[] = [];
        c.messageChain.forEach((message) => {
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
        c.allConversationAttachments.forEach((att) => {
            if (!allMessageAttachments.some((a) => a.id === att.id)) {
                allMessageAttachments.push(att);
            }
        });

        // Parse file references from the message content
        const fileReferences = parseFileReferences(m.content);
        const referencedFileNames = new Set(fileReferences.map((ref) => ref.fileName.toLowerCase()));

        // Find attachments that match the referenced files
        const referencedAttachments: Attachment[] = [];
        fileReferences.forEach((ref) => {
            const foundFile = allMessageAttachments.find(
                (att) => att.filename.toLowerCase() === ref.fileName.toLowerCase()
            );
            if (foundFile && !referencedAttachments.some((a) => a.id === foundFile.id)) {
                referencedAttachments.push(foundFile);
            }
        });

        // For space assignment, only consider provisional attachments (those without spaceId)
        // Referenced files should not be assigned to space regardless of their source
        const nonReferencedAttachments = m.attachments.filter(
            (att) => !referencedFileNames.has(att.filename.toLowerCase())
        );

        // Identify provisional referenced attachments (from composer)
        const provisionalReferencedAttachments = m.attachments.filter((att) =>
            referencedFileNames.has(att.filename.toLowerCase())
        );

        const processedContent: string = m.content;

        // Create the new messages (user and assistant)
        const lastMessage = c.messageChain.at(-1);
        let { userMessage, assistantMessage } = createMessagePair(
            processedContent,
            m.attachments,
            conversationId,
            lastMessage,
            date1,
            date2
        );

        // Save the user message to Redux and request push to persistence HTTP API
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
        const newMessageChain = [...c.messageChain, userMessage];

        // Fill in context files (attachment ids)
        assistantMessage = populateMessageContext(assistantMessage, newMessageChain, c);

        // Save the assistant message to Redux
        dispatch(addMessage(assistantMessage));

        // Detach attachments from the composer area and attach them to the space permanently
        // Only assign non-referenced attachments to the space
        // Referenced files (from @ mentions) should remain conversation-specific
        dispatch(assignProvisionalAttachmentsToSpace(nonReferencedAttachments, spaceId));

        // Push referenced attachments to server without assigning them to space
        // Only push provisional referenced attachments (those from the composer)
        provisionalReferencedAttachments.forEach((attachment) => {
            dispatch(pushAttachmentRequest({ id: attachment.id }));
        });

        // Update navigation and siblings preference
        updateUi(userMessage, conversationId, ui);

        const noAttachment = m.attachments.length === 0;

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
        const allAttachments = state.attachments;

        // Get user ID for RAG retrieval
        const userId = state.user?.value?.ID;

        const generateTitle = c.messageChain.length === 0;
        const linearChain = newMessageChain;

        // Call the LLM.
        try {
            // Extract the user's query from the last user message for RAG retrieval
            const lastUserMessage = linearChain.filter((m) => m.role === Role.User).pop();
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
                const existingAttachmentIds = new Set(existingAttachments.map((att) => att.id));

                // Only add new attachments that aren't already in the message (avoid duplicates when reusing IDs)
                const newShallowAttachments: ShallowAttachment[] = ragResult.attachments
                    .filter((att) => !existingAttachmentIds.has(att.id))
                    .map((att) => {
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
                updatedLinearChain = linearChain.map((msg) =>
                    msg.id === lastUserMessage.id ? updatedUserMessage : msg
                );

                // Recalculate contextFiles to include the auto-retrieved attachments
                const updatedContextFiles = collectContextAttachmentIds(updatedLinearChain, c.contextFilters);

                console.log(`[RAG] Updated contextFiles after adding auto-retrieved attachments:`, updatedContextFiles);

                // IMMEDIATELY update the assistant message's contextFiles BEFORE streaming starts
                // This ensures the "X files" button appears right away
                const updatedAssistantMessage: Message = {
                    ...assistantMessage,
                    contextFiles: updatedContextFiles,
                };
                dispatch(addMessage(updatedAssistantMessage));
                // Note: Don't push to server yet - the message is still being generated
            } else if (lastUserMessage) {
                // No RAG attachments, but still need to push the user message
                // (it wasn't pushed earlier to allow for RAG attachments to be added first)
                dispatch(pushMessageRequest({ id: lastUserMessage.id }));
            }

            const turns = prepareTurns(
                updatedLinearChain,
                s.personalization ?? DEFAULT_PERSONALIZATION,
                projectInstructions,
                ragResult?.context,
                c
            );

            await dispatch(
                sendMessageWithRedux(a.api, turns, {
                    messageId: assistantMessage.id,
                    conversationId,
                    spaceId,
                    signal: a.signal,
                    enableExternalTools: noAttachment && ui.enableExternalTools,
                    enableImageTools: ui.enableImageTools,
                    generateTitle,
                    config: {
                        enableU2LEncryption: ENABLE_U2L_ENCRYPTION,
                        enableSmoothing: ui.enableSmoothing,
                    },
                    errorHandler: createLumoErrorHandler(),
                })
            );
        } catch (error) {
            console.warn('error: ', error);
            throw error;
        }

        return userMessage;
    };
}

export type RegenerateData = {
    assistantMessageId: MessageId;
    retryInstructions?: string;
};

// TODO: improve error handling
export function regenerateMessage({
    applicationContext: a,
    conversationContext: c,
    uiContext: ui,
    settingsContext: s,
    regenerateData: r,
}: {
    applicationContext: ApplicationContext;
    conversationContext: ConversationContext;
    uiContext: UiContext;
    settingsContext: SettingsContext;
    regenerateData: RegenerateData;
}) {
    return async (dispatch: AppDispatch, getState: () => any) => {
        dispatch(updateConversationStatus({ id: c.conversationId!, status: ConversationStatus.GENERATING }));

        const state = getState();

        // Calculate which files will actually be used for the regenerated response
        // Note: Project files are retrieved via RAG
        const contextFiles = collectContextAttachmentIds(c.messageChain, c.contextFilters);

        // Update the assistant message with context files before regenerating
        let assistantMessage = c.messageChain.find((m) => m.id === r.assistantMessageId);
        if (assistantMessage) {
            assistantMessage = {
                ...assistantMessage,
                ...(contextFiles.length > 0 && { contextFiles }),
            };
            dispatch(addMessage(assistantMessage));
        }

        try {
            const messagesWithContext = c.messageChain;
            // Get project instructions from space if this is a project conversation
            let projectInstructions: string | undefined;
            let isProject = false;
            const space = state.spaces[c.spaceId];
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
            const lastUserMessage = messagesWithContext.filter((m) => m.role === Role.User).pop();
            const userQuery = lastUserMessage?.content || '';
            const ragResult = await retrieveDocumentContextForProject(
                userQuery,
                c.spaceId,
                userId,
                isProject,
                messagesWithContext,
                allAttachments
            );

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
                const existingAttachmentIds = new Set(existingAttachments.map((att) => att.id));

                // Only add attachments that aren't already in the message (avoid duplicates)
                const newShallowAttachments: ShallowAttachment[] = ragResult.attachments
                    .filter((att) => !existingAttachmentIds.has(att.id))
                    .map((att) => {
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
                updatedMessagesWithContext = messagesWithContext.map((msg) =>
                    msg.id === lastUserMessage.id ? updatedUserMessage : msg
                );

                // Recalculate contextFiles to include the auto-retrieved attachments
                const updatedContextFiles = collectContextAttachmentIds(updatedMessagesWithContext, c.contextFilters);

                // Update the assistant message's contextFiles
                if (assistantMessage) {
                    assistantMessage = {
                        ...assistantMessage,
                        contextFiles: updatedContextFiles,
                    };
                    dispatch(addMessage(assistantMessage));
                }
            }

            // Build conversation context (Δ₂ pattern)
            c = {
                ...c,
                messageChain: updatedMessagesWithContext,
            };

            // Δ₁ + Δ₂: Use refactored API with RAG context
            const turns = prepareTurns(
                updatedMessagesWithContext,
                s.personalization ?? DEFAULT_PERSONALIZATION,
                projectInstructions,
                ragResult?.context,
                c
            );

            // Add retry instructions if provided
            if (r.retryInstructions) {
                // Insert a system message with retry instructions before the final assistant turn
                const systemTurn = {
                    role: Role.System,
                    content: r.retryInstructions,
                };
                // Insert the system turn before the last turn (which should be the empty assistant turn)
                turns.splice(-1, 0, systemTurn);
            }

            await dispatch(
                sendMessageWithRedux(a.api, turns, {
                    messageId: r.assistantMessageId,
                    conversationId: c.conversationId!,
                    spaceId: c.spaceId!,
                    signal: a.signal,
                    enableExternalTools: ui.enableExternalTools,
                    enableImageTools: ui.enableImageTools,
                    config: {
                        enableU2LEncryption: ENABLE_U2L_ENCRYPTION,
                        enableSmoothing: ui.enableSmoothing,
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

export type RetryData = {
    lastUserMessage: Message;
};

export function retrySendMessage({
    applicationContext: a,
    conversationContext: c,
    projectContext: p,
    uiContext: ui,
    settingsContext: s,
    retryData: r,
}: {
    applicationContext: ApplicationContext;
    conversationContext: ConversationContext;
    projectContext: ProjectContext;
    uiContext: UiContext;
    settingsContext: SettingsContext;
    retryData: RetryData;
}) {
    return async (dispatch: LumoDispatch) => {
        const date = createDate();

        // Update conversation status to generating
        dispatch(updateConversationStatus({ id: c.conversationId, status: ConversationStatus.GENERATING }));

        // Create a new assistant message for the retry
        const assistantMessageId = newMessageId();
        let assistantMessage: Message = {
            id: assistantMessageId,
            parentId: r.lastUserMessage.id,
            createdAt: date,
            content: '',
            role: Role.Assistant,
            placeholder: true,
            conversationId: c.conversationId,
            blocks: [],
        };

        // Note: Project files are retrieved via RAG
        const contextFiles = collectContextAttachmentIds(c.messageChain, c.contextFilters);

        // Update the assistant message with the context files that will be used
        assistantMessage = {
            ...assistantMessage,
            ...(contextFiles.length > 0 && { contextFiles }),
        };

        dispatch(addMessage(assistantMessage));

        // Call the LLM
        const linearChain = c.messageChain;
        const requestTitle = c.messageChain.length === 1;
        const referencedFileNames = new Set<string>(); // empty for retry, no new @ mentions

        // Extract the user's query from the last user message for RAG retrieval
        const lastUserMessage = linearChain.filter((m) => m.role === Role.User).pop();
        const userQuery = lastUserMessage?.content || '';

        // Retrieve relevant documents from the project's indexed Drive folder (RAG)
        // Pass allAttachments so we can filter out already-retrieved documents
        // Pass referencedFileNames to exclude files that were explicitly @mentioned
        const ragResult = await retrieveDocumentContextForProject(
            userQuery,
            c.spaceId,
            a.userId,
            p.isProject,
            linearChain,
            p.allAttachments || {},
            referencedFileNames
        );

        // If we have RAG attachments, store them and add to the user message
        let updatedLinearChain = linearChain;
        if (ragResult?.attachments && ragResult.attachments.length > 0 && lastUserMessage) {
            // Store each attachment in Redux
            // Skip uploaded project files (they're already in Redux)
            // Don't persist auto-retrieved Drive files to server
            for (const attachment of ragResult.attachments) {
                if (attachment.isUploadedProjectFile) {
                    continue;
                }
                dispatch(upsertAttachment(attachment));
                if (!attachment.autoRetrieved) {
                    dispatch(pushAttachmentRequest({ id: attachment.id }));
                }
            }

            // Create shallow attachment refs for the message
            const existingAttachments = lastUserMessage.attachments || [];
            const existingAttachmentIds = new Set(existingAttachments.map((att) => att.id));

            // Only add new attachments that aren't already in the message (avoid duplicates when reusing IDs)
            const newShallowAttachments: ShallowAttachment[] = ragResult.attachments
                .filter((att) => !existingAttachmentIds.has(att.id))
                .map((att) => {
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
            updatedLinearChain = linearChain.map((msg) => (msg.id === lastUserMessage.id ? updatedUserMessage : msg));

            // Recalculate contextFiles to include the auto-retrieved attachments
            const updatedContextFiles = collectContextAttachmentIds(updatedLinearChain, c.contextFilters);

            console.log(`[RAG] Updated contextFiles after adding auto-retrieved attachments:`, updatedContextFiles);

            // IMMEDIATELY update the assistant message's contextFiles BEFORE streaming starts
            // This ensures the "X files" button appears right away
            if (assistantMessage) {
                const updatedAssistantMessage: Message = {
                    ...assistantMessage,
                    contextFiles: updatedContextFiles,
                };
                dispatch(addMessage(updatedAssistantMessage));
                // Note: Don't push to server yet - the message is still being generated
            }
        } else if (lastUserMessage) {
            // No RAG attachments, but still need to push the user message
            // (it wasn't pushed earlier to allow for RAG attachments to be added first)
            dispatch(pushMessageRequest({ id: lastUserMessage.id }));
        }

        // Build conversation context for turn preparation (includes attachments for image enrichment)
        const c2: ConversationContext = {
            ...c,
            messageChain: updatedLinearChain,
        };

        // Prepare turns with images (prepareTurns handles enrichment internally when c is provided)
        const turns = prepareTurns(
            updatedLinearChain,
            s.personalization ?? DEFAULT_PERSONALIZATION,
            p.projectInstructions,
            ragResult?.context,
            c2
        );

        // Call the LLM
        try {
            await dispatch(
                sendMessageWithRedux(a.api, turns, {
                    messageId: assistantMessageId,
                    conversationId: c.conversationId!,
                    spaceId: c.spaceId!,
                    signal: a.signal,
                    enableExternalTools: ui.enableExternalTools,
                    enableImageTools: ui.enableImageTools,
                    generateTitle: requestTitle,
                    config: {
                        enableU2LEncryption: ENABLE_U2L_ENCRYPTION,
                        enableSmoothing: ui.enableSmoothing,
                    },
                    errorHandler: createLumoErrorHandler(),
                })
            );
        } catch (error) {
            console.warn('retry error: ', error);
            throw error;
        }

        return assistantMessage;
    };
}

export function initializeNewSpaceAndConversation(createdAt: string, isGhostMode: boolean = false) {
    return (dispatch: LumoDispatch): { conversationId: ConversationId; spaceId: SpaceId } => {
        const spaceId = newSpaceId();
        dispatch(addSpace({ id: spaceId, createdAt, updatedAt: createdAt, spaceKey: generateSpaceKeyBase64() }));
        dispatch(pushSpaceRequest({ id: spaceId }));

        const conversationId = newConversationId();
        dispatch(
            addConversation({
                id: conversationId,
                spaceId,
                title: c('collider_2025: Placeholder').t`New chat`,
                createdAt,
                updatedAt: createdAt,
                status: ConversationStatus.GENERATING,
                ...(isGhostMode && { ghost: true }),
            })
        );
        dispatch(pushConversationRequest({ id: conversationId }));

        return { conversationId, spaceId };
    };
}

function createMessagePair(
    content: string,
    attachments: Attachment[],
    conversationId: ConversationId,
    lastMessage: Message | undefined,
    date1: string,
    date2: string
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
        blocks: [{ type: 'text', content }],
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
        blocks: [],
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
            console.log('[AssignToSpace] Assigning attachment to space:', {
                id: a.id,
                filename: a.filename,
                spaceId,
                hasMarkdown: !!a.markdown,
                markdownLength: a.markdown?.length,
            });
            dispatch(upsertAttachment({ ...a, spaceId }));
            // Now that the attachment has a spaceId, push it to the server
            dispatch(pushAttachmentRequest({ id: a.id }));
        });
    };
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
        const { conversationId, spaceId } = dispatch(initializeNewSpaceAndConversation(date1));

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

// Helper function to generate personalization prompt from state
export function formatPersonalization(personalization: PersonalizationSettings | undefined): string {
    if (!personalization || !personalization.enableForNewChats) {
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
        const personalityOption = PERSONALITY_OPTIONS.find((p) => p.value === personalization.personality);
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

    return parts.join('\n');
}
