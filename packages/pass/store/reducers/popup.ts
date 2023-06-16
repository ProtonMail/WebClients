import type { AnyAction, Reducer } from 'redux';

import type { ItemType, MaybeNull, UniqueItem } from '@proton/pass/types';

import { itemDraftDiscard, itemDraftSave } from '../actions';

export type ItemDraft<T extends {} = {}> = UniqueItem & {
    mode: 'new' | 'edit';
    type: ItemType;
    formData: T;
};

export type PopupState = { draft: MaybeNull<ItemDraft> };

const initialState: PopupState = { draft: null };

const popupReducer: Reducer<PopupState> = (state = initialState, action: AnyAction) => {
    if (itemDraftSave.match(action)) return { ...state, draft: action.payload };
    if (itemDraftDiscard.match(action)) return { ...state, draft: null };

    return state;
};

export default popupReducer;
