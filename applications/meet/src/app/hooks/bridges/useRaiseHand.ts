import { useCallback } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { lowerHand, raiseHand, selectRaisedHands } from '@proton/meet/store/slices/chatAndReactionsSlice';

import { RAISE_HAND_EMOJI } from '../../constants';
import { dispatchTimedReaction } from '../../utils/dispatchTimedReaction';
import { usePublishRaiseHand } from '../usePublishRaiseHand';

export const useRaiseHand = () => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const publish = usePublishRaiseHand();
    const raisedHands = useMeetSelector(selectRaisedHands);
    const isHandRaised = room ? raisedHands.includes(room.localParticipant.identity) : false;

    const toggleHand = useCallback(async () => {
        if (!room) {
            return;
        }

        const next = !isHandRaised;
        const identity = room.localParticipant.identity;

        // Optimistic update
        if (next) {
            dispatch(raiseHand(identity));
            dispatchTimedReaction(dispatch, identity, RAISE_HAND_EMOJI);
        } else {
            dispatch(lowerHand(identity));
        }

        try {
            await publish(next);
        } catch {
            // Roll back the optimistic update
            if (next) {
                dispatch(lowerHand(identity));
            } else {
                dispatch(raiseHand(identity));
            }
        }
    }, [isHandRaised, publish, room, dispatch]);

    return { isHandRaised, toggleHand };
};
