import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk } from '@proton/redux-utilities';
import { queryDomainAddresses } from '@proton/shared/lib/api/domains';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { Api, DomainAddress } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';
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
    [name]: { [id: string]: (ModelState<DomainAddress[]> & { meta: { fetchedAt: number } }) | undefined };
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
            let old = selectDomainAddresses(getState())?.[domainID || ''];
            if (old?.meta.fetchedAt === -1) {
                old = undefined;
            }
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
                state[action.meta.id] = { value: action.payload, error: undefined, meta: { fetchedAt: Date.now() } };
            })
            .addCase(modelThunk.rejected, (state, action) => {
                state[action.meta.id] = { value: undefined, error: action.payload, meta: { fetchedAt: Date.now() } };
            });

        builder.addCase(serverEvent, (state, action) => {
            if (action.payload.Domains) {
                for (const domainEvent of action.payload.Domains) {
                    if (domainEvent.Action === EVENT_ACTIONS.DELETE) {
                        delete state[domainEvent.ID];
                    }
                    // Since there's no event loop update for domain addresses, we'll assume an update has happened and re-fetch
                    // all addresses when the domain is updated
                    const value = state[domainEvent.ID];
                    if (domainEvent.Action === EVENT_ACTIONS.UPDATE && value) {
                        value.meta.fetchedAt = -1;
                    }
                }
            }
        });
    },
});

export const domainsAddressesReducer = { [name]: slice.reducer };
export const domainAddressesThunk = modelThunk.thunk;
