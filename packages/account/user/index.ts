import {
    type PayloadAction,
    type ThunkAction,
    type UnknownAction,
    createSlice,
    miniSerializeError,
} from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    type CacheType,
    cacheHelper,
    createPromiseStore,
    getFetchedAt,
    getFetchedEphemeral,
    previousSelector,
} from '@proton/redux-utilities';
import { getUser } from '@proton/shared/lib/api/user';
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

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state) => {
            state.error = undefined;
        },
        fulfilled: (state, action: PayloadAction<Model>) => {
            state.value = action.payload;
            state.error = undefined;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(initEvent, (state, action) => {
                if (action.payload.User) {
                    state.value = formatUser(action.payload.User);
                    state.meta.fetchedAt = getFetchedAt();
                    state.meta.fetchedEphemeral = getFetchedEphemeral();
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
export const userActions = slice.actions;
export const userFulfilled = userActions.fulfilled;

const promiseStore = createPromiseStore<Model>();
const previous = previousSelector(selectUser);

export const userThunk = (options?: {
    cache?: CacheType;
}): ThunkAction<Promise<Model>, UserState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument, options });
        };
        const getPayload = async () => {
            const result = await extraArgument.api<{ User: User }>(getUser());
            return formatUser(result.User);
        };
        const cb = async () => {
            try {
                dispatch(userActions.pending());
                const payload = await getPayload();
                dispatch(userActions.fulfilled(payload));
                return payload;
            } catch (error) {
                dispatch(userActions.rejected(miniSerializeError(error)));
                throw error;
            }
        };
        return cacheHelper({ store: promiseStore, select, cb, cache: options?.cache });
    };
};
