import type { Action, Reducer } from 'redux';

import { garbageCollectTabState, saveFilters, saveTabState } from '@proton/pass/store/actions/creators/filters';
import type { ItemFilters, MaybeNull, SelectedItem, TabId } from '@proton/pass/types';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { merge, partialMerge } from '@proton/pass/utils/object/merge';

export type TabState = {
    tabId: TabId;
    domain: MaybeNull<string>;
    search: MaybeNull<string>;
    selectedItem: MaybeNull<SelectedItem>;
};

export type FiltersState = {
    tabs: { [tabId: TabId]: TabState };
    filters: MaybeNull<ItemFilters>;
};

const getInitialState = (): FiltersState => ({ tabs: {}, filters: null });

const filtersReducer: Reducer<FiltersState> = (state = getInitialState(), action: Action) => {
    if (saveTabState.match(action)) {
        return merge(state, {
            filters: action.payload.filters ?? state.filters,
            tabs: {
                [action.payload.tabId]: action.payload,
            },
        });
    }

    if (saveFilters.match(action)) return partialMerge(state, { filters: action.payload });

    if (garbageCollectTabState.match(action)) {
        return {
            ...state,
            tabs: action.payload.tabIds.reduce<FiltersState['tabs']>(
                (acc, tabId) => objectDelete(acc, tabId),
                state.tabs
            ),
        };
    }

    return state;
};

export default filtersReducer;
