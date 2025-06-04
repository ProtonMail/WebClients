import { useCallback } from 'react';

import type { ChatMessage } from '@livekit/components-react';
import { useRoomContext } from '@livekit/components-react';

import { useMeetContext } from '../contexts/MeetContext';

export const useChatMessage = () => {
    const room = useRoomContext();
    const { setChatMessages } = useMeetContext();

    const sendMessage = useCallback(
        async (content: string) => {
            if (!room || !content.trim()) {
                return;
            }

            try {
                const message: ChatMessage = {
                    id: `${room.localParticipant.identity}-${Date.now()}`,
                    message: content.trim(),
                    timestamp: Date.now(),
                };

                const encodedMessage = new TextEncoder().encode(JSON.stringify(message));

                await room.localParticipant.publishData(encodedMessage, { reliable: true });

                setChatMessages((prev) => [
                    ...prev,
                    {
                        ...message,
                        identity: room.localParticipant.identity,
                        name: room.localParticipant.name || room.localParticipant.identity,
                        seen: true,
                        type: 'message',
                    },
                ]);
            } catch (error) {
                console.error('Error sending chat message:', error);
            }
        },
        [room]
    );

    return sendMessage;
};
