import { useCallback, useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { RemoteParticipant } from '@proton-meet/livekit-client';

import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';

import { useMLSContext } from '../contexts/MLSContext';
import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import { type MeetChatMessage, MeetingSideBars } from '../types';

export const useChat = () => {
    const room = useRoomContext();

    const { setChatMessages, participantNameMap } = useMeetContext();

    const { sideBarState } = useUIStateContext();

    const mls = useMLSContext();

    const isChatOpen = sideBarState[MeetingSideBars.Chat];

    const handleDataReceive = useCallback(
        async (payload: Uint8Array, participant?: RemoteParticipant) => {
            if (!participant || !payload) {
                return;
            }

            try {
                const decodedMessage = JSON.parse(new TextDecoder().decode(payload));

                const decryptedMessage = await mls?.decryptMessage(stringToUint8Array(decodedMessage.message));

                if (!decryptedMessage) {
                    return;
                }

                const sanitizedMessage = sanitizeMessage(decryptedMessage.message);

                const newMessage: MeetChatMessage = {
                    ...decodedMessage,
                    identity: participant.identity,
                    name: participantNameMap[participant.identity] || participant.identity,
                    seen: isChatOpen,
                    message: sanitizedMessage,
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
