import { clearActiveReaction, setActiveReaction } from '@proton/meet/store/slices/chatAndReactionsSlice';
import type { MeetDispatch } from '@proton/meet/store/store';

import { REACTION_DISPLAY_DURATION_MS } from '../constants';

export const dispatchTimedReaction = (dispatch: MeetDispatch, identity: string, emoji: string) => {
    const timestamp = Date.now();
    dispatch(setActiveReaction({ identity, emoji, timestamp }));
    setTimeout(() => {
        dispatch(clearActiveReaction({ identity, timestamp }));
    }, REACTION_DISPLAY_DURATION_MS);
    return timestamp;
};
