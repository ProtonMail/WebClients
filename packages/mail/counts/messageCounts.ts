import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { createHooks } from '@proton/redux-utilities';
import { queryMessageCount } from '@proton/shared/lib/api/messages';
import { type LabelCount } from '@proton/shared/lib/interfaces';

const name = 'messageCounts' as const;

interface State {
    [name]: ModelState<LabelCount[]>;
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMessageCounts = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return extraArgument.api(queryMessageCount()).then(({ Counts }) => Counts);
    },
    previous: previousSelector(selectMessageCounts),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        set: (state, action: PayloadAction<LabelCount[]>) => {
            state.value = action.payload;
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.MessageCounts) {
                state.value = action.payload.MessageCounts;
            }
        });
    },
});

export const messageCountsReducer = { [name]: slice.reducer };
export const messageCountsThunk = modelThunk.thunk;
export const messageCountsActions = slice.actions;

const hooks = createHooks(messageCountsThunk, selectMessageCounts);

export const useMessageCounts = hooks.useValue;
export const useGetMessageCounts = hooks.useGet;
