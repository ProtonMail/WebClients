import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getSelfMember } from '@proton/shared/lib/api/members';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Member, User } from '@proton/shared/lib/interfaces';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { UserState, userThunk } from '../user';

const name = 'member';

export interface MemberState extends UserState {
    [name]: ModelState<Member>;
}

type SliceState = MemberState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMember = (state: MemberState) => state[name];

const canFetch = (user: User) => isAdmin(user);

const modelThunk = createAsyncModelThunk<Model | undefined, MemberState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        const user = await dispatch(userThunk());
        if (!canFetch(user)) {
            // Return empty member if user is not within an org
            return {} as Member;
        }

        return extraArgument.api<{ Member: Member }>(getSelfMember()).then(({ Member }) => Member);
    },
    previous: previousSelector(selectMember),
});

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state) => {
            state.error = undefined;
        },
        fulfilled: (state, action: PayloadAction<{ value: Model }>) => {
            state.value = action.payload.value;
            state.error = undefined;
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.value = undefined;
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            const membersActions = action.payload.Members;
            // Need to check if value contains ID key because value can
            // be empty object when user is not within an org
            if (state.value && 'ID' in state.value && membersActions) {
                const newValue = updateCollection({
                    model: [state.value],
                    events: membersActions,
                    itemKey: 'Member',
                });
                const selfMemberID = state.value.ID;
                state.value = newValue.find(({ ID }) => ID === selfMemberID);
                if (!state.value) {
                    state.value = initialState.value;
                }
            }
        });
    },
});

export const memberReducer = { [name]: slice.reducer };
export const memberThunk = modelThunk.thunk;
