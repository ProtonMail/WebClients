import type { Action, Reducer } from 'redux';

import type { ShareId } from '../../types/crypto/pass-types';
import { matchSyncAction } from '../actions/creators/client';
import { sharesDedupeUpdate } from '../actions/creators/share';

export type ShareDedupeState = {
    dedupe: ShareId[];
    dedupeAndVisible: ShareId[];
};

const defaultValue = { dedupe: [], dedupeAndVisible: [] };

export const sharesDedupe: Reducer<ShareDedupeState> = (state = defaultValue, action: Action) => {
    if (sharesDedupeUpdate.match(action)) return action.payload;
    if (matchSyncAction(action) && action.payload) return action.payload.dedupe;

    return state;
};
