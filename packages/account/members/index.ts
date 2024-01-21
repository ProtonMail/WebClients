import { createAsyncThunk, createSlice, original } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getAllMemberAddresses, getAllMembers } from '@proton/shared/lib/api/members';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Address, Member, User } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import { AddressesState } from '../addresses';
import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { UserState, userThunk } from '../user';

const name = 'members' as const;

export type EnhancedMember = Member & { addressState: 'stale' | 'partial' | 'full' | 'pending' | 'rejected' };

export interface MembersState extends UserState, AddressesState {
    [name]: ModelState<EnhancedMember[]>;
}

type SliceState = MembersState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMembers = (state: MembersState) => state.members;

const canFetch = (user: User) => {
    return isAdmin(user);
};

const freeMembers: EnhancedMember[] = [];

const modelThunk = createAsyncModelThunk<Model, MembersState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());
        if (canFetch(user)) {
            return getAllMembers(extraArgument.api).then((members): EnhancedMember[] => {
                return members.map((member) => ({
                    ...member,
                    addressState: 'partial' as const,
                }));
            });
        }
        return freeMembers;
    },
    previous: previousSelector(selectMembers),
});

const getMemberFromState = (state: ModelState<EnhancedMember[]>, target: EnhancedMember) => {
    return state.value?.find((member) => member.ID === target.ID);
};

export const getMemberAddresses = createAsyncThunk<
    Address[],
    { member: EnhancedMember; retry?: boolean },
    {
        state: MembersState;
        extra: ProtonThunkArguments;
    }
>(
    `${name}/fetch-address`,
    ({ member: targetMember }, { extra }) => {
        return getAllMemberAddresses(extra.api, targetMember.ID).then(sortAddresses);
    },
    {
        condition: ({ member: targetMember, retry }, { getState }) => {
            const member = getMemberFromState(selectMembers(getState()), targetMember);
            return !(
                Boolean(member?.Self) ||
                member?.addressState === 'pending' ||
                (member?.addressState === 'rejected' && !retry)
            );
        },
    }
);

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

        builder.addCase(getMemberAddresses.pending, (state, action) => {
            const member = getMemberFromState(state, action.meta.arg.member);
            if (member) {
                member.addressState = 'pending';
            }
        });

        builder.addCase(getMemberAddresses.rejected, (state, action) => {
            const member = getMemberFromState(state, action.meta.arg.member);
            if (member) {
                member.addressState = 'rejected';
            }
        });

        builder.addCase(getMemberAddresses.fulfilled, (state, action) => {
            const member = getMemberFromState(state, action.meta.arg.member);
            if (member) {
                member.addressState = 'full';
                member.Addresses = action.payload;
            }
        });

        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }

            if (action.payload.Members) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.Members,
                    itemKey: 'Member',
                    create: (a): EnhancedMember => {
                        return {
                            ...a,
                            addressState: 'partial',
                        };
                    },
                    merge: (a, b): EnhancedMember => {
                        return {
                            ...a,
                            ...b,
                            // We don't receive an update for addresses in member updates. So we mark it as stale so that we can still display
                            // the old value, but fetch new one if needed.
                            addressState: a.Addresses && !b.Addresses ? 'stale' : 'partial',
                        };
                    },
                });
            } else {
                const isFreeMembers = original(state)?.value === freeMembers;

                if (!isFreeMembers && action.payload.User && !canFetch(action.payload.User)) {
                    // Do not get any members update when user becomes unsubscribed.
                    state.value = freeMembers;
                }

                if (isFreeMembers && action.payload.User && canFetch(action.payload.User)) {
                    delete state.value;
                    delete state.error;
                }
            }
        });
    },
});

export const membersReducer = { [name]: slice.reducer };
export const membersThunk = modelThunk.thunk;
