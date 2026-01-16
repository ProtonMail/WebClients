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
import { getGroupOwnerInvites } from '@proton/shared/lib/api/groups';
import type { GroupOwnerInvite } from '@proton/shared/lib/interfaces';

import type { ModelState } from '../interface';
import type { UserState } from '../user';

const name = 'groupOwnerInvites' as const;

export interface GroupOwnerInvites {
    [InviteID: string]: GroupOwnerInvite;
}

export interface GroupOwnerInvitesState extends UserState {
    [name]: ModelState<GroupOwnerInvites | undefined>;
}

type SliceState = GroupOwnerInvitesState[typeof name];

export const selectGroupOwnerInvites = (state: GroupOwnerInvitesState) => state[name];

const initialState: SliceState = {
    value: undefined,
    error: undefined,
    meta: { fetchedAt: 0, fetchedEphemeral: undefined },
};

const getValue = (value: GroupOwnerInvites) => {
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
        pending: (state) => {
            if (state && state.error) {
                state.error = undefined;
            }
        },
        fulfilled: (_state, action: PayloadAction<{ value: GroupOwnerInvites }>) => {
            return getValue(action.payload.value);
        },
        rejected: (_state, action) => {
            return {
                value: undefined,
                error: action.payload.value,
                meta: { fetchedAt: getFetchedAt(), fetchedEphemeral: undefined },
            };
        },
        deleteInvite: (state, action: PayloadAction<{ inviteID: string }>) => {
            if (state.value && state.value[action.payload.inviteID]) {
                delete state.value[action.payload.inviteID];
            }
        },
    },
});

export const { deleteInvite } = slice.actions;
const promiseStore = createPromiseMapStore<GroupOwnerInvites>();

export const groupOwnerInvitesThunk = ({
    cache,
}: {
    cache?: CacheType;
} = {}): ThunkAction<Promise<GroupOwnerInvites>, GroupOwnerInvitesState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return selectGroupOwnerInvites(getState());
        };
        const cb = async () => {
            try {
                dispatch(slice.actions.pending());

                const { Invites: invites } = await extraArgument.api<{
                    Invites: GroupOwnerInvite[];
                }>(getGroupOwnerInvites());

                const value = invites.reduce<GroupOwnerInvites>((acc, elem) => {
                    acc[elem.GroupOwnerInviteID] = elem;
                    return acc;
                }, {});

                dispatch(slice.actions.fulfilled({ value }));

                return value;
            } catch (error) {
                dispatch(slice.actions.rejected({ value: miniSerializeError(error) }));
                return {};
            }
        };
        return cacheHelper({ store: promiseStore, key: name, select, cb, cache });
    };
};

export const groupOwnerInvitesReducer = { [name]: slice.reducer };
export const groupOwnerInvitesActions = slice.actions;

export const groupOwnerInvitesEventLoopV6Thunk = ({
    event,
}: {
    event: CoreEventV6Response;
}): ThunkAction<Promise<void>, GroupOwnerInvitesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        if (!event.GroupOwners?.length) {
            return;
        }

        // Re-fetch all invites (previous ones will be cleaned and auto-accepted via listener)
        await dispatch(groupOwnerInvitesThunk({ cache: CacheType.None }));
    };
};
