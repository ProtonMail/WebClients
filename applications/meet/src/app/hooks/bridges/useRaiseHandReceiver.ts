import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant, RemoteParticipant } from 'livekit-client';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { lowerHand, raiseHand, selectRaisedHands } from '@proton/meet/store/slices/meetingState';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { RAISE_HAND_EMOJI } from '../../constants';
import { useMLSContext } from '../../contexts/MLSContext';
import { PublishableDataTypes } from '../../types';
import { dispatchTimedReaction } from '../../utils/dispatchTimedReaction';
import { usePublishRaiseHand } from '../usePublishRaiseHand';

export const useRaiseHandReceiver = () => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const publish = usePublishRaiseHand();
    const mls = useMLSContext();
    const raisedHands = useMeetSelector(selectRaisedHands);
    const isHandRaised = room ? raisedHands.includes(room.localParticipant.identity) : false;

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
            if (topic !== PublishableDataTypes.RaiseHand) {
                return;
            }

            try {
                const decoded = JSON.parse(new TextDecoder().decode(payload));
                const decrypted = await mls.decryptMessage(stringToUint8Array(decoded.message));
                const parsed = JSON.parse(decrypted?.message ?? '');

                if (typeof parsed.raised !== 'boolean') {
                    return;
                }

                const identity = participant.identity;

                if (parsed.raised) {
                    dispatch(raiseHand(identity));
                    dispatchTimedReaction(dispatch, identity, RAISE_HAND_EMOJI);
                } else {
                    dispatch(lowerHand(identity));
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
    }, [room, mls, isHandRaised, dispatch, publish]);
};
