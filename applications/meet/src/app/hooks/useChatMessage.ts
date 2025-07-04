import { useCallback } from 'react';

import type { ChatMessage } from '@livekit/components-react';
import { useRoomContext } from '@livekit/components-react';

import { useMeetContext } from '../contexts/MeetContext';
import { trimMessage } from '../utils/trim-message';

export const useChatMessage = () => {
    const room = useRoomContext();
    const { setChatMessages } = useMeetContext();

    const { participantNameMap } = useMeetContext();

    const sendMessage = useCallback(
        async (content: string) => {
            const trimmedContent = trimMessage(content);

            if (!room || !trimmedContent) {
                return;
            }

            try {
                const message: ChatMessage = {
                    id: `${room.localParticipant.identity}-${Date.now()}`,
                    message: trimmedContent,
                    timestamp: Date.now(),
                };

                const encodedMessage = new TextEncoder().encode(JSON.stringify(message));

                await room.localParticipant.publishData(encodedMessage, { reliable: true });

                setChatMessages((prev) => [
                    ...prev,
                    {
                        ...message,
                        identity: room.localParticipant.identity,
                        name: participantNameMap[room.localParticipant.identity] || room.localParticipant.identity,
                        seen: true,
                        type: 'message',
                    },
                ]);
            } catch (error) {
                console.error('Error sending chat message:', error);
            }
        },
        [room, participantNameMap]
    );

    return sendMessage;
};
