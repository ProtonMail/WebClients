import type { AnyAction, Reducer } from 'redux';

import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
import type { ItemFilters, ItemType, MaybeNull, SelectedItem, TabId, UniqueItem } from '@proton/pass/types';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { merge } from '@proton/pass/utils/object/merge';

import { itemDraftDiscard, itemDraftSave } from '../actions';
import { popupPasswordOptionsSave, popupTabStateGarbageCollect, popupTabStateSave } from '../actions/creators/popup';

export type ItemDraft<T extends {} = {}> = UniqueItem & {
    mode: 'new' | 'edit';
    type: ItemType;
    formData: T;
};

export type PopupTabState = {
    tabId: TabId;
    domain: MaybeNull<string>;
    search: MaybeNull<string>;
    selectedItem: MaybeNull<SelectedItem>;
};

export type PopupState = {
    draft: MaybeNull<ItemDraft>;
    tabs: { [tabId: TabId]: PopupTabState };
    filters: MaybeNull<ItemFilters>;
    passwordOptions: MaybeNull<GeneratePasswordOptions>;
};

const initialState: PopupState = { draft: null, tabs: {}, filters: null, passwordOptions: null };

const popupReducer: Reducer<PopupState> = (state = initialState, action: AnyAction) => {
    if (itemDraftSave.match(action)) return { ...state, draft: action.payload };
    if (itemDraftDiscard.match(action)) return { ...state, draft: null };

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

    if (popupPasswordOptionsSave.match(action)) {
        return { ...state, passwordOptions: action.payload };
    }

    return state;
};

export default popupReducer;
