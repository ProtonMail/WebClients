import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { defaultVPNServersCountData, getVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

const name = 'vpnServersCount' as const;

export interface VPNServersCountState {
    [name]: ModelState<VPNServersCountData>;
}

type SliceState = VPNServersCountState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectVpnServersCount = (state: VPNServersCountState) => state[name];

const modelThunk = createAsyncModelThunk<Model, VPNServersCountState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return getVPNServersCountData(extraArgument.api);
    },
    previous: previousSelector(selectVpnServersCount),
});

const initialState = getInitialModelState<Model>(defaultVPNServersCountData);
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const vpnServersCountReducer = { [name]: slice.reducer };
export const vpnServersCountThunk = modelThunk.thunk;
