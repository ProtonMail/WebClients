import { createAction } from '@reduxjs/toolkit';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import type { TabState } from '@proton/pass/store/reducers';
import type { ItemFilters, MaybeNull, TabId } from '@proton/pass/types';

export const saveTabState = createAction(
    'filters::tab-state::save',
    (payload: Partial<TabState & { filters: MaybeNull<ItemFilters> }> & { tabId: TabId }) => ({ payload })
);

export const saveFilters = createAction('filters::save', (payload: ItemFilters) => withCache({ payload }));

export const garbageCollectTabState = createAction('filters::tab-state::gc', (payload: { tabIds: TabId[] }) => ({
    payload,
}));
