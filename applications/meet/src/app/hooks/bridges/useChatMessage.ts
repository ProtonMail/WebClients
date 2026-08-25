import type { ChatMessage } from '@livekit/components-react';
import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import {
    addChatMessages,
    removeChatMessage,
    updateChatMessageStatus,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import type { MeetChatMessage } from '@proton/meet/types/types';
import { escape, unescape } from '@proton/sanitize/escape';
import { sanitizeMessage } from '@proton/sanitize/purify';
import { uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';
import { useFlag } from '@proton/unleash/useFlag';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { PublishableDataTypes } from '../../types';
import { retry } from '../../utils/retry';
import { trimMessage } from '../../utils/trim-message';

export interface ReplyOptions {
    /** Id of the message being replied to. */
    replyToId?: string;
    /** Id of the thread/topic the reply belongs to. */
    topicId?: string;
}

export const useChatMessage = () => {
    const room = useRoomContext();

    const dispatch = useMeetDispatch();

    const { reportMeetError } = useMeetErrorReporting();

    const notifications = useNotifications();

    const meetCoreClient = useMeetCoreClient();

    const isNewChatHandling = useFlag('MeetNewChatHandling');

    const getErrorDetails = (error: unknown): Record<string, unknown> => {
        if (error instanceof Error) {
            return {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
            };
        }

        if (typeof error === 'string') {
            return { errorMessage: error };
        }

        return { errorType: typeof error };
    };

    const handleError = (errorCause: string, error?: unknown) => {
        reportMeetError('Failed to send chat message', {
            level: 'error',
            context: {
                errorCause,
                ...(error !== undefined ? getErrorDetails(error) : {}),
            },
        });

        notifications.createNotification({
            type: 'error',
            text: c('Error').t`Failed to send chat message. Please try again.`,
        });
    };

    const sendMessageNew = async (sanitizedContent: string, replyOptions?: ReplyOptions) => {
        // Tracks the optimistic entry so it can be moved to a terminal state if anything throws
        // after it was added, preventing a message from being orphaned in the "pending" state.
        let pendingMessageId: string | undefined;

        try {
            const { payload, local_echo: localEcho } = await meetCoreClient.composeChatMessage(
                sanitizedContent,
                replyOptions?.replyToId,
                replyOptions?.topicId
            );

            // The compose step is a local (non-network) operation and determines the id that
            // remote participants will use to reference this message (e.g. for replies/reactions),
            // so the optimistic "pending" entry is added only once it's available.
            pendingMessageId = localEcho.id;
            dispatch(
                addChatMessages([
                    {
                        id: localEcho.id,
                        message: escape(localEcho.text ?? ''),
                        timestamp: Number(localEcho.received_at_ms),
                        identity: room.localParticipant.identity,
                        seen: true,
                        type: 'message',
                        inReplyToId: localEcho.in_reply_to_id ?? replyOptions?.replyToId,
                        topicId: localEcho.topic_id ?? replyOptions?.topicId,
                        status: 'pending',
                    },
                ])
            );

            const published = await retry(
                async () => {
                    await room.localParticipant.publishData(payload, { reliable: true });
                    return true;
                },
                { stopAfterFirstSuccess: true }
            );

            if (published) {
                dispatch(updateChatMessageStatus({ messageId: localEcho.id, status: 'sent' }));
            } else {
                reportMeetError('Failed to send chat message', {
                    level: 'error',
                    context: { errorCause: 'Failed to send chat message' },
                });
                dispatch(updateChatMessageStatus({ messageId: localEcho.id, status: 'failed' }));
            }

            return true;
        } catch (error) {
            // If the optimistic entry was already added, move it to "failed" so it never remains
            // stuck as "pending" (and the user can retry/discard it) instead of being orphaned.
            if (pendingMessageId) {
                dispatch(updateChatMessageStatus({ messageId: pendingMessageId, status: 'failed' }));
            }
            handleError('Unknown error', error);
            return false;
        }
    };

    const sendMessageLegacy = async (sanitizedContent: string) => {
        try {
            let encryptedMessage: Uint8Array<ArrayBuffer> | undefined;

            try {
                encryptedMessage = await meetCoreClient.encryptMessage(sanitizedContent);
            } catch (error) {
                handleError('Failed to encrypt chat message', error);
                return false;
            }

            const message: ChatMessage & { type: PublishableDataTypes.Message } = {
                id: `${room.localParticipant.identity}-${Date.now()}`,
                message: uint8ArrayToBinaryString(encryptedMessage),
                timestamp: Date.now(),
                type: PublishableDataTypes.Message,
            };

            const encodedMessage = new TextEncoder().encode(JSON.stringify({ messageType: 'chat', ...message }));

            try {
                await room.localParticipant.publishData(encodedMessage, { reliable: true });
            } catch (error) {
                handleError('Failed to send chat message', error);

                return false;
            }

            dispatch(
                addChatMessages([
                    {
                        ...message,
                        // Store inert (escaped) like the receive path so the display's single decode
                        // restores the typed text (e.g. `&amp;`), instead of collapsing it to `&`.
                        message: escape(sanitizedContent),
                        identity: room.localParticipant.identity,
                        seen: true,
                        type: 'message',
                    },
                ])
            );

            return true;
        } catch (error) {
            handleError('Unknown error', error);
            return false;
        }
    };

    const sendMessage = async (content: string, replyOptions?: ReplyOptions) => {
        const trimmedContent = trimMessage(content);
        // Escape HTML entities before sanitization to preserve plain text like "<test"
        // This prevents DOMPurify from treating incomplete tags as HTML and removing them.
        // After sanitization, unescape to restore the original text for display.
        // Security note: Unescaping is safe here because:
        // 1. DOMPurify has already sanitized the escaped content, removing any dangerous HTML
        // 2. The message is rendered as plain text in React (which auto-escapes HTML)
        // 3. We only unescape content that DOMPurify allowed through as safe text
        const escapedContent = escape(trimmedContent);
        const sanitizedEscapedContent = sanitizeMessage(escapedContent);
        const sanitizedContent = unescape(sanitizedEscapedContent);

        if (!room || !sanitizedContent) {
            return false;
        }

        // Replies are only supported by the new chat handling path; the legacy path ignores them.
        return isNewChatHandling ? sendMessageNew(sanitizedContent, replyOptions) : sendMessageLegacy(sanitizedContent);
    };

    const retryMessage = async (message: MeetChatMessage) => {
        dispatch(removeChatMessage({ messageId: message.id }));

        return sendMessage(message.message, {
            replyToId: message.inReplyToId,
            topicId: message.topicId,
        });
    };

    const discardMessage = (messageId: string) => {
        dispatch(removeChatMessage({ messageId }));
    };

    return { sendMessage, retryMessage, discardMessage };
};
