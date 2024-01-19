import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryAvailableDomains, queryPremiumDomains } from '@proton/shared/lib/api/domains';
import { Api } from '@proton/shared/lib/interfaces';

import { ModelState } from '../interface';

const name = 'protonDomains';

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
    },
});

export const protonDomainsReducer = { [name]: slice.reducer };
export const protonDomainsThunk = modelThunk.thunk;
