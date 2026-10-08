import {
    type PayloadAction,
    type SerializedError,
    type ThunkAction,
    type UnknownAction,
    createSlice,
    miniSerializeError,
} from '@reduxjs/toolkit';

import { getEntitlementCatalog } from '@proton/payments/core/api/api';
import type { EntitlementCatalog } from '@proton/payments/core/entitlements/interface';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { previousSelector } from '@proton/redux-utilities/creator';
import { getFetchedAt, getFetchedEphemeral } from '@proton/redux-utilities/fetchedAt';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import type { CacheType } from '@proton/redux-utilities/interface';
import { cacheHelper, createPromiseStore } from '@proton/redux-utilities/promiseStore';
import { DAY } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

const name = 'entitlementCatalog' as const;

export interface EntitlementCatalogState {
    [name]: ModelState<EntitlementCatalog>;
}

type SliceState = EntitlementCatalogState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectEntitlementCatalog = (state: EntitlementCatalogState) => state[name];

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
        rejected: (state, action: PayloadAction<SerializedError>) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
    },
});

const promiseStore = createPromiseStore<Model>();
const previous = previousSelector(selectEntitlementCatalog);

const thunk = ({ cache, api: apiOverride }: { cache?: CacheType; api?: Api } = {}): ThunkAction<
    Promise<Model>,
    EntitlementCatalogState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument });
        };
        const cb = async () => {
            try {
                dispatch(slice.actions.pending());
                const catalog = await getEntitlementCatalog(apiOverride ?? extraArgument.api);
                dispatch(slice.actions.fulfilled(catalog));
                return catalog;
            } catch (error) {
                dispatch(slice.actions.rejected(miniSerializeError(error)));
                throw error;
            }
        };

        return cacheHelper({ store: promiseStore, select, cb, cache, expiry: DAY });
    };
};

export const entitlementCatalogReducer = { [name]: slice.reducer };
export const entitlementCatalogThunk = thunk;
