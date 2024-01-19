import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk } from '@proton/redux-utilities';
import { DAY } from '@proton/shared/lib/constants';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { defaultVPNServersCountData, getVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';

import type { ModelState } from '../interface';

const name = 'vpnServersCount';

export interface VPNServersCountState {
    [name]: ModelState<VPNServersCountData> & { syncedAt: number };
}

type SliceState = VPNServersCountState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectVpnServersCount = (state: VPNServersCountState) => state[name];

const modelThunk = createAsyncModelThunk<Model, VPNServersCountState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return getVPNServersCountData(extraArgument.api);
    },
    previous: (extra) => {
        const value = selectVpnServersCount(extra.getState());
        if (value.syncedAt === -1 || Date.now() - value.syncedAt > 7 * DAY) {
            return { value: undefined, error: undefined };
        }
        return value;
    },
});

const initialState: SliceState = {
    value: defaultVPNServersCountData,
    error: undefined,
    syncedAt: -1,
};
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        return builder
            .addCase(modelThunk.pending, (state) => {
                state.error = undefined;
                state.syncedAt = Date.now();
            })
            .addCase(modelThunk.fulfilled, (state, action) => {
                state.value = action.payload;
                state.error = undefined;
                state.syncedAt = Date.now();
            })
            .addCase(modelThunk.rejected, (state, action) => {
                state.error = action.payload;
                state.value = undefined;
                state.syncedAt = Date.now();
            });
    },
});

export const vpnServersCountReducer = { [name]: slice.reducer };
export const vpnServersCountThunk = modelThunk.thunk;
