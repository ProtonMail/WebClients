import { useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { lowerHand, raiseHand, selectRaisedHands } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { toToggleState } from '@proton/meet/telemetry/dimensions';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import { useFlag } from '@proton/unleash/useFlag';

import { RAISE_HAND_EMOJI } from '../../constants';
import { dispatchTimedReaction } from '../../utils/dispatchTimedReaction';
import { usePublishRaiseHand } from '../usePublishRaiseHand';
import { useStableCallback } from '../useStableCallback';

export const useRaiseHand = () => {
    const isAdminLowerHandEnabled = useFlag('MeetAdminLowerHand');

    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const { publish, adminPublishLowerHand } = usePublishRaiseHand();

    const raisedHands = useMeetSelector(selectRaisedHands);
    const raisedHandsRef = useRef(raisedHands);
    raisedHandsRef.current = raisedHands;
    const isHandRaised = room ? raisedHands.includes(room.localParticipant.identity) : false;

    const toggleHand = useStableCallback(async () => {
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
            sendMeetActionsEvent(TelemetryMeetActionsEvents.hand_raise_toggled, { state: toToggleState(next) });
        } catch {
            // Roll back the optimistic update
            if (next) {
                dispatch(lowerHand(identity));
            } else {
                dispatch(raiseHand(identity));
            }
        }
    });

    const adminLowerHand = useStableCallback(async (identity: string) => {
        if (!room || !isAdminLowerHandEnabled) {
            return;
        }

        // Optimistic update
        if (raisedHandsRef.current.includes(identity)) {
            dispatch(lowerHand(identity));

            try {
                await adminPublishLowerHand(identity);
                sendMeetActionsEvent(TelemetryMeetActionsEvents.hand_lowered_by_host);
            } catch {
                // Roll back the optimistic update
                dispatch(raiseHand(identity));
            }
        }
    });

    return { isHandRaised, toggleHand, adminLowerHand };
};
