import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getUser } from '@proton/shared/lib/api/user';
import { DAY } from '@proton/shared/lib/constants';
import { getFetchedAt } from '@proton/shared/lib/helpers/fetchedAt';
import type { User, UserModel } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import { getInitialModelState } from '../initialModelState';
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
    previous: previousSelector(selectUser, 14 * DAY), // Longer expiration since this is set on init
});

const initialState = getInitialModelState<Model>();
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
                    state.meta.fetchedAt = getFetchedAt();
                }
            })
            .addCase(serverEvent, (state, action) => {
                if (state.value && (action.payload.User || action.payload.UsedSpace)) {
                    const user = action.payload.User || state.value;
                    if (action.payload.UsedSpace !== undefined) {
                        user.UsedSpace = action.payload.UsedSpace;
                    }
                    if (action.payload.UsedBaseSpace !== undefined) {
                        user.UsedBaseSpace = action.payload.UsedBaseSpace;
                    }
                    if (action.payload.UsedDriveSpace !== undefined) {
                        user.UsedDriveSpace = action.payload.UsedDriveSpace;
                    }
                    if (action.payload.ProductUsedSpace !== undefined) {
                        user.ProductUsedSpace = action.payload.ProductUsedSpace;
                    }
                    state.value = formatUser(user);
                }
            });
    },
});

export const userReducer = { [name]: slice.reducer };
export const userThunk = modelThunk.thunk;
