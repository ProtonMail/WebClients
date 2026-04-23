import { useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant, RemoteParticipant } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { lowerHand, raiseHand, selectRaisedHands } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectParticipantsMap } from '@proton/meet/store/slices/meetingInfo';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { useFlag } from '@proton/unleash/useFlag';

import { RAISE_HAND_EMOJI } from '../../constants';
import { useMLSContext } from '../../contexts/MLSContext';
import { PublishableDataTypes } from '../../types';
import { dispatchTimedReaction } from '../../utils/dispatchTimedReaction';
import { usePublishRaiseHand } from '../usePublishRaiseHand';

export const useRaiseHandReceiver = () => {
    const isAdminLowerHandEnabled = useFlag('MeetAdminLowerHand');

    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const { publish } = usePublishRaiseHand();
    const mls = useMLSContext();
    const { reportMeetError } = useMeetErrorReporting();
    const raisedHands = useMeetSelector(selectRaisedHands);
    const isHandRaised = room ? raisedHands.includes(room.localParticipant.identity) : false;
    const participantsMap = useMeetSelector(selectParticipantsMap);
    const participantsMapRef = useRef(participantsMap);
    participantsMapRef.current = participantsMap;

    useEffect(() => {
        if (!room || !mls) {
            return;
        }

        const processRaiseHand = (raised: boolean, identity: string) => {
            if (typeof raised !== 'boolean') {
                return;
            }

            if (raised) {
                dispatch(raiseHand(identity));
                dispatchTimedReaction(dispatch, identity, RAISE_HAND_EMOJI);
            } else {
                dispatch(lowerHand(identity));
            }
        };

        const processAdminLowerHand = (participant: RemoteParticipant, identity: string) => {
            const senderParticipant = participantsMapRef.current[participant.identity];

            // Only admins and hosts can lower hands
            if (!senderParticipant?.IsAdmin && !senderParticipant?.IsHost) {
                return;
            }

            dispatch(lowerHand(identity));
        };

        const processDataReceived = async (
            // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
            payload: Uint8Array<ArrayBufferLike>,
            participant: RemoteParticipant,
            topic: string
        ) => {
            if (
                ![PublishableDataTypes.RaiseHand, PublishableDataTypes.LowerHandAdmin].includes(
                    topic as PublishableDataTypes
                )
            ) {
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
                    reportMeetError('Raise hand LiveKit identity does not match MLS sender', {
                        level: 'error',
                        context: {
                            participantIdentity: participant.identity,
                            senderParticipantId: mlsSenderId,
                            topic,
                        },
                    });
                    return;
                }

                const parsed = JSON.parse(decrypted.message ?? '');

                if (topic === PublishableDataTypes.RaiseHand) {
                    // Envelope id is `${senderIdentity}-${timestamp}` (see usePublishRaiseHand); must match MLS sender.
                    const expectedIdPrefix = `${mlsSenderId}-`;
                    if (typeof decoded.id !== 'string' || !decoded.id.startsWith(expectedIdPrefix)) {
                        reportMeetError('Raise hand envelope id does not match MLS sender identity', {
                            level: 'error',
                            context: {
                                envelopeId: decoded.id,
                                senderParticipantId: mlsSenderId,
                            },
                        });
                        return;
                    }
                    processRaiseHand(parsed.raised, mlsSenderId);
                    return;
                }

                if (topic === PublishableDataTypes.LowerHandAdmin && isAdminLowerHandEnabled) {
                    // Envelope id is `${targetIdentity}-${timestamp}` (see adminPublishLowerHand); must match inner target.
                    if (typeof parsed.identity !== 'string' || !parsed.identity) {
                        return;
                    }
                    const expectedLowerHandIdPrefix = `${parsed.identity}-`;
                    if (typeof decoded.id !== 'string' || !decoded.id.startsWith(expectedLowerHandIdPrefix)) {
                        reportMeetError('Lower hand admin envelope id does not match target identity', {
                            level: 'error',
                            context: {
                                envelopeId: decoded.id,
                                targetParticipantId: parsed.identity,
                            },
                        });
                        return;
                    }
                    processAdminLowerHand(participant, parsed.identity);
                    return;
                }
            } catch {
                // ignore malformed or undecryptable payloads
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

        // Re-publish own state to newly joined participants
        const handleParticipantConnected = (participant: Participant) => {
            if (isHandRaised) {
                void publish(true, [participant.identity]);
            }
        };

        room.on('dataReceived', handleDataReceived);
        room.on('participantConnected', handleParticipantConnected);

        return () => {
            room.off('dataReceived', handleDataReceived);
            room.off('participantConnected', handleParticipantConnected);
        };
    }, [room, mls, isHandRaised, dispatch, publish, reportMeetError, isAdminLowerHandEnabled]);
};
