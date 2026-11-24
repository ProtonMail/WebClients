import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { createHooks } from '@proton/redux-utilities/hooks';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getMembersWithoutRecoveryCount } from '@proton/shared/lib/api/organization';

const name = 'membersWithoutRecovery' as const;

export interface MembersWithoutRecoveryState {
    /** Null when the count couldn't be loaded: the section shows no count rather than an error. */
    [name]: ModelState<number | null>;
}

type Model = number | null;

export const selectMembersWithoutRecovery = (state: MembersWithoutRecoveryState) => state[name];

const modelThunk = createAsyncModelThunk<Model, MembersWithoutRecoveryState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        try {
            const { Count } = await getSilentApi(extraArgument.api)<{ Count: number }>(
                getMembersWithoutRecoveryCount()
            );
            return Count;
        } catch {
            return null;
        }
    },
    previous: previousSelector(selectMembersWithoutRecovery),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const membersWithoutRecoveryReducer = { [name]: slice.reducer };
export const membersWithoutRecoveryThunk = modelThunk.thunk;

export const useMembersWithoutRecovery = createHooks(
    membersWithoutRecoveryThunk,
    selectMembersWithoutRecovery
).useValue;
