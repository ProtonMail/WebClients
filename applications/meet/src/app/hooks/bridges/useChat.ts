import { useCallback, useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { ChatEventKind } from '@proton-meet/proton-meet-core';
import type { RemoteParticipant } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    addChatMessageReaction,
    addChatMessages,
    removeChatMessageReaction,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import { MeetingSideBars, selectSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import type { MeetChatMessage } from '@proton/meet/types/types';
import { sanitizeMessage } from '@proton/sanitize/purify';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { wait } from '@proton/shared/lib/helpers/promise';
import { useFlag } from '@proton/unleash/useFlag';

import { useMLSContext } from '../../contexts/MLSContext';
import { isValidMessageString } from '../../utils/isValidMessageString';

export const useChat = () => {
    const dispatch = useMeetDispatch();
    const room = useRoomContext();

    const sideBarState = useMeetSelector(selectSideBarState);

    const mls = useMLSContext();

    const isChatOpen = sideBarState[MeetingSideBars.Chat];

    const isNewChatHandling = useFlag('MeetNewChatHandling');

    const { reportMeetError } = useMeetErrorReporting();

    const handleDataReceiveNew = useCallback(
        // This is the actual typing LiveKit uses for the payload
        // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
        async (payload: Uint8Array, participant: RemoteParticipant) => {
            try {
                const event = await mls.decodeChat(payload);

                if (event.kind !== ChatEventKind.Message && event.kind !== ChatEventKind.Reaction) {
                    return;
                }

                const mlsSenderId = event.sender_participant_id;

                if (participant.identity !== mlsSenderId) {
                    reportMeetError('Chat event LiveKit identity does not match MLS sender', {
                        level: 'error',
                        context: {
                            participantIdentity: participant.identity,
                            senderParticipantId: mlsSenderId,
                            eventKind: event.kind,
                        },
                    });
                    return;
                }

                if (event.kind === ChatEventKind.Reaction) {
                    // An unreact references the original reaction event id via `replaces_id`.
                    if (event.replaces_id) {
                        dispatch(removeChatMessageReaction({ replacesId: event.replaces_id, identity: mlsSenderId }));
                        return;
                    }

                    const messageId = event.target_id;
                    const emoji = event.emoji;

                    if (!messageId || !emoji || emoji.length > 10) {
                        return;
                    }

                    dispatch(addChatMessageReaction({ reactionId: event.id, messageId, emoji, identity: mlsSenderId }));
                    return;
                }

                if (!event.text) {
                    return;
                }

                if (!isValidMessageString(event.text) || event.text.length === 0 || event.text.length > 50000) {
                    return;
                }

                const sanitizedMessage = sanitizeMessage(event.text);

                const newMessage: MeetChatMessage = {
                    id: event.id,
                    timestamp: Number(event.received_at_ms),
                    identity: mlsSenderId,
                    seen: isChatOpen,
                    message: sanitizedMessage,
                    type: 'message',
                };

                dispatch(addChatMessages([newMessage]));
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error handling chat event:', error);
            }
        },
        [dispatch, isChatOpen, mls, reportMeetError]
    );

    const handleDataReceiveLegacy = useCallback(
        // This is the actual typing LiveKit uses for the payload
        // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
        async (payload: Uint8Array, participant: RemoteParticipant) => {
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

                const mlsSenderId = decryptedMessage.sender_participant_id;

                if (participant.identity !== mlsSenderId) {
                    reportMeetError('Chat message LiveKit identity does not match MLS sender', {
                        level: 'error',
                        context: {
                            participantIdentity: participant.identity,
                            senderParticipantId: mlsSenderId,
                        },
                    });
                    return;
                }

                // Envelope id is `${senderIdentity}-${timestamp}` (see useChatMessage); must match MLS sender.
                const expectedIdPrefix = `${mlsSenderId}-`;
                if (typeof decodedMessage.id !== 'string' || !decodedMessage.id.startsWith(expectedIdPrefix)) {
                    reportMeetError('Chat message id does not match MLS sender identity', {
                        level: 'error',
                        context: {
                            messageId: decodedMessage.id,
                            senderParticipantId: mlsSenderId,
                        },
                    });
                    return;
                }

                const sanitizedMessage = sanitizeMessage(decryptedMessage.message);

                const newMessage: MeetChatMessage = {
                    id: decodedMessage.id,
                    timestamp: decodedMessage.timestamp,
                    identity: mlsSenderId,
                    seen: isChatOpen,
                    message: sanitizedMessage,
                    type: 'message',
                };

                dispatch(addChatMessages([newMessage]));
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error handling chat message:', error);
            }
        },
        [dispatch, isChatOpen, mls, reportMeetError]
    );

    const handleDataReceive = useCallback(
        // This is the actual typing LiveKit uses for the payload
        // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
        async (payload: Uint8Array, participant?: RemoteParticipant) => {
            if (!participant || !payload) {
                return;
            }

            const handler = isNewChatHandling ? handleDataReceiveNew : handleDataReceiveLegacy;
            await handler(payload, participant);
        },
        [isNewChatHandling, handleDataReceiveNew, handleDataReceiveLegacy]
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
