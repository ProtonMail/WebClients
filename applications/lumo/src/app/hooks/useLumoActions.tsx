import { useRef } from 'react';

import useApi from '@proton/components/hooks/useApi';
import type { User } from '@proton/shared/lib/interfaces';

import { useNativeComposerPromptApi } from '../components/Composer/hooks/useNativeComposerPromptApi';
import {
    formatPersonalization,
    generateFakeConversationToShowTierError,
    regenerateMessage,
    retrySendMessage,
    sendMessage,
} from '../components/Conversation/helper';
import type { AesGcmCryptoKey } from '../crypto/types';
import { addContextToMessages, fillAttachmentData, fillOneAttachmentData } from '../llm/attachments';
import { getApproximateTokenCount } from '../llm/tokenizer';
import { SearchService } from '../services/search/searchService';
import { buildLinearChain } from '../messageTree';
import { useGhostChat } from '../providers/GhostChatProvider';
import { useGuestTracking } from '../providers/GuestTrackingProvider';
import { useModelTier } from '../providers/ModelTierProvider';
import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { selectAttachments, selectAttachmentsBySpaceId, selectContextFilters } from '../redux/selectors';
import type { MessageMap } from '../redux/slices/core/messages';
import { addMessage, createDate, newMessageId } from '../redux/slices/core/messages';
import { clearProvisionalAttachments, upsertAttachment } from '../redux/slices/core/attachments';
import type { ConversationError } from '../redux/slices/meta/errors';
import { useActionErrorHandler } from '../services/errors/useActionErrorHandler';
import type { ActionParams, Attachment, ErrorContext, RetryStrategy } from '../types';
import { type ConversationId, type Message, Role, type Space, type SpaceId, getSpaceDek } from '../types';
import { sendMessageGenerationAbortedEvent, sendMessageSendEvent, sendNewMessageDataEvent } from '../util/telemetry';
import { useAbortController } from './useAbortController';
import { useConversationErrors } from './useConversationErrors';
import { useConversationState } from './useConversationState';
import { useLumoFlags } from './useLumoFlags';
import { usePersonalization } from './usePersonalization';
import usePreferredSiblings from './usePreferredSiblings';
import { useTierErrors } from './useTierErrors';

// Constants
const OPERATION_MESSAGES = {
    NO_USER_MESSAGE_FOR_RETRY: 'No user message found for retry',
    NO_PARENT_EXISTS: 'No parent exists',
    NO_PARENT_MESSAGE: 'Message to regenerate has no parent',
    SPACE_ID_REQUIRED: 'Space ID is required for regeneration',
    MISSING_SPACE_OR_CONVERSATION: 'Cannot retry: missing space or conversation ID',
} as const;

interface Props {
    user: User | undefined;
    conversationId: ConversationId;
    space?: Space;
    messageMap: MessageMap;
    provisionalAttachments: Attachment[]; //added attachments that have not been submitted yet and do not have associated messageId
    navigateCallback: (conversationId: ConversationId) => void;
}

export type HandleSendMessage = (newMessage: string, isWebSearchButtonToggled: boolean) => Promise<void>;
export type HandleRegenerateMessage = (
    message: Message,
    isWebSearchButtonToggled: boolean,
    retryStrategy?: RetryStrategy,
    customInstructions?: string
) => Promise<void>;
export type HandleEditMessage = (
    originalMessage: Message,
    newContent: string,
    isWebSearchButtonToggled: boolean
) => Promise<void>;

