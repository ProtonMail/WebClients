import { createAction } from '@reduxjs/toolkit';

import type { GeneratePasswordOptions } from '@proton/pass/password';
import type { ItemFilters, MaybeNull, TabId } from '@proton/pass/types';

import type { PopupTabState } from '../../reducers/popup';
import withCacheBlock from '../with-cache-block';

export const popupTabStateSave = createAction(
    'popup tab state save',
    (payload: Partial<PopupTabState & { filters: MaybeNull<ItemFilters> }> & { tabId: TabId }) =>
        withCacheBlock({ payload })
);

export const popupTabStateGarbageCollect = createAction(
    'popup tab state garbage collect',
    (payload: { tabIds: TabId[] }) => withCacheBlock({ payload })
);

export const popupPasswordOptionsSave = createAction(
    'popup password options save',
    (payload: GeneratePasswordOptions) => withCacheBlock({ payload })
);
