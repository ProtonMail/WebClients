import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getSAMLConfigs } from '@proton/shared/lib/api/samlSSO';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import { SSO } from '@proton/shared/lib/interfaces';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { UserState, userThunk } from '../user';

const name = 'sso' as const;

interface State extends UserState {
    [name]: ModelState<SSO[]>;
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectSamlSSO = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());
        if (!isPaid(user)) {
            return [];
        }
        return extraArgument.api<{ Configs: SSO[] }>(getSAMLConfigs()).then(({ Configs }) => {
            return Configs;
        });
    },
    previous: previousSelector(selectSamlSSO),
});

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && state.value.length > 0 && action.payload.User && !isPaid(action.payload.User)) {
                // Do not get any SSO update when user becomes unsubscribed.
                state.value = [];
                return;
            }

            if (state.value && action.payload.SSO) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.SSO,
                    itemKey: 'SSO',
                });
            }
        });
    },
});

export const samlReducer = { [name]: slice.reducer };
export const samlSSOThunk = modelThunk.thunk;
