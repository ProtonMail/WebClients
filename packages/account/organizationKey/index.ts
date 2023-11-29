import { ListenerEffectAPI, createSlice } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import { CryptoProxy } from '@proton/crypto';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store';
import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getOrganizationKeys } from '@proton/shared/lib/api/organization';
import authentication from '@proton/shared/lib/authentication/authentication';
import type { CachedOrganizationKey, OrganizationKey } from '@proton/shared/lib/interfaces';
import { getCachedOrganizationKey } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { OrganizationState, organizationThunk } from '../organization';
import { UserState, userThunk } from '../user';

const name = 'organizationKey' as const;

export interface OrganizationKeyState extends UserState, OrganizationState {
    [name]: ModelState<CachedOrganizationKey>;
}

type SliceState = OrganizationKeyState[typeof name];
type Model = SliceState['value'];

export const selectOrganizationKey = (state: OrganizationKeyState) => state.organizationKey;

const modelThunk = createAsyncModelThunk<Model, OrganizationKeyState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const [user, organization] = await Promise.all([dispatch(userThunk()), dispatch(organizationThunk())]);
        if (!user.isAdmin || !organization.HasKeys) {
            return;
        }
        const Key = await extraArgument.api<OrganizationKey>(getOrganizationKeys());
        return getCachedOrganizationKey({ keyPassword: authentication.getPassword(), Key });
    },
    previous: previousSelector(selectOrganizationKey),
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

export const organizationKeyReducer = { [name]: slice.reducer };
export const organizationKeyThunk = modelThunk.thunk;

export const organizationKeysListener = (startListening: SharedStartListening<OrganizationKeyState>) => {
    startListening({
        predicate: (action: AnyAction, currentState: OrganizationKeyState) => {
            // Warning: There is no event update coming for organization key changes, however, an update for the organization
            // is received as the keys are changed. So each time it changes, it will redo this.
            return !!(
                serverEvent.match(action) &&
                action.payload.Organization &&
                !!selectOrganizationKey(currentState).value
            );
        },
        effect: async (action, listenerApi) => {
            await listenerApi.dispatch(
                organizationKeyThunk({
                    forceFetch: true,
                })
            );
        },
    });

    startListening({
        predicate: (action: AnyAction, currentState: OrganizationKeyState, nextState: OrganizationKeyState) => {
            const oldValue = selectOrganizationKey(currentState).value;
            return !!(oldValue && oldValue !== selectOrganizationKey(nextState).value);
        },
        effect: async (
            action: AnyAction,
            listenerApi: ListenerEffectAPI<
                OrganizationKeyState,
                ProtonDispatch<OrganizationKeyState>,
                ProtonThunkArguments
            >
        ) => {
            const oldValue = selectOrganizationKey(listenerApi.getOriginalState())?.value;
            if (oldValue?.privateKey) {
                await CryptoProxy.clearKey({ key: oldValue.privateKey }).catch(noop);
            }
        },
    });
};
