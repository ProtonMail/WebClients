import type { Action, Reducer } from 'redux';

import type { Share, ShareId, ShareType } from '../../types';
import { matchSyncAction, sharesDedupeUpdate } from '../actions';

export type ShareItem<T extends ShareType = ShareType> = Share<T>;

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
