import { createAction } from '@reduxjs/toolkit';

import type { ItemFilters } from '../../../types/data/items';
import type { MaybeNull } from '../../../types/utils';
import type { TabId } from '../../../types/worker/runtime';
import type { TabState } from '../../reducers';
import { withCache } from '../enhancers/cache';

export const saveTabState = createAction(
    'filters::tab-state::save',
    (payload: Partial<TabState & { filters: MaybeNull<ItemFilters> }> & { tabId: TabId }) => ({ payload })
);

export const saveFilters = createAction('filters::save', (payload: ItemFilters) => withCache({ payload }));

export const garbageCollectTabState = createAction('filters::tab-state::gc', (payload: { tabIds: TabId[] }) => ({
    payload,
}));
