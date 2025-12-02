import type { ChatMessage } from '@livekit/components-react';
import { useRoomContext } from '@livekit/components-react';

import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';

import { useMLSContext } from '../contexts/MLSContext';
import { useMeetContext } from '../contexts/MeetContext';
import { PublishableDataTypes } from '../types';
import { trimMessage } from '../utils/trim-message';

export const useChatMessage = () => {
    const room = useRoomContext();
    const { setChatMessages } = useMeetContext();

    const { displayName } = useMeetContext();

    const mls = useMLSContext();

    const sendMessage = async (content: string) => {
        const trimmedContent = trimMessage(content);
        const sanitizedContent = sanitizeMessage(trimmedContent);

        if (!room || !sanitizedContent) {
            return;
        }

        try {
            const encryptedMessage = await mls?.encryptMessage(sanitizedContent);

            const message: ChatMessage & { type: PublishableDataTypes.Message } = {
                id: `${room.localParticipant.identity}-${Date.now()}`,
                message: uint8ArrayToString(encryptedMessage as Uint8Array<ArrayBuffer>),
                timestamp: Date.now(),
                type: PublishableDataTypes.Message,
            };

            const encodedMessage = new TextEncoder().encode(JSON.stringify({ messageType: 'chat', ...message }));

            await room.localParticipant.publishData(encodedMessage, { reliable: true });

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
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error sending chat message:', error);
        }
    };

    return sendMessage;
};
