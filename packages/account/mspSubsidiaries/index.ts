import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getAllMspSubsidiaries } from '@proton/shared/lib/api/msp';
import type { MspSubsidiary, MspSubsidiaryStatusValue } from '@proton/shared/lib/interfaces/MspSubsidiary';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import type { UserState } from '../user';

const name = 'mspSubsidiaries' as const;

export interface MspSubsidiariesState extends UserState {
    [name]: ModelState<MspSubsidiary[]>;
}

type SliceState = MspSubsidiariesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMspSubsidiaries = (state: MspSubsidiariesState) => state[name];

const modelThunk = createAsyncModelThunk<Model, MspSubsidiariesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        const flag = extraArgument.unleashClient?.isEnabled('MspEnabled') ?? false;
        if (!flag) {
            return [];
        }
        return getAllMspSubsidiaries(extraArgument.api);
    },
    previous: previousSelector(selectMspSubsidiaries),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        upsert: (state, action: PayloadAction<MspSubsidiary>) => {
            if (!state.value) {
                return;
            }
            const idx = state.value.findIndex((s) => s.ID === action.payload.ID);
            if (idx >= 0) {
                state.value[idx] = action.payload;
            } else {
                state.value.push(action.payload);
            }
        },
        patch: (state, action: PayloadAction<{ id: string; changes: Partial<MspSubsidiary> }>) => {
            if (!state.value) {
                return;
            }
            const item = state.value.find((s) => s.ID === action.payload.id);
            if (item) {
                Object.assign(item, action.payload.changes);
            }
        },
        remove: (state, action: PayloadAction<string>) => {
            if (!state.value) {
                return;
            }
            state.value = state.value.filter((s) => s.ID !== action.payload);
        },
        setStatus: (state, action: PayloadAction<{ id: string; status: MspSubsidiaryStatusValue }>) => {
            if (!state.value) {
                return;
            }
            const item = state.value.find((s) => s.ID === action.payload.id);
            if (item) {
                item.Status = action.payload.status;
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const mspSubsidiariesReducer = { [name]: slice.reducer };
export const mspSubsidiariesThunk = modelThunk.thunk;
export const mspSubsidiariesActions = slice.actions;
