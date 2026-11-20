import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { getIsMissingScopeError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryServiceAccounts } from '@proton/shared/lib/api/serviceAccounts';
import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';

const name = 'serviceAccounts';

export interface ServiceAccountsState {
    [name]: ModelState<ServiceAccount[]>;
}

export const selectServiceAccounts = (state: ServiceAccountsState) => state[name];

const modelThunk = createAsyncModelThunk<ServiceAccount[], ServiceAccountsState, ProtonThunkArguments>(
    `${name}/fetch`,
    {
        miss: async ({ extraArgument }) => {
            try {
                const { ServiceAccounts } = await extraArgument.api<{ ServiceAccounts: ServiceAccount[] }>(
                    queryServiceAccounts()
                );
                return ServiceAccounts;
            } catch (error) {
                if (getIsMissingScopeError(error)) {
                    return [];
                }
                throw error;
            }
        },
        previous: previousSelector(selectServiceAccounts),
    }
);

const slice = createSlice({
    name,
    initialState: getInitialModelState<ServiceAccount[]>(),
    reducers: {
        removeServiceAccount: (state, action: PayloadAction<ServiceAccount>) => {
            state.value = state.value?.filter(({ MemberID }) => MemberID !== action.payload.MemberID);
        },
        setServiceAccountState: (state, action: PayloadAction<Pick<ServiceAccount, 'MemberID' | 'State'>>) => {
            const account = state.value?.find(({ MemberID }) => MemberID === action.payload.MemberID);
            if (account) {
                account.State = action.payload.State;
            }
        },
        upsertServiceAccount: (state, action: PayloadAction<ServiceAccount>) => {
            const index = state.value?.findIndex(({ MemberID }) => MemberID === action.payload.MemberID) ?? -1;
            if (index >= 0) {
                state.value![index] = action.payload;
            } else {
                state.value?.push(action.payload);
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const serviceAccountsReducer = { [name]: slice.reducer };
export const serviceAccountsThunk = modelThunk.thunk;
export const { removeServiceAccount, setServiceAccountState, upsertServiceAccount } = slice.actions;

// shortcut: returns a request that is already running, which may predate the caller's last change (shared cacheHelper
// behaviour). On a slow network a row can then show its old state until the next visit; wait and refetch if it matters.
export const refetchServiceAccounts = () => serviceAccountsThunk({ cache: CacheType.None });
