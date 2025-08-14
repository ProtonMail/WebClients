import { c } from 'ttag';

import type { Api } from '@proton/shared/lib/interfaces';

import { generateSpaceKeyBase64 } from '../../crypto';
import { sendMessageWithRedux } from '../../lib/lumo-api-client/integrations/redux';
import type { ContextFilter } from '../../llm';
import { ENABLE_U2L_ENCRYPTION, getFilteredTurns } from '../../llm';
import { flattenAttachmentsForLlm } from '../../llm/attachments';
import { pushAttachmentRequest, upsertAttachment } from '../../redux/slices/core/attachments';
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

// Helper function to determine which files will actually be used in the LLM context
function getContextFilesForMessage(messageChain: Message[], contextFilters: ContextFilter[] = []): AttachmentId[] {
    const contextFiles: AttachmentId[] = [];

    for (const message of messageChain) {
        if (!message.attachments) continue;

        // Check if this message has any context filters
        const filter = contextFilters.find((f) => f.messageId === message.id);

        for (const attachment of message.attachments) {
            // If there's no filter, or the file is not in the excluded list, include it
            if (!filter || !filter.excludedFiles.includes(attachment.filename)) {
                contextFiles.push(attachment.id);
            }
        }
    }

    return contextFiles;
}

// Error handler for sendMessageWithRedux
const createLumoErrorHandler = () => (message: GenerationToFrontendMessage, cId: string) =>
    createGenerationError(getErrorTypeFromMessage(message.type), cId, message);

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

        // Create the new messages (user and assistant)
        const { userMessage, assistantMessage } = createMessagePair(
            newMessageContent,
            attachments,
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
        dispatch(pushMessageRequest({ id: userMessage.id }));

        // Define the sequence of message the assistant will respond to.
        // Obviously this must include the new user message containing the latest request.
        const newLinearChain = [...messageChain, userMessage];

        // Calculate which files will actually be used for the assistant response
        const contextFilesForResponse = getContextFilesForMessage(newLinearChain, contextFilters);

        // Update the assistant message with the context files that will be used
        const assistantMessageWithContext: Message = {
            ...assistantMessage,
            ...(contextFilesForResponse.length > 0 && { contextFiles: contextFilesForResponse }),
        };
        dispatch(addMessage(assistantMessageWithContext));
        dispatch(assignProvisionalAttachmentsToSpace(attachments, spaceId));

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

            await fetchAssistantResponse({
                api,
                dispatch,
                linearChain: newLinearChain,
                spaceId,
                conversationId,
                assistantMessageId: assistantMessageWithContext.id,
                signal,
                enableExternalTools: noAttachment && enableExternalToolsToggled,
                requestTitle: shouldRequestTitle,
                contextFilters,
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
    contextFilters: any[] = []
) {
    return async (dispatch: AppDispatch) => {
        dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.GENERATING }));

        // Calculate which files will actually be used for the regenerated response
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
            const turns = getFilteredTurns(messagesWithContext, contextFilters);
            await dispatch(
                sendMessageWithRedux(api, turns, {
                    messageId: assistantMessageId,
                    conversationId,
                    spaceId,
                    signal,
                    enableExternalTools,
                    config: {
                        enableU2LEncryption: ENABLE_U2L_ENCRYPTION,
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
    requestTitle = false,
    contextFilters = [],
}: {
    api: Api;
    dispatch: AppDispatch;
    linearChain: Message[];
    spaceId: SpaceId;
    conversationId: ConversationId;
    assistantMessageId: string;
    signal: AbortSignal;
    enableExternalTools: boolean;
    requestTitle?: boolean;
    contextFilters?: any[];
}) {
    const turns = getFilteredTurns(linearChain, contextFilters);
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
            },
            errorHandler: createLumoErrorHandler(),
        })
    );
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
