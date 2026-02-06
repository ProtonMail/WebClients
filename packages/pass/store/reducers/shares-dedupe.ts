import type { Action, Reducer } from 'redux';

import { sharesDedupeUpdate } from '@proton/pass/store/actions';
import type { Share, ShareId, ShareType } from '@proton/pass/types';

export type ShareItem<T extends ShareType = ShareType> = Share<T>;

export type ShareDedupeState = {
    dedupe: ShareId[];
    dedupeAndVisible: ShareId[];
};

const defaultValue = { dedupe: [], dedupeAndVisible: [] };

export const sharesDedupe: Reducer<ShareDedupeState> = (state = defaultValue, action: Action) => {
    if (sharesDedupeUpdate.match(action)) return action.payload;

    return state;
};
