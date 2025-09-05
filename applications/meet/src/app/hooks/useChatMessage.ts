import type { ChatMessage } from '@livekit/components-react';
import { useRoomContext } from '@livekit/components-react';

import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';

import { useMLSContext } from '../contexts/MLSContext';
import { useMeetContext } from '../contexts/MeetContext';
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

            const message: ChatMessage = {
                id: `${room.localParticipant.identity}-${Date.now()}`,
                message: uint8ArrayToString(encryptedMessage as Uint8Array<ArrayBuffer>),
                timestamp: Date.now(),
            };

            const encodedMessage = new TextEncoder().encode(JSON.stringify(message));

            await room.localParticipant.publishData(encodedMessage, { reliable: true });

            setChatMessages((prev) => [
                ...prev,
                {
                    ...message,
                    message: trimmedContent,
                    identity: room.localParticipant.identity,
                    name: displayName,
                    seen: true,
                    type: 'message',
                },
            ]);
        } catch (error) {
            console.error('Error sending chat message:', error);
        }
    };

    return sendMessage;
};
