import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account/index';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getApiEnvConfig } from '@proton/shared/lib/api/apiEnvironmentConfig';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import type { ApiEnvironmentConfig } from '@proton/shared/lib/interfaces';

interface State {
    importerConfig: ModelState<ApiEnvironmentConfig>;
}

const name = 'importerConfig' as const;
type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectImporterConfig = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.api<{ Config: ApiEnvironmentConfig }>(getApiEnvConfig()).then(({ Config }) => Config);
    },
    previous: previousSelector(selectImporterConfig),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.Config) {
                state.value = updateObject(state.value, action.payload.Config);
            }
        });
    },
});

export const importerConfigReducer = { [name]: slice.reducer };
export const importConfigThunk = modelThunk.thunk;