export const useLumoActions = ({
    user,
    conversationId,
    space,
    messageMap,
    provisionalAttachments,
    navigateCallback,
}: Props) => {
    const dispatch = useLumoDispatch();
    const api = useApi();
    const messageChainRef = useRef<HTMLDivElement | null>(null);
    const { preferredSiblings, preferSibling, getSiblingInfo } = usePreferredSiblings(messageMap);
    const guestTracking = useGuestTracking();
    const { hasConversationErrors, clearErrors } = useConversationErrors(conversationId);
    const { hasTierErrors } = useTierErrors();
    const {
        smoothRendering: ffSmoothRendering,
        externalTools: ffExternalTools,
        imageTools: ffImageTools,
    } = useLumoFlags();
    const contextFilters = useLumoSelector(selectContextFilters);
    const allAttachments = useLumoSelector(selectAttachments);
    const lumoUserSettings = useLumoSelector((state) => state.lumoUserSettings);
    const { handleActionError } = useActionErrorHandler();
    const { personalization } = usePersonalization();
    const attachmentMap = useLumoSelector(selectAttachmentsBySpaceId(space?.id));

    // Custom hooks
    const { isGhostChatMode: isGhostMode } = useGhostChat();
    const { isThinkingEnabled } = useModelTier();
    const { ensureConversationAndSpace } = useConversationState({
        conversationId,
        spaceId: space?.id,
    });
    const {
        ensureAbortController,
        clearAbortController,
        abort: abortOperation,
        isOperationInProgress,
    } = useAbortController();

    const messageChain = buildLinearChain(messageMap, null, preferredSiblings);

    const spaceId = space?.id;

    /**
     * Fill any shallow provisional attachments with content at send time.
     *
     * When a user @mentions a project file, a metadata-only provisional is created immediately
     * (chip in the composer, no content). This function resolves the content just before the
     * message is dispatched, preserving the provisional ID throughout.
     *
     * Lookup order:
     *   1. Redux state   — fastest; content is already in memory if the file was loaded this session.
     *   2. Search index  — fast; works for all indexed local and Drive files.
     *   3. IndexedDB     — fallback for files not yet in the in-memory search index.
     *
     * We search ALL space attachments (not just the current conversation's space) so that
     * project files are found even when the conversation space hasn't been assigned yet
     * (e.g. the very first message in a new project conversation).
     */
    const fillShallowProvisionals = async (
        attachments: Attachment[],
        spaceDek: AesGcmCryptoKey | undefined
    ): Promise<Attachment[]> => {
        const userId = user?.ID;
        const searchService = userId ? SearchService.get(userId) : undefined;

        return Promise.all(
            attachments.map(async (att) => {
                // Skip attachments that already have content or are still downloading.
                if (att.markdown || att.data || att.processing) return att;

                // Find the backing space attachment by filename across ALL space attachments.
                // Using allAttachments (not attachmentMap) ensures project files are found
                // regardless of which space the current conversation belongs to.
                const sourceAtt = Object.values(allAttachments).find(
                    (sa) => sa.spaceId && sa.filename.toLowerCase() === att.filename.toLowerCase()
                );
                if (!sourceAtt) return att;

                // 1. Content already in Redux — use it directly.
                if (sourceAtt.markdown) {
                    return { ...att, markdown: sourceAtt.markdown, tokenCount: sourceAtt.tokenCount };
                }

                // 2. Try the search index (keyed by the source attachment's ID).
                if (searchService) {
                    const doc = searchService.getDocumentById(sourceAtt.id);
                    if (doc?.content) {
                        return {
                            ...att,
                            markdown: doc.content,
                            rawBytes: doc.size || att.rawBytes,
                            tokenCount: getApproximateTokenCount(doc.content),
                        };
                    }
                }

                // 3. Fall back to IndexedDB.
                const filled = await fillOneAttachmentData(sourceAtt, user, spaceDek);
                if (filled.markdown) {
                    return { ...att, markdown: filled.markdown, tokenCount: filled.tokenCount };
                }

                return att;
            })
        );
    };

    // Helper to load and deduplicate attachments from message history
    const loadAttachments = async (
        messages: Message[],
        user: User | undefined,
        spaceDek: AesGcmCryptoKey | undefined
    ): Promise<Attachment[]> => {
        const allAttachments: Attachment[] = [];
        const seenIds = new Set<string>();

        for (const message of messages) {
            if (message.attachments && message.attachments.length > 0) {
                console.log(
                    `Loading attachments for message ${message.id}] (content=${message.content?.slice(50)}`,
                    message.attachments
                );
                // Filter out already-seen attachments to avoid redundant loading
                const unseenAttachments = message.attachments.filter((a) => !seenIds.has(a.id));

                if (unseenAttachments.length > 0) {
                    const filled = await fillAttachmentData(unseenAttachments, attachmentMap, user, spaceDek);
                    allAttachments.push(...filled);

                    // Mark as seen
                    filled.forEach((a) => seenIds.add(a.id));
                }
            }
        }

        console.log('all attachments:', allAttachments);

        return allAttachments;
    };

    const handleSendAction = async (
        actionParams: ActionParams,
        conversationId: ConversationId,
        spaceId: SpaceId,
        spaceDek: AesGcmCryptoKey | undefined,
        signal: AbortSignal
    ) => {
        const { newMessageContent, isWebSearchButtonToggled } = actionParams;
        if (!newMessageContent) return;

        const enableExternalTools = ffExternalTools && isWebSearchButtonToggled;
        const enableImageTools = ffImageTools;
        const enableSmoothing = ffSmoothRendering;

        const messagesWithContext = await addContextToMessages(messageChain, user, spaceDek);
        const historyAttachments = await loadAttachments(messagesWithContext, user, spaceDek);

        // Fill any @mention provisional attachments with content from the search index (or
        // IndexedDB as fallback). Directly-uploaded files already carry their markdown, so
        // this is a no-op for them. The chip IDs are preserved — nothing is re-created.
        const filledAttachments = await fillShallowProvisionals(provisionalAttachments, spaceDek);

        // Write resolved content back to Redux so the attachment chip shows "preview" content
        // when the user clicks it on the sent message.
        for (const att of filledAttachments) {
            if (att.markdown && !provisionalAttachments.find((p) => p.id === att.id)?.markdown) {
                dispatch(upsertAttachment(att));
            }
        }

        const allConversationAttachments = [...historyAttachments, ...filledAttachments];

        await dispatch(
            sendMessage({
                applicationContext: {
                    api,
                    signal,
                },
                newMessageData: {
                    content: newMessageContent,
                    attachments: filledAttachments,
                },
                conversationContext: {
                    spaceId,
                    conversationId,
                    allConversationAttachments,
                    messageChain: messagesWithContext,
                    contextFilters,
                },
                uiContext: {
                    enableExternalTools,
                    enableImageTools,
                    enableReasoning: isThinkingEnabled,
                    navigateCallback,
                    enableSmoothing,
                    isGhostMode,
                },
                settingsContext: {
                    personalization,
                },
            })
        );

        // Clear @mention provisionals now that the message has been sent.
        // Uploaded provisionals (non-mention) were promoted to the space by sendMessage.
        dispatch(clearProvisionalAttachments());

        // Increment guest question count after successful send
        guestTracking?.incrementCount();
    };

    const handleRetryAction = async (
        finalConversationId: ConversationId,
        finalSpaceId: SpaceId,
        spaceDek: AesGcmCryptoKey | undefined,
        signal: AbortSignal,
        isWebSearchButtonToggled: boolean
    ) => {
        // For retry, find the last user message in the conversation and reuse it
        const lastUserMessage = messageChain
            .slice()
            .reverse()
            .find((msg) => msg.role === Role.User);

        if (!lastUserMessage) {
            throw new Error(OPERATION_MESSAGES.NO_USER_MESSAGE_FOR_RETRY);
        }

        const parentMessageChain = buildLinearChain(messageMap, lastUserMessage.parentId, preferredSiblings);
        const messagesWithContext = await addContextToMessages(
            [...parentMessageChain, lastUserMessage],
            user,
            spaceDek
        );

        // Load all attachments from conversation history
        const historyAttachments = await loadAttachments(messagesWithContext, user, spaceDek);

        // Get personalization data for retry from saved user settings (not unsaved Redux state)
        // TODO can I delete this?
        const savedPersonalization = lumoUserSettings?.personalization;
        let personalizationPrompt: string | undefined;

        if (savedPersonalization?.enableForNewChats) {
            personalizationPrompt = formatPersonalization(savedPersonalization);
            console.log('Retry: Generated personalization prompt from saved settings:', personalizationPrompt);
        } else {
            console.log('Retry: Personalization not enabled or no saved personalization data');
        }

        // Get project instructions from space if this is a project conversation
        let projectInstructions: string | undefined;
        if (space?.isProject && space?.projectInstructions) {
            projectInstructions = space.projectInstructions;
        }

        await dispatch(
            retrySendMessage({
                applicationContext: {
                    api,
                    signal,
                },
                conversationContext: {
                    spaceId: finalSpaceId,
                    conversationId: finalConversationId,
                    allConversationAttachments: historyAttachments,
                    messageChain: messagesWithContext,
                    contextFilters,
                },
                projectContext: {
                    isProject: !!space?.isProject,
                    projectInstructions,
                    allAttachments,
                },
                uiContext: {
                    enableExternalTools: isWebSearchButtonToggled && ffExternalTools,
                    enableReasoning: isThinkingEnabled,
                    navigateCallback,
                    isGhostMode,
                    enableSmoothing: ffSmoothRendering,
                    enableImageTools: ffImageTools,
                },
                settingsContext: {
                    personalization,
                },
                retryData: {
                    lastUserMessage,
                },
            })
        );
    };

    const handleEditAction = async (
        actionParams: ActionParams,
        conversationId: ConversationId,
        spaceId: SpaceId,
        originalMessage: Message,
        spaceDek: AesGcmCryptoKey | undefined,
        signal: AbortSignal
    ) => {
        const { newMessageContent, isWebSearchButtonToggled } = actionParams;
        if (!newMessageContent) {
            return;
        }

        const parentMessageChain = buildLinearChain(messageMap, originalMessage.parentId, preferredSiblings);
        const messagesWithContext = await addContextToMessages(parentMessageChain, user, spaceDek);

        // Load all attachments from conversation history and combine with edited message attachments
        const historyAttachments = await loadAttachments(messagesWithContext, user, spaceDek);
        const editedMessageAttachments = await fillAttachmentData(
            originalMessage.attachments ?? [],
            attachmentMap,
            user,
            spaceDek
        );
        const allAttachments = [...historyAttachments, ...editedMessageAttachments];

        await dispatch(
            sendMessage({
                applicationContext: {
                    api,
                    signal,
                },
                newMessageData: {
                    content: newMessageContent,
                    attachments: editedMessageAttachments,
                },
                conversationContext: {
                    spaceId: spaceId,
                    conversationId: conversationId,
                    allConversationAttachments: allAttachments,
                    messageChain: messagesWithContext,
                    contextFilters,
                },
                uiContext: {
                    isEdit: true,
                    updateSibling: preferSibling,
                    enableExternalTools: isWebSearchButtonToggled && ffExternalTools,
                    enableImageTools: ffImageTools,
                    enableReasoning: isThinkingEnabled,
                    navigateCallback,
                    enableSmoothing: ffSmoothRendering,
                    isGhostMode,
                },
                settingsContext: {
                    personalization,
                },
            })
        );

        // Increment guest question count after successful edit
        guestTracking?.incrementCount();
    };

    // Function to add retry instructions based on strategy
    const getRetryInstructions = (strategy: RetryStrategy, customInstructions?: string): string => {
        switch (strategy) {
            case 'try_again':
                return 'Please try again with the same approach.';
            case 'add_details':
                return 'Please provide a more detailed and comprehensive response with additional information, examples, and explanations.';
            case 'more_concise':
                return 'Please provide a shorter, more concise response that focuses on the key points only.';
            case 'think_longer':
                return 'Please take more time to carefully consider your response. Think through the problem step by step and provide a more thoughtful, well-reasoned answer.';
            case 'custom':
                return customInstructions || 'Please improve your response based on the user feedback.';
            case 'simple':
            default:
                return '';
        }
    };

    const handleRegenerateAction = async (
        originalMessage: Message,
        spaceDek: AesGcmCryptoKey | undefined,
        signal: AbortSignal,
        isWebSearchButtonToggled: boolean,
        retryStrategy: RetryStrategy = 'simple',
        customInstructions?: string
    ) => {
        if (!originalMessage.parentId) {
            throw new Error(OPERATION_MESSAGES.NO_PARENT_EXISTS);
        }

        const parentMessage = messageMap[originalMessage.parentId];
        if (!parentMessage) {
            console.warn(OPERATION_MESSAGES.NO_PARENT_MESSAGE);
            return;
        }

        const conversationId = originalMessage.conversationId;
        const parentMessageChain = buildLinearChain(messageMap, originalMessage.parentId, preferredSiblings);
        const messagesWithContext = await addContextToMessages(parentMessageChain, user, spaceDek);
        const retryInstructions = getRetryInstructions(retryStrategy, customInstructions);

        // Load all attachments from conversation history
        const allAttachments = await loadAttachments(messagesWithContext, user, spaceDek);

        // Create a new placeholder assistant message
        const assistantMessageId = newMessageId();
        const assistantMessage: Message = {
            id: assistantMessageId,
            parentId: parentMessage.id,
            createdAt: createDate(),
            content: '',
            role: Role.Assistant,
            placeholder: true,
            conversationId,
        };

        dispatch(addMessage(assistantMessage));

        // Set this message as preferred so it gets displayed instead of its earlier siblings
        preferSibling(assistantMessage);

        const parentMessageHasAttachments = !!parentMessage?.attachments?.length;
        const enableExternalTools = ffExternalTools && isWebSearchButtonToggled && !parentMessageHasAttachments;
        const enableImageTools = ffImageTools;

        if (!spaceId) {
            throw new Error(OPERATION_MESSAGES.SPACE_ID_REQUIRED);
        }

        await dispatch(
            regenerateMessage({
                applicationContext: {
                    api,
                    signal,
                },
                conversationContext: {
                    spaceId,
                    conversationId,
                    allConversationAttachments: allAttachments,
                    messageChain: messagesWithContext,
                    contextFilters,
                },
                uiContext: {
                    enableExternalTools,
                    enableImageTools,
                    enableReasoning: isThinkingEnabled,
                    navigateCallback,
                    isGhostMode,
                    enableSmoothing: ffSmoothRendering,
                },
                settingsContext: {
                    personalization,
                },
                regenerateData: {
                    assistantMessageId,
                    retryInstructions,
                },
            })
        );
    };

    const handleMessageAction = async (actionParams: ActionParams) => {
        const {
            actionType,
            newMessageContent,
            originalMessage,
            retryStrategy = 'simple',
            customRetryInstructions,
        } = actionParams;
        const isWebSearchButtonToggled = actionParams.isWebSearchButtonToggled;

        // Validate input parameters
        if (!validateActionParams(actionParams)) {
            console.warn(`Invalid parameters for action: ${actionType}`);
            return;
        }

        const abortController = ensureAbortController();
        const { signal } = abortController;

        // TODO: test when Jails with weekly limits are updated
        //TODO: check if this code is still needed
        if (hasTierErrors) {
            // if on main page and tier errors exists, generate fake conversation to show tier error
            if (!conversationId) {
                await dispatch(
                    generateFakeConversationToShowTierError({
                        newMessageContent: newMessageContent ?? '',
                        navigateCallback,
                    })
                );
            }
            return;
        }

        if (hasConversationErrors) {
            clearErrors();
        }

        const { conversationId: finalConversationId, spaceId: finalSpaceId } = ensureConversationAndSpace();

        // Create error context with guaranteed conversationId
        const errorContext: ErrorContext = {
            actionType,
            conversationId: finalConversationId,
            actionParams,
        };

        // Send telemetry for user prompt actions
        sendNewMessageDataEvent(
            actionType,
            !conversationId, // isNewConversation when conversationId is undefined
            isWebSearchButtonToggled,
            provisionalAttachments.length > 0,
            isGhostMode
        );

        try {
            const spaceDek = space && (await getSpaceDek(space));

            if (actionType === 'send') {
                await handleSendAction(actionParams, finalConversationId, finalSpaceId, spaceDek, signal);
            }
            if (actionType === 'edit') {
                await handleEditAction(
                    actionParams,
                    finalConversationId,
                    finalSpaceId,
                    originalMessage!,
                    spaceDek,
                    signal
                );
            }
            if (actionType === 'regenerate') {
                await handleRegenerateAction(
                    originalMessage!,
                    spaceDek,
                    signal,
                    isWebSearchButtonToggled,
                    retryStrategy,
                    customRetryInstructions
                );
            }
        } catch (error: any) {
            handleActionError(error, errorContext);
        } finally {
            clearAbortController();
        }
    };

    const handleSendMessage: HandleSendMessage = async (messageContent: string, isWebSearchButtonToggled: boolean) => {
        // send telemetry for send message
        sendMessageSendEvent();

        return handleMessageAction({
            actionType: 'send',
            newMessageContent: messageContent,
            isWebSearchButtonToggled,
        });
    };

    const handleRegenerateMessage: HandleRegenerateMessage = async (
        message: Message,
        isWebSearchButtonToggled: boolean,
        retryStrategy = 'simple',
        customInstructions?: string
    ) => {
        if (!message || isOperationInProgress()) {
            return;
        }
        return handleMessageAction({
            actionType: 'regenerate',
            originalMessage: message,
            isWebSearchButtonToggled,
            retryStrategy,
            customRetryInstructions: customInstructions,
        });
    };

    const handleEditMessage: HandleEditMessage = async (
        originalMessage: Message,
        newContent: string,
        isWebSearchButtonToggled: boolean
    ) => {
        if (!newContent || isOperationInProgress()) {
            return;
        }
        return handleMessageAction({
            actionType: 'edit',
            newMessageContent: newContent,
            originalMessage,
            isWebSearchButtonToggled,
        });
    };

    const handleAbort = () => {
        if (isOperationInProgress()) {
            // send telemetry for generation aborted
            sendMessageGenerationAbortedEvent();
            abortOperation();
        }
    };

    useNativeComposerPromptApi(handleSendMessage, handleAbort);

    // For retry actions initiated in ErrorCard component due to generation errors
    const handleRetryGeneration = async (error: ConversationError) => {
        if (!error.actionParams || isOperationInProgress()) return;

        if (error.actionParams.actionType === 'send') {
            // Reuse the existing retry action logic
            try {
                const spaceDek = space && (await getSpaceDek(space));
                const finalConversationId = error.conversationId;
                const finalSpaceId = spaceId;

                if (!finalSpaceId || !finalConversationId) {
                    console.warn(OPERATION_MESSAGES.MISSING_SPACE_OR_CONVERSATION);
                    return;
                }

                const abortController = ensureAbortController();
                const { signal } = abortController;

                await handleRetryAction(
                    finalConversationId,
                    finalSpaceId,
                    spaceDek,
                    signal,
                    error.actionParams.isWebSearchButtonToggled
                );
            } catch (retryError) {
                const errorContext: ErrorContext = {
                    actionType: 'send',
                    conversationId: error.conversationId,
                    actionParams: error.actionParams,
                };
                handleActionError(retryError, errorContext);
            } finally {
                clearAbortController();
            }
        } else {
            // For non-send actions, fall back to the original message action logic
            return handleMessageAction(error.actionParams);
        }
    };

    const validateActionParams = (actionParams: ActionParams): boolean => {
        const { actionType, newMessageContent, originalMessage } = actionParams;

        switch (actionType) {
            case 'send':
                return !!newMessageContent?.trim();
            case 'edit':
                return !!(originalMessage && newMessageContent?.trim());
            case 'regenerate':
                return !!originalMessage;
            default:
                return false;
        }
    };

    return {
        messageChain,
        preferredSiblings,
        preferSibling,
        getSiblingInfo,
        handleRegenerateMessage,
        handleSendMessage,
        handleEditMessage,
        handleAbort,
        messageChainRef,
        handleRetryGeneration,
    };
};
