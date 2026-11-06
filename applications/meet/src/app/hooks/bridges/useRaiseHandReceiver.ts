import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant, RemoteParticipant } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetStore } from '@proton/meet/store/hooks';
import { lowerHand, raiseHand, selectRaisedHands } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import { selectMlsGroupEpoch } from '@proton/meet/store/slices/currentMeeting';
import { binaryStringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { useFlag } from '@proton/unleash/useFlag';

import { RAISE_HAND_EMOJI } from '../../constants';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { PublishableDataTypes } from '../../types';
import { decryptMessageWithRetry } from '../../utils/decryptMessageWithRetry';
import { dispatchTimedReaction } from '../../utils/dispatchTimedReaction';
import { waitForParticipant } from '../../utils/waitForParticipant';
import { usePublishRaiseHand } from '../usePublishRaiseHand';

const parseJsonOrUndefined = (text: string) => {
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
};

export const useRaiseHandReceiver = () => {
    const isAdminLowerHandEnabled = useFlag('MeetAdminLowerHand');

    const room = useRoomContext();
    const store = useMeetStore();
    const dispatch = useMeetDispatch();
    const { publish } = usePublishRaiseHand();
    const meetCoreClient = useMeetCoreClient();
    const { reportMeetError } = useMeetErrorReporting();

    useEffect(() => {
        if (!room) {
            return;
        }

        let isListening = true;
        let arrivalCount = 0;
        // The raised hands are reset right after joinedRoom turns false (useRoomEventHandlers on disconnect,
        // MeetContainer unmounting after useMeetingCleanup), so packets still decrypting from before must not apply.
        let firstArrivalOfSession = 1;
        let wasJoined = selectJoinedRoom(store.getState());
        let lastEpoch = selectMlsGroupEpoch(store.getState());
        // A decrypt retry can finish after a later packet about the same hand, so the latest arrival wins.
        const lastAppliedArrivalBySubject = new Map<string, number>();

        const claimLatestArrival = (subjectIdentity: string, arrivalNumber: number) => {
            if (
                !isListening ||
                arrivalNumber < firstArrivalOfSession ||
                arrivalNumber <= (lastAppliedArrivalBySubject.get(subjectIdentity) ?? 0)
            ) {
                return false;
            }
            lastAppliedArrivalBySubject.set(subjectIdentity, arrivalNumber);
            return true;
        };

        const processRaiseHand = (raised: unknown, identity: string, arrivalNumber: number) => {
            if (typeof raised !== 'boolean' || !claimLatestArrival(identity, arrivalNumber)) {
                return;
            }

            if (raised) {
                dispatch(raiseHand(identity));
                dispatchTimedReaction(dispatch, identity, RAISE_HAND_EMOJI);
            } else {
                dispatch(lowerHand(identity));
            }
        };

        const processAdminLowerHand = async (senderIdentity: string, identity: string, arrivalNumber: number) => {
            // The sender's entry can still be loading while we join.
            const senderParticipant = await waitForParticipant(store, senderIdentity);

            if (!senderParticipant?.IsAdmin && !senderParticipant?.IsHost) {
                return;
            }

            if (!claimLatestArrival(identity, arrivalNumber)) {
                return;
            }

            dispatch(lowerHand(identity));
        };

        const processDataReceived = async (
            payload: Uint8Array<ArrayBuffer>,
            participant: RemoteParticipant,
            topic: PublishableDataTypes,
            arrivalNumber: number
        ) => {
            try {
                const decoded = parseJsonOrUndefined(new TextDecoder().decode(payload));
                if (typeof decoded?.message !== 'string') {
                    return;
                }

                const decrypted = await decryptMessageWithRetry({
                    meetCoreClient,
                    encryptedData: binaryStringToUint8Array(decoded.message),
                    reportMeetError,
                    failureLabel: 'Failed to decrypt raise hand message',
                    isSuperseded: () =>
                        topic === PublishableDataTypes.RaiseHand &&
                        (lastAppliedArrivalBySubject.get(participant.identity) ?? 0) > arrivalNumber,
                });
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

                const parsed = parseJsonOrUndefined(decrypted.message ?? '');
                if (!parsed || typeof parsed !== 'object') {
                    return;
                }

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
                    processRaiseHand(parsed.raised, mlsSenderId, arrivalNumber);
                    return;
                }

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
                await processAdminLowerHand(mlsSenderId, parsed.identity, arrivalNumber);
            } catch (error) {
                // Only the name: this runs after decryption, and an error message could carry decrypted content.
                reportMeetError('Failed to handle raise hand message', {
                    level: 'error',
                    context: { errorName: error instanceof Error ? error.name : typeof error, topic },
                });
            }
        };

        const handleDataReceived = (
            payload: Uint8Array<ArrayBuffer>,
            participant?: RemoteParticipant,
            _kind?: unknown,
            topic?: string
        ) => {
            if (!participant) {
                return;
            }

            const isRaiseHandTopic = topic === PublishableDataTypes.RaiseHand;
            const isAdminLowerHandTopic = topic === PublishableDataTypes.LowerHandAdmin && isAdminLowerHandEnabled;
            if (!isRaiseHandTopic && !isAdminLowerHandTopic) {
                return;
            }

            arrivalCount += 1;
            void processDataReceived(payload, participant, topic, arrivalCount);
        };

        // Re-publish own state to newly joined participants
        const handleParticipantConnected = (participant: Participant) => {
            if (selectRaisedHands(store.getState()).includes(room.localParticipant.identity)) {
                void publish(true, [participant.identity]);
            }
        };

        const unsubscribeFromStore = store.subscribe(() => {
            const state = store.getState();
            const isJoined = selectJoinedRoom(state);
            if (wasJoined && !isJoined) {
                firstArrivalOfSession = arrivalCount + 1;
            }
            wasJoined = isJoined;

            const epoch = selectMlsGroupEpoch(state);
            if (epoch !== lastEpoch) {
                lastEpoch = epoch;
                if (epoch !== undefined && selectRaisedHands(state).includes(room.localParticipant.identity)) {
                    void publish(true);
                }
            }
        });

        room.on('dataReceived', handleDataReceived);
        room.on('participantConnected', handleParticipantConnected);

        return () => {
            isListening = false;
            unsubscribeFromStore();
            room.off('dataReceived', handleDataReceived);
            room.off('participantConnected', handleParticipantConnected);
        };
    }, [room, store, meetCoreClient, dispatch, publish, reportMeetError, isAdminLowerHandEnabled]);
};
