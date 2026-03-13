import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant, RemoteParticipant } from 'livekit-client';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { lowerHand, raiseHand, selectRaisedHands } from '@proton/meet/store/slices/meetingState';

import { RAISE_HAND_EMOJI } from '../../constants';
import { PublishableDataTypes } from '../../types';
import { dispatchTimedReaction } from '../../utils/dispatchTimedReaction';
import { usePublishRaiseHand } from '../usePublishRaiseHand';

export const useRaiseHandReceiver = () => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const publish = usePublishRaiseHand();
    const raisedHands = useMeetSelector(selectRaisedHands);
    const isHandRaised = room ? raisedHands.includes(room.localParticipant.identity) : false;

    useEffect(() => {
        if (!room) {
            return;
        }

        const handleDataReceived = (
            // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
            payload: Uint8Array<ArrayBufferLike>,
            participant?: RemoteParticipant,
            _kind?: unknown,
            topic?: string
        ) => {
            if (topic !== PublishableDataTypes.RaiseHand || !participant) {
                return;
            }

            try {
                const decoded = JSON.parse(new TextDecoder().decode(payload));
                if (typeof decoded.raised !== 'boolean') {
                    return;
                }

                const identity = participant.identity;

                if (decoded.raised) {
                    dispatch(raiseHand(identity));
                    dispatchTimedReaction(dispatch, identity, RAISE_HAND_EMOJI);
                } else {
                    dispatch(lowerHand(identity));
                }
            } catch {
                // ignore malformed payloads
            }
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
    }, [room, isHandRaised, dispatch, publish]);
};
