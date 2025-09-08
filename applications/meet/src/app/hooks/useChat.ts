import { useCallback, useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { RemoteParticipant } from '@proton-meet/livekit-client';

import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';

import { useMLSContext } from '../contexts/MLSContext';
import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import type { MeetChatMessage } from '../types';
import { MeetingSideBars } from '../types';

const isValidChatMessageString = (jsonString: string): boolean => {
    const dangerousPatterns = [
        '__proto__',
        'constructor',
        'prototype',
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__',
    ];

    const lowerStr = jsonString.toLowerCase();
    return !dangerousPatterns.some((pattern) => lowerStr.includes(pattern));
};

export const useChat = () => {
    const room = useRoomContext();

    const { setChatMessages, participantNameMap } = useMeetContext();

    const { sideBarState } = useUIStateContext();

    const mls = useMLSContext();

    const isChatOpen = sideBarState[MeetingSideBars.Chat];

    const handleDataReceive = useCallback(
        // This is the actual typing LiveKit uses for the payload
        // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
        async (payload: Uint8Array, participant?: RemoteParticipant) => {
            if (!participant || !payload) {
                return;
            }

            try {
                const decodedPayload = new TextDecoder().decode(payload);

                if (
                    !isValidChatMessageString(decodedPayload) ||
                    decodedPayload.length === 0 ||
                    decodedPayload.length > 50000
                ) {
                    return;
                }

                const decodedMessage = JSON.parse(decodedPayload);

                const decryptedMessage = await mls?.decryptMessage(stringToUint8Array(decodedMessage.message));

                if (!decryptedMessage) {
                    return;
                }

                const sanitizedMessage = sanitizeMessage(decryptedMessage.message);

                const newMessage: MeetChatMessage = {
                    id: decodedMessage.id,
                    timestamp: decodedMessage.timestamp,
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
