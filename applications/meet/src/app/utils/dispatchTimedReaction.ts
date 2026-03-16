import type { AppDispatch } from 'proton-authenticator/store';

import { clearActiveReaction, setActiveReaction } from '@proton/meet/store/slices/chatAndReactionsSlice';

import { REACTION_DISPLAY_DURATION_MS } from '../constants';

export const dispatchTimedReaction = (dispatch: AppDispatch, identity: string, emoji: string) => {
    const timestamp = Date.now();
    dispatch(setActiveReaction({ identity, emoji, timestamp }));
    setTimeout(() => {
        dispatch(clearActiveReaction({ identity, timestamp }));
    }, REACTION_DISPLAY_DURATION_MS);
};
