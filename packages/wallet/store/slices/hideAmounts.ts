import { createAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState } from '@proton/account';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

const name = 'hide_amounts' as const;

export interface HideAmountsState {
    [name]: ModelState<boolean>;
}

type SliceState = HideAmountsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectHideAmounts = (state: HideAmountsState) => state[name];

const HIDE_AMOUNTS_STORAGE_KEY = 'pw-hide-amounts';
const initStorageItem = getItem(HIDE_AMOUNTS_STORAGE_KEY);

const initialState = getInitialModelState<Model>(initStorageItem === 'hidden');

export const toggleHideAmounts = createAction('toggle-hide-amount');

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(toggleHideAmounts, (state) => {
            if (state) {
                state.value = !state.value;
                setItem(HIDE_AMOUNTS_STORAGE_KEY, state.value ? 'hidden' : 'visible');
            }
        });
    },
});

export const hideAmountsReducer = { [name]: slice.reducer };
