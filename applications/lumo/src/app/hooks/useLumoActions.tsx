import { useRef } from 'react';

import useApi from '@proton/components/hooks/useApi';
import type { User } from '@proton/shared/lib/interfaces';

import {
    formatPersonalization,
    regenerateMessage,
    retrySendMessage,
    sendMessage,
} from '../components/Conversation/helper';
import type { AesGcmCryptoKey } from '../crypto/types';
import { useLumoPlan } from '../hooks/useLumoPlan';
import { addContextToMessages, fillAttachmentData } from '../llm/attachments';
import { buildLinearChain } from '../messageTree';
import { useGhostChat } from '../providers/GhostChatProvider';
import { useModelTier } from '../providers/ModelTierProvider';
import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import {
    selectAttachments,
    selectAttachmentsBySpaceId,
    selectContextFilters,
    selectMessageAttachmentIds,
} from '../redux/selectors';
import { clearProvisionalAttachments, upsertAttachment } from '../redux/slices/core/attachments';
import type { MessageMap } from '../redux/slices/core/messages';
import { addMessage, createDate, newMessageId } from '../redux/slices/core/messages';
import type { ConversationError } from '../redux/slices/meta/errors';
import { useActionErrorHandler } from '../services/errors/useActionErrorHandler';
import { OPERATION_IN_PROGRESS_MESSAGE, generationRegistry } from '../services/generation/generationRegistry';
import { SearchService } from '../services/search/searchService';
import type { ActionParams, Attachment, ErrorContext, ImageGenerationOptions, RetryStrategy } from '../types';
import { type ConversationId, type Message, Role, type Space, type SpaceId, getSpaceDek } from '../types';
import {
    fillAttachmentFromSearchIndex,
    refreshAttachmentFromSearchIndex,
    resolveReferencedFilesForSend,
} from '../util/resolveProjectFiles';
import { sendMessageGenerationAbortedEvent, sendMessageSendEvent, sendNewMessageDataEvent } from '../util/telemetry';
import { useChatLimitGate } from './useChatLimitGate';
import { useConversationErrors } from './useConversationErrors';
import { useConversationState } from './useConversationState';
import { useLumoFlags } from './useLumoFlags';
import { usePersonalization } from './usePersonalization';
import usePreferredSiblings from './usePreferredSiblings';

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

