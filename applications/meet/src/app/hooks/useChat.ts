import { useCallback, useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { RemoteParticipant } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { wait } from '@proton/shared/lib/helpers/promise';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';

import { useMLSContext } from '../contexts/MLSContext';
import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import type { MeetChatMessage } from '../types';
import { MeetingSideBars } from '../types';
import { isValidMessageString } from '../utils/isValidMessageString';

export const useChat = () => {
    const room = useRoomContext();

    const { setChatMessages, participantNameMap } = useMeetContext();

    const { sideBarState } = useUIStateContext();

    const mls = useMLSContext();

    const isChatOpen = sideBarState[MeetingSideBars.Chat];

    const reportMeetError = useMeetErrorReporting();

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
                    !isValidMessageString(decodedPayload) ||
                    decodedPayload.length === 0 ||
                    decodedPayload.length > 50000
                ) {
                    return;
                }

                const decodedMessage = JSON.parse(decodedPayload);

                if (decodedMessage.type !== 'message') {
                    return;
                }

                const encryptedData = stringToUint8Array(decodedMessage.message);

                // Trying the decryption 3 times with increasing delays, to work around temporary issues with the MLS
                const tryDecrypt = async (attemptIndex: number) => {
                    const delays = [0, 2000, 4000];

                    if (attemptIndex >= delays.length) {
                        return undefined;
                    }

                    if (delays[attemptIndex] > 0) {
                        await wait(delays[attemptIndex]);
                    }

                    try {
                        const result = await mls?.decryptMessage(encryptedData);
                        if (!result) {
                            return await tryDecrypt(attemptIndex + 1);
                        }
                        return result;
                    } catch (_error) {
                        reportMeetError('Failed to decrypt chat message', { level: 'error' });
                        return tryDecrypt(attemptIndex + 1);
                    }
                };

                const decryptedMessage = await tryDecrypt(0);

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
                // eslint-disable-next-line no-console
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
