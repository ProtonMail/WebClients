import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { RemoteParticipant } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { toggleChatMessageReaction } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { useMLSContext } from '../../contexts/MLSContext';
import { PublishableDataTypes } from '../../types';

export const useChatMessageReactionReceiver = () => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const mls = useMLSContext();
    const { reportMeetError } = useMeetErrorReporting();

    useEffect(() => {
        if (!room || !mls) {
            return;
        }

        const processDataReceived = async (
            // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
            payload: Uint8Array<ArrayBufferLike>,
            participant: RemoteParticipant,
            topic: string
        ) => {
            if (topic !== PublishableDataTypes.ChatMessageReaction) {
                return;
            }

            try {
                const decoded = JSON.parse(new TextDecoder().decode(payload));
                const decrypted = await mls.decryptMessage(stringToUint8Array(decoded.message));
                if (!decrypted) {
                    return;
                }

                const mlsSenderId = decrypted.sender_participant_id;

                if (participant.identity !== mlsSenderId) {
                    reportMeetError('Chat reaction LiveKit identity does not match MLS sender', {
                        level: 'error',
                        context: {
                            participantIdentity: participant.identity,
                            senderParticipantId: mlsSenderId,
                        },
                    });
                    return;
                }

                // Envelope id is `${senderIdentity}-${timestamp}` (see useChatMessageReaction); must match MLS sender.
                const expectedIdPrefix = `${mlsSenderId}-`;
                if (typeof decoded.id !== 'string' || !decoded.id.startsWith(expectedIdPrefix)) {
                    reportMeetError('Chat reaction envelope id does not match MLS sender identity', {
                        level: 'error',
                        context: {
                            envelopeId: decoded.id,
                            senderParticipantId: mlsSenderId,
                        },
                    });
                    return;
                }

                const parsed = JSON.parse(decrypted.message ?? '');

                const { messageId, emoji } = parsed;

                if (
                    typeof messageId !== 'string' ||
                    !messageId ||
                    typeof emoji !== 'string' ||
                    !emoji ||
                    emoji.length > 10
                ) {
                    return;
                }

                dispatch(
                    toggleChatMessageReaction({
                        messageId,
                        emoji,
                        identity: mlsSenderId,
                    })
                );
            } catch {
                // ignore malformed payloads
            }
        };

        const handleDataReceived = (
            // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
            payload: Uint8Array<ArrayBufferLike>,
            participant?: RemoteParticipant,
            _kind?: unknown,
            topic?: string
        ) => {
            if (!participant || !topic) {
                return;
            }
            void processDataReceived(payload, participant, topic);
        };

        room.on('dataReceived', handleDataReceived);

        return () => {
            room.off('dataReceived', handleDataReceived);
        };
    }, [room, mls, dispatch, reportMeetError]);
};
