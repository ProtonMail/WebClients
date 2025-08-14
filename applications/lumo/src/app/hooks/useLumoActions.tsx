import { useRef } from 'react';

import useApi from '@proton/components/hooks/useApi';
import type { User } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';

import { addContextToMessages, fillAttachmentData } from '../llm/attachments';
import { buildLinearChain } from '../messageTree';
import { useGhostChat } from '../providers/GhostChatProvider';
import { useGuestTracking } from '../providers/GuestTrackingProvider';
import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { selectContextFilters } from '../redux/selectors';
import type { MessageMap } from '../redux/slices/core/messages';
import { addMessage, createDate, newMessageId } from '../redux/slices/core/messages';
import type { ConversationError } from '../redux/slices/meta/errors';
import { useActionErrorHandler } from '../services/errors/useActionErrorHandler';
import type { Attachment } from '../types';
import { type ConversationId, type Message, Role, type Space, type SpaceId, getSpaceDek } from '../types';
import type { ActionParams, ErrorContext } from '../types-api';
import {
    generateFakeConversationToShowTierError,
    regenerateMessage,
    retrySendMessage,
    sendMessage,
} from '../ui/interactiveConversation/helper';
import { sendMessageGenerationAbortedEvent, sendMessageSendEvent, sendNewMessageDataEvent } from '../util/telemetry';
import { useAbortController } from './useAbortController';
import { useConversationErrors } from './useConversationErrors';
import { useConversationState } from './useConversationState';
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

export type HandleSendMessage = (newMessage: string, enableExternalTools: boolean) => Promise<void>;
export type HandleRegenerateMessage = (message: Message, isWebSearchButtonToggled: boolean) => Promise<void>;
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
    const isLumoToolingEnabled = useFlag('LumoTooling');
    const contextFilters = useLumoSelector(selectContextFilters);
    const { handleActionError } = useActionErrorHandler();

    // Custom hooks
    const { isGhostChatMode } = useGhostChat();
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

    const handleSendAction = async (
        actionParams: ActionParams,
        finalConversationId: ConversationId,
        finalSpaceId: SpaceId,
        spaceDek: any,
        signal: AbortSignal,
        datePair?: [string, string]
    ) => {
        const { newMessageContent, isWebSearchButtonToggled } = actionParams;

        if (!newMessageContent) {
            return;
        }

        const messagesWithContext = await addContextToMessages(messageChain, user, spaceDek);

        await dispatch(
            sendMessage({
                api,
                newMessageContent,
                attachments: provisionalAttachments,
                messageChain: messagesWithContext,
                conversationId: finalConversationId,
                spaceId: finalSpaceId,
                signal,
                navigateCallback,
                enableExternalToolsToggled: !!isWebSearchButtonToggled && isLumoToolingEnabled,
                contextFilters,
                datePair,
            })
        );

        // Increment guest question count after successful send
        guestTracking?.incrementCount();
    };

    const handleRetryAction = async (
        finalConversationId: ConversationId,
        finalSpaceId: SpaceId,
        spaceDek: any,
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

        await retrySendMessage({
            api,
            dispatch,
            lastUserMessage,
            messageChain: messagesWithContext,
            spaceId: finalSpaceId,
            conversationId: finalConversationId,
            signal,
            enableExternalTools: isWebSearchButtonToggled && isLumoToolingEnabled,
            contextFilters,
        });
    };

    const handleEditAction = async (
        actionParams: ActionParams,
        originalMessage: Message,
        spaceDek: any,
        signal: AbortSignal,
        isWebSearchButtonToggled: boolean
    ) => {
        const { newMessageContent } = actionParams;
        if (!newMessageContent) {
            return;
        }

        const parentMessageChain = buildLinearChain(messageMap, originalMessage.parentId, preferredSiblings);
        const conversationId = originalMessage.conversationId;
        const messagesWithContext = await addContextToMessages(parentMessageChain, user, spaceDek);
        const attachments = await fillAttachmentData(originalMessage.attachments ?? [], user, spaceDek);

        await dispatch(
            sendMessage({
                api,
                newMessageContent,
                attachments,
                messageChain: messagesWithContext,
                conversationId,
                spaceId,
                signal,
                navigateCallback,
                isEdit: true,
                updateSibling: preferSibling,
                enableExternalToolsToggled: isWebSearchButtonToggled && isLumoToolingEnabled,
                contextFilters,
            })
        );

        // Increment guest question count after successful edit
        guestTracking?.incrementCount();
    };

    const handleRegenerateAction = async (
        originalMessage: Message,
        spaceDek: any,
        signal: AbortSignal,
        isWebSearchButtonToggled: boolean
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
        const enableExternalTools = isWebSearchButtonToggled && !parentMessageHasAttachments && isLumoToolingEnabled;

        if (!spaceId) {
            throw new Error(OPERATION_MESSAGES.SPACE_ID_REQUIRED);
        }

        await dispatch(
            regenerateMessage(
                api,
                spaceId,
                conversationId,
                assistantMessageId,
                messagesWithContext,
                signal,
                enableExternalTools,
                contextFilters
            )
        );
    };

    const handleMessageAction = async (actionParams: ActionParams) => {
        const { actionType, newMessageContent, originalMessage } = actionParams;
        const isWebSearchButtonToggled = !!actionParams.isWebSearchButtonToggled;

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

        const {
            conversationId: finalConversationId,
            spaceId: finalSpaceId,
            datePair,
        } = ensureConversationAndSpace(conversationId, spaceId);

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
            isGhostChatMode
        );

        try {
            const spaceDek = space && (await getSpaceDek(space));

            if (actionType === 'send') {
                await handleSendAction(actionParams, finalConversationId, finalSpaceId, spaceDek, signal, datePair);
            }
            if (actionType === 'edit') {
                await handleEditAction(actionParams, originalMessage!, spaceDek, signal, isWebSearchButtonToggled);
            }
            if (actionType === 'regenerate') {
                await handleRegenerateAction(originalMessage!, spaceDek, signal, isWebSearchButtonToggled);
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
        isWebSearchButtonToggled: boolean
    ) => {
        if (!message || isOperationInProgress()) {
            return;
        }
        return handleMessageAction({
            actionType: 'regenerate',
            originalMessage: message,
            isWebSearchButtonToggled,
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
                    !!error.actionParams.isWebSearchButtonToggled
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
