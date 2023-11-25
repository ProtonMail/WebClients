import type { AnyAction, Reducer } from 'redux';

import { popupTabStateGarbageCollect, popupTabStateSave } from '@proton/pass/store/actions/creators/popup';
import type { ItemFilters, MaybeNull, SelectedItem, TabId } from '@proton/pass/types';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { merge } from '@proton/pass/utils/object/merge';

export type PopupTabState = {
    tabId: TabId;
    domain: MaybeNull<string>;
    search: MaybeNull<string>;
    selectedItem: MaybeNull<SelectedItem>;
};

export type PopupState = {
    tabs: { [tabId: TabId]: PopupTabState };
    filters: MaybeNull<ItemFilters>;
};

const INITIAL_STATE: PopupState = { tabs: {}, filters: null };

const popupReducer: Reducer<PopupState> = (state = INITIAL_STATE, action: AnyAction) => {
    if (popupTabStateSave.match(action)) {
        return merge(state, {
            filters: action.payload.filters ?? state.filters,
            tabs: {
                [action.payload.tabId]: action.payload,
            },
        });
    }

    if (popupTabStateGarbageCollect.match(action)) {
        return {
            ...state,
            tabs: action.payload.tabIds.reduce<PopupState['tabs']>(
                (acc, tabId) => objectDelete(acc, tabId),
                state.tabs
            ),
        };
    }

    return state;
};

export default popupReducer;
