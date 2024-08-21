import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { createHooks } from '@proton/redux-utilities';
import { queryConversationCount } from '@proton/shared/lib/api/conversations';
import { type LabelCount } from '@proton/shared/lib/interfaces';

const name = 'conversationCounts' as const;

interface State {
    [name]: ModelState<LabelCount[]>;
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectConversationCounts = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return extraArgument.api(queryConversationCount()).then(({ Counts }) => Counts);
    },
    previous: previousSelector(selectConversationCounts),
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
            if (state.value && action.payload.ConversationCounts) {
                state.value = action.payload.ConversationCounts;
            }
        });
    },
});

export const conversationCountsReducer = { [name]: slice.reducer };
export const conversationCountsActions = slice.actions;
export const conversationCountsThunk = modelThunk.thunk;

const hooks = createHooks(conversationCountsThunk, selectConversationCounts);

export const useConversationCounts = hooks.useValue;
export const useGetConversationCounts = hooks.useGet;
