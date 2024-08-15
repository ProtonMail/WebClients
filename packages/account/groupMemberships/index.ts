import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getGroupMembership } from '@proton/shared/lib/api/groups';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { GroupMembershipReturn } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';
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
        if (!extraArgument.unleashClient.isEnabled('UserGroupsPermissionCheck')) {
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
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }

            if (action.payload.GroupMemberships) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.GroupMemberships,
                    itemKey: 'GroupMembership',
                });
            }
        });
    },
});

export const groupMembershipsReducer = { [name]: slice.reducer };
export const groupMembershipsThunk = modelThunk.thunk;
