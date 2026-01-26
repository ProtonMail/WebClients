import type { ChatMessage } from '@livekit/components-react';
import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { escape, unescape } from '@proton/shared/lib/sanitize/escape';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';

import { useMLSContext } from '../contexts/MLSContext';
import { useMeetContext } from '../contexts/MeetContext';
import { PublishableDataTypes } from '../types';
import { trimMessage } from '../utils/trim-message';

export const useChatMessage = () => {
    const room = useRoomContext();
    const { setChatMessages } = useMeetContext();

    const reportMeetError = useMeetErrorReporting();

    const { displayName } = useMeetContext();

    const notifications = useNotifications();

    const mls = useMLSContext();

    const handleError = (errorCause: string) => {
        reportMeetError('Failed to send chat message', {
            level: 'error',
            context: {
                errorCause,
            },
        });

        notifications.createNotification({
            type: 'error',
            text: c('Error').t`Failed to send chat message. Please try again.`,
        });
    };

    const sendMessage = async (content: string) => {
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

        try {
            let encryptedMessage: Uint8Array<ArrayBuffer> | undefined;

            try {
                encryptedMessage = (await mls?.encryptMessage(sanitizedContent)) as Uint8Array<ArrayBuffer>;
            } catch (error) {
                handleError('Failed to encrypt chat message');
                return false;
            }

            const message: ChatMessage & { type: PublishableDataTypes.Message } = {
                id: `${room.localParticipant.identity}-${Date.now()}`,
                message: uint8ArrayToString(encryptedMessage as Uint8Array<ArrayBuffer>),
                timestamp: Date.now(),
                type: PublishableDataTypes.Message,
            };

            const encodedMessage = new TextEncoder().encode(JSON.stringify({ messageType: 'chat', ...message }));

            try {
                await room.localParticipant.publishData(encodedMessage, { reliable: true });
            } catch (error) {
                handleError('Failed to send chat message');

                return false;
            }

            setChatMessages((prev) => [
                ...prev,
                {
                    ...message,
                    message: sanitizedContent,
                    identity: room.localParticipant.identity,
                    name: displayName,
                    seen: true,
                    type: 'message',
                },
            ]);

            return true;
        } catch (error) {
            handleError('Unknown error');
            return false;
        }
    };

    return sendMessage;
};
