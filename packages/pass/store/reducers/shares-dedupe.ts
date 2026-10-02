import type { Action, Reducer } from 'redux';

import type { ShareId } from '../../types';
import { matchSyncAction, sharesDedupeUpdate } from '../actions';

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
