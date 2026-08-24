import type { Maybe, TabId } from '../../types';
import type { TabState } from '../reducers/filters';
import type { State } from '../types';

export const selectTabIDs = (state: State): TabId[] => Object.keys(state.filters.tabs).map((val) => parseInt(val, 10));

export const selectTabState =
    (tabId: TabId) =>
    (state: State): Maybe<TabState> =>
        state.filters.tabs?.[tabId];

export const selectFilters = ({ filters: { filters } }: State) => filters;
