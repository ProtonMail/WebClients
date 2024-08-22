import { type PayloadAction, type UnknownAction, createSlice, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    type CacheType,
    cacheHelper,
    createPromiseMapStore,
    getFetchedAt,
    getFetchedEphemeral,
} from '@proton/redux-utilities';
import { getGroupMembers } from '@proton/shared/lib/api/groups';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { GroupMember } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';

const { DELETE } = EVENT_ACTIONS;

const name = 'groupMembers' as const;

export interface GroupMembers {
    [MemberID: string]: GroupMember;
}

export interface GroupMemberByIDByGroupID {
    [GroupID: string]: ModelState<GroupMembers | undefined>;
}

export interface GroupMembersState {
    [name]: GroupMemberByIDByGroupID;
}

type SliceState = GroupMembersState[typeof name];

export const selectGroupMembers = (state: GroupMembersState) => state[name];

const initialState: SliceState = {};

const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state, action: PayloadAction<{ id: string }>) => {
            const oldValue = state[action.payload.id];
            if (oldValue && oldValue.error) {
                oldValue.error = undefined;
            }
        },
        fulfilled: (state, action: PayloadAction<{ value: GroupMembers; id: string }>) => {
            state[action.payload.id] = {
                value: action.payload.value,
                error: undefined,
                meta: { fetchedAt: getFetchedAt(), fetchedEphemeral: getFetchedEphemeral() },
            };
        },
        rejected: (state, action) => {
            state[action.payload.id] = {
                value: undefined,
                error: action.payload.value,
                meta: { fetchedAt: getFetchedAt(), fetchedEphemeral: undefined },
            };
        },
        updateOverridePermissions: (
            state,
            action: PayloadAction<{ groupID: string; memberID: string; newValue: number }>
        ) => {
            const { groupID, memberID, newValue } = action.payload;

            const group = state[groupID]?.value;

            if (group && group[memberID]) {
                group[memberID].Permissions = newValue;
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(serverEvent, (state, action) => {
            if (!state || !action.payload.GroupMembers) {
                return;
            }

            const { GroupMembers: groupMemberEvents } = action.payload;

            for (const event of groupMemberEvents) {
                const { Action: action } = event;
                if (action === DELETE) {
                    // go through all groups and see if we have this member ID
                    for (const group of Object.values(state)) {
                        if (group.value?.[event.ID]) {
                            delete group.value[event.ID];
                            break;
                        }
                    }
                    continue;
                }

                const groupMember = event.GroupMember as GroupMember;
                const { GroupID: groupId, ID: id } = groupMember;
                if (!groupId || !id) {
                    continue;
                }
                const group = state[groupId]?.value;

                if (!group) {
                    continue;
                }

                group[id] = groupMember;
            }
        });
    },
});
export const { updateOverridePermissions } = slice.actions;
const promiseStore = createPromiseMapStore<GroupMembers>();

export const groupMembersThunk = ({
    groupId,
    cache,
}: {
    groupId: string;
    cache?: CacheType;
}): ThunkAction<Promise<GroupMembers>, GroupMembersState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return selectGroupMembers(getState())?.[groupId || ''];
        };
        const cb = async () => {
            try {
                dispatch(slice.actions.pending({ id: groupId }));

                const { Members: groupMembers } = await extraArgument.api<{
                    Members: GroupMember[];
                }>(getGroupMembers(groupId));

                const value = groupMembers.reduce<GroupMembers>((acc, elem) => {
                    acc[elem.ID] = elem;
                    return acc;
                }, {});

                dispatch(slice.actions.fulfilled({ id: groupId, value }));

                return value;
            } catch (error) {
                dispatch(slice.actions.rejected({ id: groupId, value: miniSerializeError(error) }));
                return {};
            }
        };
        return cacheHelper({ store: promiseStore, key: groupId, select, cb, cache });
    };
};

export const groupMembersReducer = { [name]: slice.reducer };
