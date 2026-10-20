import {
    type PayloadAction,
    type ThunkAction,
    type UnknownAction,
    createSelector,
    createSlice,
} from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import type { EnhancedMember } from '@proton/shared/lib/interfaces/Member';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { MemberAuthDeviceOutput } from '@proton/shared/lib/keys/device';
import { AuthDeviceState, getMemberAuthDevice, getPendingMemberAuthDevices } from '@proton/shared/lib/keys/device';

import type { AddressKeysState } from '../addressKeys';
import { type DomainsState, domainsThunk } from '../domains';
import { serverEvent } from '../eventLoop';
import type { MembersState } from '../members';
import { selectMembers } from '../members';
import { type OrganizationKeyState, selectOrganizationKey } from '../organizationKey';
import { userThunk } from '../user';
import type { UserKeysState } from '../userKeys';

const name = 'memberAuthDevices' as const;

export interface MemberAuthDevicesState
    extends UserKeysState, AddressKeysState, OrganizationKeyState, MembersState, DomainsState {
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
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<MemberAuthDeviceOutput>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload);
            }
        },
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

export const memberAuthDevicesEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: CoreEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, MemberAuthDevicesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.MemberAuthDevices,
            get: (deviceID) => getMemberAuthDevice({ api, deviceID }),
            refetch: () => dispatch(memberAuthDevicesThunk({ cache: CacheType.None })),
            update: (result) => dispatch(memberAuthDeviceActions.eventLoopV6(result)),
        });
    };
};
