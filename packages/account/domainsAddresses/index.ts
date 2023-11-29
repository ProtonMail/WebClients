import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk } from '@proton/redux-utilities';
import { queryDomainAddresses } from '@proton/shared/lib/api/domains';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import type { Api, DomainAddress } from '@proton/shared/lib/interfaces';

import type { ModelState } from '../interface';

const name = 'domainAddresses' as const;

export const getAllDomainAddresses = (api: Api, domainID: string) => {
    return queryPages((page, pageSize) => {
        return api(
            queryDomainAddresses(domainID, {
                Page: page,
                PageSize: pageSize,
            })
        );
    }).then((pages) => {
        return pages.flatMap(({ Addresses = [] }) => Addresses);
    });
};

export interface DomainAddressesState {
    [name]: { [id: string]: ModelState<DomainAddress[]> };
}

type SliceState = DomainAddressesState[typeof name];

export const selectDomainAddresses = (state: DomainAddressesState) => state.domainAddresses;

const modelThunk = createAsyncModelThunk<DomainAddress[], DomainAddressesState, ProtonThunkArguments, string>(
    `${name}/fetch`,
    {
        miss: async ({ options, extraArgument }) => {
            const domainID = options?.thunkArg;
            if (!domainID) {
                return [];
            }
            return getAllDomainAddresses(extraArgument.api, domainID);
        },
        previous: ({ getState, options }) => {
            const domainID = options?.thunkArg;
            const old = selectDomainAddresses(getState())?.[domainID || ''];
            return {
                value: old?.value,
                error: old?.error,
            };
        },
    }
);

const initialState: SliceState = {};
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(modelThunk.pending, (state, action) => {
                const oldValue = state[action.meta.id];
                if (oldValue && oldValue.error) {
                    oldValue.error = undefined;
                }
            })
            .addCase(modelThunk.fulfilled, (state, action) => {
                state[action.meta.id] = { value: action.payload, error: undefined };
            })
            .addCase(modelThunk.rejected, (state, action) => {
                state[action.meta.id] = { value: undefined, error: action.payload };
            });
    },
});

export const domainsAddressesReducer = { [name]: slice.reducer };
export const domainAddressesThunk = modelThunk.thunk;
