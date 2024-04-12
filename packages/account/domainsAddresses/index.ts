import { type PayloadAction, type UnknownAction, createSlice, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createPromiseMapCache } from '@proton/redux-utilities';
import { queryDomainAddresses } from '@proton/shared/lib/api/domains';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { Api, DomainAddress } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';

const name = 'domainAddresses' as const;

export const getAllDomainAddresses = (api: Api, domainID: string) => {
    return queryPages((page, pageSize) => {
        return api<{ Addresses: DomainAddress[]; Total: number }>(
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

const initialState: SliceState = {};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state, action: PayloadAction<{ id: string }>) => {
            const oldValue = state[action.payload.id];
            if (oldValue && oldValue.error) {
                oldValue.error = undefined;
            }
        },
        fulfilled: (state, action: PayloadAction<{ id: string; value: DomainAddress[] }>) => {
            state[action.payload.id] = {
                value: action.payload.value,
                error: undefined,
                meta: { fetchedAt: Date.now() },
            };
        },
        rejected: (state, action: PayloadAction<{ id: string; value: any }>) => {
            state[action.payload.id] = {
                value: undefined,
                error: action.payload,
                meta: { fetchedAt: Date.now() },
            };
        },
    },
    extraReducers: (builder) => {
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

type SliceState = DomainAddressesState[typeof name];

export const selectDomainAddresses = (state: DomainAddressesState) => state.domainAddresses;

const promiseCache = createPromiseMapCache<DomainAddress[]>();

export const domainAddressesThunk = ({
    domainID,
    forceFetch,
}: {
    domainID: string;
    forceFetch?: boolean;
}): ThunkAction<Promise<DomainAddress[]>, DomainAddressesState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            const oldValue = selectDomainAddresses(getState())?.[domainID || ''];
            if (oldValue?.value !== undefined && oldValue.meta.fetchedAt !== -1 && !forceFetch) {
                return Promise.resolve(oldValue.value);
            }
        };
        const cb = async () => {
            try {
                dispatch(slice.actions.pending({ id: domainID }));
                const value = await getAllDomainAddresses(extraArgument.api, domainID);
                dispatch(slice.actions.fulfilled({ id: domainID, value }));
                return value;
            } catch (error) {
                dispatch(slice.actions.rejected({ id: domainID, value: miniSerializeError(error) }));
                throw error;
            }
        };
        return promiseCache(domainID, select, cb);
    };
};

export const domainsAddressesReducer = { [name]: slice.reducer };
