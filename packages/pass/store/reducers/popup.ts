import type { AnyAction, Reducer } from 'redux';

import type { ItemFilters, ItemType, MaybeNull, SelectedItem, TabId, UniqueItem } from '@proton/pass/types';
import { merge, objectDelete } from '@proton/pass/utils/object';

import { itemDraftDiscard, itemDraftSave } from '../actions';
import { popupTabStateGarbageCollect, popupTabStateSave } from '../actions/creators/popup';

export type ItemDraft<T extends {} = {}> = UniqueItem & {
    mode: 'new' | 'edit';
    type: ItemType;
    formData: T;
};

export type PopupTabState = {
    tabId: TabId;
    domain: MaybeNull<string>;
    search: MaybeNull<string>;
    filters: MaybeNull<ItemFilters>;
    selectedItem: MaybeNull<SelectedItem>;
};

export type PopupState = {
    draft: MaybeNull<ItemDraft>;
    tabs: { [tabId: TabId]: PopupTabState };
};

const initialState: PopupState = { draft: null, tabs: {} };

const popupReducer: Reducer<PopupState> = (state = initialState, action: AnyAction) => {
    if (itemDraftSave.match(action)) return { ...state, draft: action.payload };
    if (itemDraftDiscard.match(action)) return { ...state, draft: null };

    if (popupTabStateSave.match(action)) {
        return merge(state, {
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
