import { PayloadAction, ThunkAction, UnknownAction, createSlice, original } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getAllMemberAddresses, getAllMembers } from '@proton/shared/lib/api/members';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Address, Api, EnhancedMember, Member, User } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import { AddressesState, addressesThunk } from '../addresses';
import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { UserState, userThunk } from '../user';

const name = 'members' as const;

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

const getMemberFromState = (state: ModelState<EnhancedMember[]>, target: Member) => {
    return state.value?.find((member) => member.ID === target.ID);
};

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        memberFetchFulfilled: (state, action: PayloadAction<{ member: Member; addresses: Address[] }>) => {
            const member = getMemberFromState(state, action.payload.member);
            if (member) {
                member.addressState = 'full';
                member.Addresses = action.payload.addresses;
            }
        },
        memberFetchPending: (state, action: PayloadAction<{ member: Member }>) => {
            const member = getMemberFromState(state, action.payload.member);
            if (member) {
                member.addressState = 'pending';
            }
        },
        memberFetchRejected: (state, action: PayloadAction<{ member: Member }>) => {
            const member = getMemberFromState(state, action.payload.member);
            if (member) {
                member.addressState = 'rejected';
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);

        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }

            const isFreeMembers = original(state)?.value === freeMembers;
            if (action.payload.Members && !isFreeMembers) {
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

const getTemporaryPromiseMap = (() => {
    let map: undefined | Map<string, Promise<Address[]>>;
    return () => {
        if (!map) {
            map = new Map();
        }
        return map;
    };
})();

export const getMemberAddresses = ({
    member: targetMember,
    retry,
}: {
    member: Member;
    retry?: boolean;
}): ThunkAction<Promise<Address[]>, MembersState, ProtonThunkArguments, UnknownAction> => {
    const fetch = (api: Api, ID: string) => getAllMemberAddresses(api, ID).then(sortAddresses);

    const map = getTemporaryPromiseMap();

    return async (dispatch, getState, extra) => {
        const member = getMemberFromState(selectMembers(getState()), targetMember);
        if (!member) {
            return [];
        }
        if (Boolean(member.Self)) {
            return dispatch(addressesThunk());
        }
        if (member.addressState === 'full' && member.Addresses) {
            return member.Addresses;
        }
        if (member.addressState === 'rejected' && !retry) {
            return [];
        }
        const oldPromise = map.get(member.ID);
        if (oldPromise) {
            return oldPromise;
        }
        const promise = fetch(extra.api, member.ID);
        try {
            map.set(member.ID, promise);
            dispatch(slice.actions.memberFetchPending({ member }));
            const result = await promise;
            dispatch(slice.actions.memberFetchFulfilled({ member, addresses: result }));
            return result;
        } catch (e) {
            dispatch(slice.actions.memberFetchRejected({ member }));
            throw e;
        } finally {
            map.delete(member.ID);
        }
    };
};

export const membersReducer = { [name]: slice.reducer };
export const membersThunk = modelThunk.thunk;
