import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { deleteToken, getTokens } from '../../api';

export interface OAuthToken {
    Account: string;
    ID: string;
    Provider: number;
}

const name = 'oauthToken' as const;

export interface OAuthTokenState {
    [name]: ModelState<OAuthToken[]>;
}

type SliceState = OAuthTokenState[typeof name];
type Model = NonNullable<SliceState['value']>;

const initialState: ModelState<Model> = {
    value: undefined,
    error: undefined,
    meta: {
        fetchedAt: 0,
        fetchedEphemeral: undefined,
    },
};

export const selectOAuthToken = (state: OAuthTokenState) => state.oauthToken;

export const deleteOAuthTokenThunk = createAsyncThunk<string, string, { extra: ProtonThunkArguments }>(
    `${name}/delete`,
    async (tokenId, { extra }) => {
        await extra.api(deleteToken(tokenId));
        return tokenId;
    }
);

const modelThunk = createAsyncModelThunk<Model, OAuthTokenState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.api<{ Tokens: OAuthToken[] }>(getTokens()).then(({ Tokens }) => Tokens);
    },
    previous: previousSelector(selectOAuthToken),
});

const slice = createSlice({
    name,
    initialState,
    reducers: {
        updateTokens: (state, action: PayloadAction<OAuthToken[]>) => {
            state.value = action.payload;
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(deleteOAuthTokenThunk.fulfilled, (state, action) => {
            state.value = state.value?.filter((t) => t.ID !== action.payload);
        });
    },
});

export const oauthTokenActions = slice.actions;
export const oauthTokenReducer = { [name]: slice.reducer };
export const oauthTokenThunk = modelThunk.thunk;
