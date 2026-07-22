import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSlice, miniSerializeError } from '@reduxjs/toolkit';

import { getEntitlements } from '@proton/payments/core/api/api';
import type { Entitlements } from '@proton/payments/core/entitlements/interface';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { previousSelector } from '@proton/redux-utilities/creator';
import { getFetchedAt, getFetchedEphemeral } from '@proton/redux-utilities/fetchedAt';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import type { CacheType } from '@proton/redux-utilities/interface';
import { cacheHelper, createPromiseStore } from '@proton/redux-utilities/promiseStore';
import type { Api } from '@proton/shared/lib/interfaces';

const name = 'entitlements' as const;

export interface EntitlementsState {
    [name]: ModelState<Entitlements>;
}

type SliceState = EntitlementsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectEntitlements = (state: EntitlementsState) => state[name];

const initialState: SliceState = getInitialModelState<Model>({
    UserEntitlements: [],
    OrganizationEntitlements: [],
    MemberEntitlements: [],
});

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
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
    },
});

const promiseStore = createPromiseStore<Model>();
const previous = previousSelector(selectEntitlements);

const thunk = ({ api: apiOverride, cache }: { api?: Api; cache?: CacheType } = {}): ThunkAction<
    Promise<Model>,
    EntitlementsState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument });
        };
        const cb = async () => {
            try {
                const api = apiOverride ?? extraArgument.api;

                dispatch(slice.actions.pending());
                const entitlements = await getEntitlements(api);
                dispatch(slice.actions.fulfilled(entitlements));
                return entitlements;
            } catch (error) {
                dispatch(slice.actions.rejected(miniSerializeError(error)));
                throw error;
            }
        };

        return cacheHelper({
            store: promiseStore,
            select,
            cb,
            cache,
        });
    };
};

export const entitlementsReducer = { [name]: slice.reducer };
export const entitlementsThunk = thunk;
