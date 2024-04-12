import { PayloadAction, ThunkAction, UnknownAction, createSlice, miniSerializeError, original } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createPromiseCache } from '@proton/redux-utilities';
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

enum ValueType {
    dummy,
    complete,
}

export interface MembersState extends UserState, AddressesState {
    [name]: ModelState<EnhancedMember[]> & { meta?: { type: ValueType } };
}

type SliceState = MembersState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMembers = (state: MembersState) => state.members;

const canFetch = (user: User) => {
    return isAdmin(user);
};

const getMemberFromState = (state: ModelState<EnhancedMember[]>, target: Member) => {
    return state.value?.find((member) => member.ID === target.ID);
};

const freeMembers: EnhancedMember[] = [];

const initialState: SliceState = {
    value: undefined,
    error: undefined,
    meta: { type: ValueType.complete },
};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state) => {
            state.error = undefined;
        },
        fulfilled: (state, action: PayloadAction<{ value: Model; type: ValueType }>) => {
            state.value = action.payload.value;
            state.error = undefined;
            state.meta = { type: action.payload.type };
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.value = undefined;
            state.meta = { type: ValueType.complete };
        },
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
        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }

            const isFreeMembers = original(state)?.meta?.type === ValueType.dummy;

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
                    state.error = undefined;
                    state.meta = { type: ValueType.dummy };
                }

                if (isFreeMembers && action.payload.User && canFetch(action.payload.User)) {
                    state.value = undefined;
                    state.error = undefined;
                    state.meta = { type: ValueType.complete };
                }
            }
        });
    },
});

const promiseCache = createPromiseCache<Model>();

const modelThunk = (): ThunkAction<Promise<Model>, MembersState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            const oldValue = selectMembers(getState());
            if (oldValue?.value !== undefined) {
                return Promise.resolve(oldValue.value);
            }
        };
        const getPayload = async () => {
            const user = await dispatch(userThunk());
            if (!canFetch(user)) {
                return {
                    value: freeMembers,
                    type: ValueType.dummy,
                };
            }
            const value = await getAllMembers(extraArgument.api).then((members): EnhancedMember[] => {
                return members.map((member) => ({
                    ...member,
                    addressState: 'partial' as const,
                }));
            });
            return {
                value,
                type: ValueType.complete,
            };
        };
        const cb = async () => {
            try {
                dispatch(slice.actions.pending());
                const payload = await getPayload();
                dispatch(slice.actions.fulfilled(payload));
                return payload.value;
            } catch (error) {
                dispatch(slice.actions.rejected(miniSerializeError(error)));
                throw error;
            }
        };
        return promiseCache(select, cb);
    };
};

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
export const membersThunk = modelThunk;
