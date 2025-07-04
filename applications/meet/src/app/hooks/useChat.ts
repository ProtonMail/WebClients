import { useCallback, useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { RemoteParticipant } from 'livekit-client';

import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import { type MeetChatMessage, MeetingSideBars } from '../types';

export const useChat = () => {
    const room = useRoomContext();

    const { setChatMessages, participantNameMap } = useMeetContext();

    const { sideBarState } = useUIStateContext();

    const isChatOpen = sideBarState[MeetingSideBars.Chat];

    const handleDataReceive = useCallback(
        (payload: Uint8Array, participant?: RemoteParticipant) => {
            if (!participant || !payload) {
                return;
            }

            try {
                const decodedMessage = JSON.parse(new TextDecoder().decode(payload));
                const newMessage: MeetChatMessage = {
                    ...decodedMessage,
                    identity: participant.identity,
                    name: participantNameMap[participant.identity] || participant.identity,
                    seen: isChatOpen,
                };

                setChatMessages((prev) => [...prev, newMessage]);
            } catch (error) {
                console.error('Error handling chat message:', error);
            }
        },
        [isChatOpen, participantNameMap]
    );

    useEffect(() => {
        if (!room) {
            return;
        }

        room.on('dataReceived', handleDataReceive);

        return () => {
            room.off('dataReceived', handleDataReceive);
        };
    }, [room, handleDataReceive]);
};