export type HandleSendMessage = (
    newMessage: string,
    isWebSearchButtonToggled: boolean,
    imageOptions?: ImageGenerationOptions
) => Promise<void>;
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
    const { hasConversationErrors, clearErrors } = useConversationErrors(conversationId);
    const { isBlocked: isChatLimitBlocked, ensureTierError } = useChatLimitGate();
    const {
        smoothRendering: ffSmoothRendering,
        externalTools: ffExternalTools,
        imageTools: ffImageTools,
        memory: ffMemory,
        visualizationInstructions: ffVisualizationInstructions,
    } = useLumoFlags();
    const contextFilters = useLumoSelector(selectContextFilters);
    const allAttachments = useLumoSelector(selectAttachments);
    const messageAttachmentIds = useLumoSelector(selectMessageAttachmentIds);
    const lumoUserSettings = useLumoSelector((state) => state.lumoUserSettings);
    const { handleActionError } = useActionErrorHandler();
    const { personalization } = usePersonalization();
    const attachmentMap = useLumoSelector(selectAttachmentsBySpaceId(space?.id));

    // Custom hooks
    const { isGhostChatMode: isGhostMode } = useGhostChat();
    const { hasLumoPlus } = useLumoPlan();
    const { isThinkingEnabled, modelTier } = useModelTier();
    const { ensureConversationAndSpace } = useConversationState({
        conversationId,
        spaceId: space?.id,
    });
    // Generation lifecycle is owned by an app-level registry (keyed by conversation id) rather
    // than by this component. This lets an in-flight generation survive navigation/unmount; it is
    // only cancelled on an explicit user stop. "In progress" is scoped to the current conversation.
    const isOperationInProgress = () => !!conversationId && generationRegistry.isInProgress(conversationId);

    const messageChain = buildLinearChain(messageMap, null, preferredSiblings);

    const spaceId = space?.id;

    /**
     * Fill shallow provisional attachments from the search index at send time.
     * Content for all indexed files (local and Drive) is resolved through the index.
     */
    const fillShallowProvisionals = async (
        attachments: Attachment[],
        messageContent: string,
        projectSpaceId?: SpaceId
    ): Promise<Attachment[]> => {
        const userId = user?.ID;
        if (!userId) {
            return attachments;
        }

        const searchService = SearchService.get(userId);
        await searchService.ensureManifestReady();

        return attachments.map((att) =>
            fillAttachmentFromSearchIndex(att, searchService, projectSpaceId, messageContent)
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
                    const filled = await fillAttachmentData(
                        unseenAttachments,
                        attachmentMap,
                        user,
                        spaceDek,
                        space?.id
                    );
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
        const { newMessageContent, isWebSearchButtonToggled, imageOptions } = actionParams;
        if (!newMessageContent?.trim() && provisionalAttachments.length === 0) return;

        const enableExternalTools = ffExternalTools && isWebSearchButtonToggled;
        const enableImageTools = ffImageTools;
        const enableSmoothing = ffSmoothRendering;

        const messagesWithContext = await addContextToMessages(messageChain, user, spaceDek);
        const historyAttachments = await loadAttachments(messagesWithContext, user, spaceDek);

        // Fill @mention provisional attachments from the search index.
        let filledAttachments = await fillShallowProvisionals(provisionalAttachments, newMessageContent ?? '', spaceId);

        // Refresh from the live search index and resolve text-only @mentions.
        if (user?.ID) {
            const searchService = SearchService.get(user.ID);
            await searchService.ensureManifestReady();
            filledAttachments = filledAttachments.map((att) =>
                refreshAttachmentFromSearchIndex(att, searchService, spaceId, newMessageContent ?? '')
            );
            const referencedAttachments = await resolveReferencedFilesForSend(
                newMessageContent ?? '',
                filledAttachments,
                user.ID,
                spaceId,
                historyAttachments
            );
            if (referencedAttachments.length > 0) {
                filledAttachments = [...filledAttachments, ...referencedAttachments];
            }
        }

        // Write resolved content back to Redux so the attachment chip shows "preview" content
        // when the user clicks it on the sent message. Mark sent @mention files so they survive
        // clearProvisionalAttachments.
        for (const att of filledAttachments) {
            const wasProvisional = provisionalAttachments.find((p) => p.id === att.id);
            const needsPersist =
                att.markdown && (!wasProvisional?.markdown || att.conversationContext || att.driveNodeId);
            if (needsPersist) {
                dispatch(
                    upsertAttachment({
                        ...att,
                        conversationContext: att.conversationContext ?? !att.spaceId,
                    })
                );
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
                    content: newMessageContent ?? '',
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
                    modelTier,
                    navigateCallback,
                    enableSmoothing,
                    isGhostMode,
                    imageAspectRatio: imageOptions?.aspectRatio,
                },
                settingsContext: {
                    personalization,
                    isMemoryFeatureEnabled: ffMemory,
                    hasLumoPlus,
                    isVisualizationInstructionsFeatureEnabled: ffVisualizationInstructions,
                },
            })
        );

        // Clear composer provisionals now that the message has been sent.
        // Preserve attachments bound to messages (e.g. @mentioned Drive files).
        dispatch(
            clearProvisionalAttachments({
                preserveIds: [...messageAttachmentIds, ...filledAttachments.map((a) => a.id)],
            })
        );
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
                    // Pin the freshly created assistant message so the regenerated answer is the
                    // one displayed. Without this, the new assistant is added as a hidden sibling
                    // of the failed attempt and the retry does nothing.
                    updateSibling: preferSibling,
                    enableExternalTools: isWebSearchButtonToggled && ffExternalTools,
                    enableReasoning: isThinkingEnabled,
                    modelTier,
                    navigateCallback,
                    isGhostMode,
                    enableSmoothing: ffSmoothRendering,
                    enableImageTools: ffImageTools,
                },
                settingsContext: {
                    personalization,
                    isVisualizationInstructionsFeatureEnabled: ffVisualizationInstructions,
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
            spaceDek,
            space?.id
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
                    modelTier,
                    navigateCallback,
                    enableSmoothing: ffSmoothRendering,
                    isGhostMode,
                },
                settingsContext: {
                    personalization,
                    isVisualizationInstructionsFeatureEnabled: ffVisualizationInstructions,
                },
            })
        );
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

        const enableExternalTools = ffExternalTools && isWebSearchButtonToggled;
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
                    modelTier,
                    navigateCallback,
                    isGhostMode,
                    enableSmoothing: ffSmoothRendering,
                },
                settingsContext: {
                    personalization,
                    isVisualizationInstructionsFeatureEnabled: ffVisualizationInstructions,
                },
                regenerateData: {
                    assistantMessageId,
                    retryInstructions,
                },
            })
        );
    };

    const handleMessageAction = async (actionParams: ActionParams) => {
        const { actionType, originalMessage, retryStrategy = 'simple', customRetryInstructions } = actionParams;
        const isWebSearchButtonToggled = actionParams.isWebSearchButtonToggled;

        // Validate input parameters
        if (!validateActionParams(actionParams)) {
            console.warn(`Invalid parameters for action: ${actionType}`);
            return;
        }

        if (isChatLimitBlocked) {
            ensureTierError();
            return;
        }

        if (hasConversationErrors) {
            clearErrors();
        }

        const ensuredConversation = ensureConversationAndSpace();
        if (!ensuredConversation) {
            return;
        }

        const { conversationId: finalConversationId, spaceId: finalSpaceId } = ensuredConversation;

        // Register the generation in the app-level registry, keyed by the final conversation id.
        // This must happen after the conversation exists so abort/stop and the in-progress guard
        // resolve to the right conversation, and so the generation outlives this component.
        let abortController: AbortController;
        try {
            abortController = generationRegistry.start(finalConversationId);
        } catch (error: any) {
            if (error?.message === OPERATION_IN_PROGRESS_MESSAGE) {
                return;
            }
            throw error;
        }
        const { signal } = abortController;

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
            generationRegistry.finish(finalConversationId);
        }
    };

    const handleSendMessage: HandleSendMessage = async (
        messageContent: string,
        isWebSearchButtonToggled: boolean,
        imageOptions?: ImageGenerationOptions
    ) => {
        sendMessageSendEvent();

        return handleMessageAction({
            actionType: 'send',
            newMessageContent: messageContent,
            isWebSearchButtonToggled,
            imageOptions,
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
        if (conversationId && isOperationInProgress()) {
            // send telemetry for generation aborted
            sendMessageGenerationAbortedEvent();
            generationRegistry.abort(conversationId);
        }
    };

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

                const abortController = generationRegistry.start(finalConversationId);
                const { signal } = abortController;

                try {
                    await handleRetryAction(
                        finalConversationId,
                        finalSpaceId,
                        spaceDek,
                        signal,
                        error.actionParams.isWebSearchButtonToggled
                    );
                } finally {
                    generationRegistry.finish(finalConversationId);
                }
            } catch (retryError) {
                const errorContext: ErrorContext = {
                    actionType: 'send',
                    conversationId: error.conversationId,
                    actionParams: error.actionParams,
                };
                handleActionError(retryError, errorContext);
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
                return !!newMessageContent?.trim() || provisionalAttachments.length > 0;
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
