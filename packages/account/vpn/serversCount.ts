import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk } from '@proton/redux-utilities';
import { DAY } from '@proton/shared/lib/constants';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { defaultVPNServersCountData, getVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';

import type { ModelState } from '../interface';

const name = 'vpnServersCount';

export interface VPNServersCountState {
    [name]: ModelState<VPNServersCountData> & { meta: { fetchedAt: number } };
}

type SliceState = VPNServersCountState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectVpnServersCount = (state: VPNServersCountState) => state[name];

const modelThunk = createAsyncModelThunk<Model, VPNServersCountState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return getVPNServersCountData(extraArgument.api);
    },
    previous: (extra) => {
        const state = selectVpnServersCount(extra.getState());
        const { value, meta } = state;
        if (value !== undefined && Date.now() - meta.fetchedAt < 1 * DAY) {
            return value;
        }
        return undefined;
    },
});

const initialState: SliceState = {
    value: defaultVPNServersCountData,
    error: undefined,
    meta: { fetchedAt: 0 },
};
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        return builder
            .addCase(modelThunk.pending, (state) => {
                state.error = undefined;
            })
            .addCase(modelThunk.fulfilled, (state, action) => {
                state.value = action.payload;
                state.error = undefined;
                state.meta.fetchedAt = Date.now();
            })
            .addCase(modelThunk.rejected, (state, action) => {
                state.error = action.payload;
                state.value = undefined;
                state.meta.fetchedAt = Date.now();
            });
    },
});

export const vpnServersCountReducer = { [name]: slice.reducer };
export const vpnServersCountThunk = modelThunk.thunk;
