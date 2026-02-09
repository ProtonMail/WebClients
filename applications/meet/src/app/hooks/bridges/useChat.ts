import { useCallback, useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { RemoteParticipant } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { addChatMessages } from '@proton/meet/store/slices/meetingState';
import { MeetingSideBars, selectSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import type { MeetChatMessage } from '@proton/meet/types/types';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { wait } from '@proton/shared/lib/helpers/promise';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';

import { useMLSContext } from '../../contexts/MLSContext';
import { isValidMessageString } from '../../utils/isValidMessageString';

export const useChat = () => {
    const dispatch = useMeetDispatch();
    const room = useRoomContext();

    const sideBarState = useMeetSelector(selectSideBarState);

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
                    seen: isChatOpen,
                    message: sanitizedMessage,
                };

                dispatch(addChatMessages([newMessage]));
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error handling chat message:', error);
            }
        },
        [isChatOpen]
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
