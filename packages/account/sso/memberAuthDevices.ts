import { type PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Domain, EnhancedMember, UserModel } from '@proton/shared/lib/interfaces';
import type { MemberAuthDeviceOutput } from '@proton/shared/lib/keys/device';
import { AuthDeviceState, getPendingMemberAuthDevices } from '@proton/shared/lib/keys/device';

import type { AddressKeysState } from '../addressKeys';
import { type DomainsState, domainsThunk } from '../domains';
import { serverEvent } from '../eventLoop';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import type { MembersState } from '../members';
import { selectMembers } from '../members';
import { type OrganizationKeyState, selectOrganizationKey } from '../organizationKey';
import { userThunk } from '../user';
import type { UserKeysState } from '../userKeys';

const name = 'memberAuthDevices' as const;

export interface MemberAuthDevicesState
    extends UserKeysState,
        AddressKeysState,
        OrganizationKeyState,
        MembersState,
        DomainsState {
    [name]: ModelState<MemberAuthDeviceOutput[]>;
}

type SliceState = MemberAuthDevicesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMemberAuthDevices = (state: MemberAuthDevicesState) => state.memberAuthDevices;

export const selectPendingMemberAuthDevices = createSelector(
    [selectMemberAuthDevices, selectMembers, selectOrganizationKey],
    (memberAuthDevices, members, organizationKey) => {
        if (!Boolean(organizationKey?.value?.privateKey)) {
            return {
                pendingAdminActivationsWithMembers: [],
            };
        }

        const devices = memberAuthDevices.value || [];
        const pendingAdminActivations = devices.filter((device) => {
            return device.State === AuthDeviceState.PendingAdminActivation;
        });

        const pendingAdminActivationsWithMembers = pendingAdminActivations.reduce<
            {
                memberAuthDevice: MemberAuthDeviceOutput;
                member: EnhancedMember;
            }[]
        >((acc, memberAuthDevice) => {
            const member = members.value?.find((member) => member.ID === memberAuthDevice.MemberID);
            if (member) {
                acc.push({
                    memberAuthDevice,
                    member,
                });
            }
            return acc;
        }, []);

        return {
            pendingAdminActivationsWithMembers: pendingAdminActivationsWithMembers.sort(
                (a, b) => b.memberAuthDevice.CreateTime - a.memberAuthDevice.CreateTime
            ),
        };
    }
);

export type PendingAdminActivations = ReturnType<
    typeof selectPendingMemberAuthDevices
>['pendingAdminActivationsWithMembers'];
export type PendingAdminActivation = PendingAdminActivations[0];

const canFetch = (user: UserModel, domains: Domain[]) => {
    // If the user is admin and there is at least one domain with sso-intent flag, assume that this is an SSO enabled
    // organization that should fetch member devices.
    return user.isAdmin && domains.some((domain) => domain.Flags['sso-intent']);
};

const modelThunk = createAsyncModelThunk<Model, MemberAuthDevicesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const [user, domains] = await Promise.all([dispatch(userThunk()), dispatch(domainsThunk())]);
        if (!canFetch(user, domains)) {
            return [];
        }
        return getPendingMemberAuthDevices({ api: extraArgument.api }).catch(() => {
            return [];
        });
    },
    previous: previousSelector(selectMemberAuthDevices),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        updateMemberAuthDevice: (state, { payload }: PayloadAction<Partial<MemberAuthDeviceOutput>>) => {
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

            if (action.payload.MemberAuthDevices) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.MemberAuthDevices,
                    itemKey: 'MemberAuthDevice',
                });
            }
        });
    },
});

export const memberAuthDevicesReducer = { [name]: slice.reducer };
export const memberAuthDevicesThunk = modelThunk.thunk;
export const memberAuthDeviceActions = slice.actions;
