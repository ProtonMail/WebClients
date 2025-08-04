import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryAvailableDomains, queryPremiumDomains } from '@proton/shared/lib/api/domains';
import type { Api } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import { type ModelState } from '../interface';

const name = 'protonDomains' as const;

export interface ProtonDomainsState {
    [name]: ModelState<{ premiumDomains: string[]; protonDomains: string[] }>;
}

type SliceState = ProtonDomainsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectProtonDomains = (state: ProtonDomainsState) => state[name];
const getDomains = async (api: Api) => {
    const [premiumDomains, protonDomains] = await Promise.all([
        api(queryPremiumDomains()).then(({ Domains = [] }) => Domains),
        api(queryAvailableDomains()).then(({ Domains = [] }) => Domains),
    ]);
    return {
        premiumDomains,
        protonDomains,
    };
};

const modelThunk = createAsyncModelThunk<Model, ProtonDomainsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return getDomains(extraArgument.api);
    },
    previous: previousSelector(selectProtonDomains),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const protonDomainsReducer = { [name]: slice.reducer };
export const protonDomainsThunk = modelThunk.thunk;
