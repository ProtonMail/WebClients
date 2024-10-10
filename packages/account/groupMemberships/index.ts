import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getGroupMembership } from '@proton/shared/lib/api/groups';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import updateCollection, { type EventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';
import {
    GROUP_MEMBER_PERMISSIONS,
    type GroupMember,
    type GroupMembership,
    type GroupMembershipReturn,
} from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

const name = 'groupMemberships';

export interface GroupMembershipsState {
    [name]: ModelState<GroupMembershipReturn[]>;
}

type SliceState = GroupMembershipsState[typeof name];
type Model = NonNullable<SliceState['value']>;

const initialState: SliceState = getInitialModelState<GroupMembershipReturn[]>();

export const selectGroupMemberships = (state: GroupMembershipsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, GroupMembershipsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        if (!extraArgument.unleashClient.isEnabled('UserGroupsMembersPermissionCheck')) {
            return [];
        }
        return extraArgument
            .api(getGroupMembership())
            .then(({ Memberships }: { Memberships: GroupMembershipReturn[] }): GroupMembershipReturn[] => Memberships)
            .catch(() => []);
    },
    previous: previousSelector(selectGroupMemberships),
});

const slice = createSlice({
    name,
    initialState,
    reducers: {
        acceptMembership: (state, action: PayloadAction<GroupMembership>) => {
            if (state.value && action.payload) {
                const membershipIndex = state.value.findIndex((membership) => membership.ID === action.payload.ID);
                if (membershipIndex !== -1) {
                    const membership = state.value[membershipIndex];
                    membership.State = 1;
                    membership.Permissions = setBit(membership.Permissions, GROUP_MEMBER_PERMISSIONS.LEAVE);
                }
            }
        },
        declineOrLeaveMembership: (state, action: PayloadAction<GroupMembership>) => {
            if (state.value && action.payload) {
                const updatedMemberships = state.value.filter((membership) => membership.ID !== action.payload.ID);
                state.value = updatedMemberships;
            }
        },
        updateGroupMemberships: (
            state,
            action: PayloadAction<{
                GroupMemberships: EventItemUpdate<GroupMember, 'GroupMember'>[];
            }>
        ) => {
            state.value = updateCollection({
                model: state.value,
                events: action.payload.GroupMemberships,
                itemKey: 'GroupMember',
            });
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const { acceptMembership, declineOrLeaveMembership, updateGroupMemberships } = slice.actions;

export const groupMembershipsReducer = { [name]: slice.reducer };
export const groupMembershipsThunk = modelThunk.thunk;
