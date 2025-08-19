import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSlice, miniSerializeError, original } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    CacheType,
    cacheHelper,
    createPromiseStore,
    getFetchedAt,
    getFetchedEphemeral,
    previousSelector,
} from '@proton/redux-utilities';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { getIsMissingScopeError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAllMemberAddresses, getAllMembers } from '@proton/shared/lib/api/members';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Address, Api, EnhancedMember, Member, User } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import type { AddressesState } from '../addresses';
import { addressesThunk } from '../addresses';
import { bootstrapEvent } from '../bootstrap/action';
import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import type { ModelState } from '../interface';
import { type UserState, userFulfilled, userThunk } from '../user';
import { getMember } from './getMember';

const name = 'members' as const;

enum ValueType {
    dummy,
    complete,
}

export type UnprivatizationMemberSuccess = {
    type: 'success';
};
export type UnprivatizationMemberApproval = {
    type: 'approval';
};
export type UnprivatizationMemberFailure = {
    type: 'error';
    error: string;
    revision: boolean;
};

interface UnprivatizationMemberState {
    members: {
        [id: string]:
            | UnprivatizationMemberSuccess
            | UnprivatizationMemberFailure
            | UnprivatizationMemberApproval
            | undefined;
    };
    loading: {
        approval: boolean;
        automatic: boolean;
    };
}

export interface MembersState extends UserState, AddressesState {
    [name]: ModelState<EnhancedMember[]> & {
        meta?: { type: ValueType };
        unprivatization: UnprivatizationMemberState;
    };
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
const getMemberIndexFromState = (members: EnhancedMember[], target: Member) => {
    return members.findIndex((member) => member.ID === target.ID);
};

const freeMembers: EnhancedMember[] = [];

const initialState: SliceState = {
    value: undefined,
    error: undefined,
    meta: {
        type: ValueType.complete,
        fetchedAt: 0,
        fetchedEphemeral: undefined,
    },
    unprivatization: { members: {}, loading: { approval: false, automatic: false } },
};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<Member>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload, {
                    create: (a): EnhancedMember => ({
                        ...a,
                        // In the event loop v6 we are always fetching individual members and get partial addresses
                        addressState: 'partial',
                    }),
                    merge: (a, b): EnhancedMember => ({
                        ...a,
                        ...b,
                        // In the event loop v6 we are always fetching individual members and get partial addresses
                        addressState: 'partial',
                    }),
                });
            }
        },
        pending: (state) => {
            state.error = undefined;
        },
        fulfilled: (state, action: PayloadAction<{ value: Model; type: ValueType }>) => {
            state.value = action.payload.value;
            state.error = undefined;
            state.meta.type = action.payload.type;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
        },
        upsertMember: (state, action: PayloadAction<{ member: Member; type?: 'delete' }>) => {
            if (!state.value) {
                return;
            }
            const memberIndex = getMemberIndexFromState(state.value, action.payload.member);
            if (action.payload.type === 'delete') {
                if (memberIndex !== -1) {
                    state.value.splice(memberIndex, 1);
                }
                return;
            }
            const newMember = {
                ...action.payload.member,
                addressState: 'partial' as const,
            };
            if (memberIndex === -1) {
                state.value.push(newMember);
            } else {
                const previousMember = state.value[memberIndex];
                const previousAddressState =
                    previousMember.addressState === 'full'
                        ? {
                              addressState: previousMember.addressState,
                              Addresses: previousMember.Addresses,
                          }
                        : {};
                const mergedValue: EnhancedMember = {
                    ...newMember,
                    ...previousAddressState,
                };
                state.value[memberIndex] = mergedValue;
            }
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
        setUnprivatizationState: (state, action: PayloadAction<UnprivatizationMemberState>) => {
            state.unprivatization = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(bootstrapEvent, (state) => {
            state.unprivatization = initialState.unprivatization;
        });

        const handleUserUpdate = (state: MembersState['members'], user: User | undefined) => {
            if (!state.value) {
                return;
            }

            const isFreeMembers = original(state)?.meta?.type === ValueType.dummy;

            // Do not get any members update when user becomes unsubscribed.
            if (!isFreeMembers && user && !canFetch(user)) {
                state.unprivatization = initialState.unprivatization;
                state.value = freeMembers;
                state.error = undefined;
                state.meta.fetchedEphemeral = undefined;
                state.meta.fetchedAt = 0;
            }

            if (isFreeMembers && user && canFetch(user)) {
                state.error = undefined;
                state.meta.fetchedEphemeral = undefined;
                state.meta.fetchedAt = 0;
            }
        };

        builder.addCase(initEvent, (state, action) => {
            handleUserUpdate(state, action.payload.User);
        });
        builder.addCase(userFulfilled, (state, action) => {
            handleUserUpdate(state, action.payload);
        });

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
                handleUserUpdate(state, action.payload.User);
            }
        });
    },
});

const promiseStore = createPromiseStore<Model>();
const previous = previousSelector(selectMembers);

const modelThunk = (options?: {
    cache?: CacheType;
}): ThunkAction<Promise<Model>, MembersState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument, options });
        };
        const getPayload = async () => {
            const user = await dispatch(userThunk());
            const defaultValue = {
                value: freeMembers,
                type: ValueType.dummy,
            };
            if (!canFetch(user)) {
                return defaultValue;
            }
            try {
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
            } catch (e: any) {
                if (getIsMissingScopeError(e)) {
                    return defaultValue;
                }
                throw e;
            }
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
        return cacheHelper({ store: promiseStore, select, cb, cache: options?.cache });
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
    cache,
}: {
    member: Member;
    retry?: boolean;
    cache?: CacheType;
}): ThunkAction<Promise<Address[]>, MembersState, ProtonThunkArguments, UnknownAction> => {
    const fetch = (api: Api, ID: string) => getAllMemberAddresses(api, ID).then(sortAddresses);

    const map = getTemporaryPromiseMap();

    return async (dispatch, getState, extra) => {
        const member = getMemberFromState(selectMembers(getState()), targetMember);
        if (!member) {
            return [];
        }
        if (Boolean(member.Self)) {
            return dispatch(addressesThunk({ cache }));
        }
        if (cache !== CacheType.None) {
            if (member.addressState === 'full' && member.Addresses) {
                return member.Addresses;
            }
            if (member.addressState === 'rejected' && !retry) {
                return [];
            }
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
export const upsertMember = slice.actions.upsertMember;
export const membersActions = slice.actions;
export const setUnprivatizationState = slice.actions.setUnprivatizationState;
export { default as UnavailableAddressesError } from './errors/UnavailableAddressesError';
export { default as InvalidAddressesError } from './errors/InvalidAddressesError';
export { default as MemberCreationValidationError } from './errors/MemberCreationValidationError';

export const membersEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: CoreEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, MembersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const user = await dispatch(userThunk());
        if (!canFetch(user)) {
            return;
        }
        await updateCollectionAsyncV6({
            events: event.Members,
            get: (ID) => getMember(api, ID),
            refetch: () => dispatch(membersThunk({ cache: CacheType.None })),
            update: (result) => dispatch(membersActions.eventLoopV6(result)),
        });
    };
};
