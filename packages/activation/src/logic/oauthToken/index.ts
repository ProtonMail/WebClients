import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { getTokens } from '../../api';

interface OAuthToken {
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

const modelThunk = createAsyncModelThunk<Model, OAuthTokenState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.api<{ Tokens: OAuthToken[] }>(getTokens()).then(({ Tokens }) => Tokens);
    },
    previous: previousSelector(selectOAuthToken),
});

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const oauthTokenReducer = { [name]: slice.reducer };
export const oauthTokenThunk = modelThunk.thunk;
