import { createAction } from '@reduxjs/toolkit';

import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import type { PopupTabState } from '@proton/pass/store/reducers';
import type { ItemFilters, MaybeNull, TabId } from '@proton/pass/types';

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
