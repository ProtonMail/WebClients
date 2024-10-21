import { type PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import {
    type AuthDeviceOutput,
    AuthDeviceState,
    getAllAuthDevices,
    getValidActivation,
} from '@proton/shared/lib/keys/device';

import type { AddressKeysState } from '../addressKeys';
import { selectAddresses } from '../addresses';
import { serverEvent } from '../eventLoop';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { userThunk } from '../user';
import type { UserKeysState } from '../userKeys';

const name = 'authDevices' as const;

export interface AuthDevicesState extends UserKeysState, AddressKeysState {
    [name]: ModelState<AuthDeviceOutput[]>;
}

type SliceState = AuthDevicesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectAuthDevices = (state: AuthDevicesState) => state.authDevices;

export const selectPendingAuthDevices = createSelector(
    [selectAuthDevices, selectAddresses],
    (authDevicesState, addressesState) => {
        const authDevices = authDevicesState.value || [];
        const addresses = addressesState.value || [];

        const pendingActivations = authDevices.filter((device) => {
            const isActivation =
                device.State === AuthDeviceState.PendingActivation ||
                // Pending admin activation is the same as PendingActivation, the user could go back and realize there's another device
                device.State === AuthDeviceState.PendingAdminActivation;
            return isActivation && Boolean(getValidActivation({ addresses, pendingAuthDevice: device }));
        });

        return {
            pendingActivations: pendingActivations.sort((a, b) => b.CreateTime - a.CreateTime),
        };
    }
);

const modelThunk = createAsyncModelThunk<Model, AuthDevicesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());
        return getAllAuthDevices({ user, api: extraArgument.api });
    },
    previous: previousSelector(selectAuthDevices),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        removeAuthDevice: (state, { payload }: PayloadAction<AuthDeviceOutput>) => {
            if (!state.value) {
                return;
            }
            state.value = state.value.filter((device) => {
                return device.ID !== payload.ID;
            });
        },
        removeAllOtherAuthDevice: (state, { payload }: PayloadAction<AuthDeviceOutput>) => {
            if (!state.value) {
                return;
            }
            state.value = state.value.filter((device) => {
                return device.ID === payload.ID;
            });
        },
        updateAuthDevice: (state, { payload }: PayloadAction<Partial<AuthDeviceOutput>>) => {
            if (!state.value) {
                return;
            }
            state.value = state.value.map((device) => {
                if (device.ID === payload.ID) {
                    return {
                        ...device,
                        ...payload,
                    };
                }
                return device;
            });
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }

            if (action.payload.AuthDevices) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.AuthDevices,
                    itemKey: 'AuthDevice',
                });
            }
        });
    },
});

export const authDevicesReducer = { [name]: slice.reducer };
export const authDevicesThunk = modelThunk.thunk;
export const authDeviceActions = slice.actions;
