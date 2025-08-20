import { type PayloadAction, type UnknownAction, createSlice, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    CacheType,
    cacheHelper,
    createPromiseMapStore,
    getFetchedAt,
    getFetchedEphemeral,
} from '@proton/redux-utilities';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { getGroupMember, getGroupMembers } from '@proton/shared/lib/api/groups';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import { type Api, GROUP_MEMBER_STATE, type GroupMember, type User } from '@proton/shared/lib/interfaces';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { type UserState, userThunk } from '../user';

const { DELETE } = EVENT_ACTIONS;

const name = 'groupMembers' as const;

export interface GroupMembers {
    [MemberID: string]: GroupMember;
}

export interface GroupMemberByIDByGroupID {
    [GroupID: string]: ModelState<GroupMembers | undefined>;
}

export interface GroupMembersState extends UserState {
    [name]: GroupMemberByIDByGroupID;
}

type SliceState = GroupMembersState[typeof name];

export const selectGroupMembers = (state: GroupMembersState) => state[name];

const fetchGroupMember = (api: Api, memberID: string) =>
    api<{ GroupMember: GroupMember }>(getGroupMember(memberID)).then((response) => response.GroupMember);

const initialState: SliceState = {};

const getValue = (value: GroupMembers) => {
    return {
        value,
        error: undefined,
        meta: { fetchedAt: getFetchedAt(), fetchedEphemeral: getFetchedEphemeral() },
    };
};

const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<GroupMember>>) => {
            const groups = Object.values(state);
            for (const memberID of action.payload.delete) {
                for (const group of groups) {
                    if (group.value?.[memberID]) {
                        delete group.value[memberID];
                    }
                }
            }
            for (const groupMember of action.payload.upsert) {
                const { GroupID, GroupId, ID: memberID } = groupMember;
                const groupId = GroupId ?? GroupID;
                if (!state[groupId]?.value) {
                    state[groupId] = getValue({ [memberID]: groupMember });
                } else {
                    state[groupId].value[memberID] = groupMember;
                }
            }
        },
        pending: (state, action: PayloadAction<{ id: string }>) => {
            const oldValue = state[action.payload.id];
            if (oldValue && oldValue.error) {
                oldValue.error = undefined;
            }
        },
        fulfilled: (state, action: PayloadAction<{ value: GroupMembers; id: string }>) => {
            state[action.payload.id] = getValue(action.payload.value);
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
        resumeGroupMember: (state, action: PayloadAction<{ groupID: string; memberID: string }>) => {
            const { groupID, memberID } = action.payload;

            const group = state[groupID]?.value;

            if (group && group[memberID]) {
                group[memberID].State = GROUP_MEMBER_STATE.ACTIVE;
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
                const { GroupID, GroupId, ID: id } = groupMember;
                if (!(GroupId || GroupID) || !id) {
                    continue;
                }
                const groupId = GroupId ?? GroupID;
                const group = state[groupId]?.value;

                if (!group) {
                    continue;
                }

                group[id] = groupMember;
            }
        });
    },
});
export const { updateOverridePermissions, resumeGroupMember } = slice.actions;
const promiseStore = createPromiseMapStore<GroupMembers>();

const canFetch = (user: User) => isAdmin(user);

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
                const user = await dispatch(userThunk());
                if (!canFetch(user)) {
                    return {};
                }

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

export const updateMembersAfterEdit = ({
    groupId,
}: {
    groupId: string;
}): ThunkAction<void, GroupMembersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        try {
            await dispatch(groupMembersThunk({ groupId, cache: CacheType.None }));
        } catch (error) {
            console.error('Error', error);
        }
    };
};

export const groupMembersReducer = { [name]: slice.reducer };
export const groupMembersActions = slice.actions;

export const groupMembersEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: CoreEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, GroupMembersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const user = await dispatch(userThunk());
        if (!canFetch(user)) {
            return;
        }
        await updateCollectionAsyncV6({
            n: 100,
            events: event.GroupMembers,
            get: (memberID: string) => fetchGroupMember(api, memberID),
            // This is not supported since it targets a specific group.
            refetch: async () => [],
            update: (result) => dispatch(groupMembersActions.eventLoopV6(result)),
        });
    };
};
