import type { TabState } from '@proton/pass/store/reducers/filters';
import type { State } from '@proton/pass/store/types';
import type { Maybe, TabId } from '@proton/pass/types';

export const selectTabIDs = (state: State): TabId[] => Object.keys(state.filters.tabs).map((val) => parseInt(val, 10));

export const selectTabState =
    (tabId: TabId) =>
    (state: State): Maybe<TabState> =>
        state.filters.tabs?.[tabId];

export const selectFilters = ({ filters: { filters } }: State) => filters;
