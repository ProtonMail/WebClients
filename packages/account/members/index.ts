import { createSlice, original } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getAllMembers } from '@proton/shared/lib/api/members';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Member, User } from '@proton/shared/lib/interfaces';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { UserState, userThunk } from '../user';

const name = 'members' as const;

interface State extends UserState {
    [name]: ModelState<Member[]>;
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMembers = (state: State) => state.members;

const canFetch = (user: User) => {
    return isAdmin(user);
};

const freeMembers: Member[] = [];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());
        if (canFetch(user)) {
            return getAllMembers(extraArgument.api);
        }
        return freeMembers;
    },
    previous: previousSelector(selectMembers),
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
        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }

            if (action.payload.Members) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.Members,
                    itemKey: 'Member',
                });
            }

            const isFreeMembers = original(state)?.value === freeMembers;

            if (!isFreeMembers && action.payload.User && !canFetch(action.payload.User)) {
                // Do not get any members update when user becomes unsubscribed.
                state.value = freeMembers;
            }

            if (isFreeMembers && action.payload.User && canFetch(action.payload.User)) {
                delete state.value;
                delete state.error;
            }
        });
    },
});

export const membersReducer = { [name]: slice.reducer };
export const membersThunk = modelThunk.thunk;
