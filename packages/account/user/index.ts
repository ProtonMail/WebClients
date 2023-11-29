import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getUser } from '@proton/shared/lib/api/user';
import type { User, UserModel } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import type { ModelState } from '../interface';

const name = 'user' as const;

export interface UserState {
    [name]: ModelState<UserModel>;
}

type SliceState = UserState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUser = (state: UserState) => state.user;

const modelThunk = createAsyncModelThunk<Model, UserState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.api<{ User: User }>(getUser()).then(({ User }) => {
            return formatUser(User);
        });
    },
    previous: previousSelector(selectUser),
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
        builder
            .addCase(initEvent, (state, action) => {
                if (action.payload.User) {
                    state.value = formatUser(action.payload.User);
                }
            })
            .addCase(serverEvent, (state, action) => {
                if (state.value && (action.payload.User || action.payload.UsedSpace)) {
                    const user = action.payload.User || state.value;
                    if (action.payload.UsedSpace !== undefined) {
                        user.UsedSpace = action.payload.UsedSpace;
                    }
                    state.value = formatUser(user);
                }
            });
    },
});

export const userReducer = { [name]: slice.reducer };
export const userThunk = modelThunk.thunk;
