import type { PayloadAction, ThunkAction, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { createSlice, miniSerializeError, original } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { previousSelector } from '@proton/redux-utilities/creator';
import { getFetchedAt, getFetchedEphemeral } from '@proton/redux-utilities/fetchedAt';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { cacheHelper, createPromiseStore } from '@proton/redux-utilities/promiseStore';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { getIsMissingScopeError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAllMemberAddresses, getAllMembers } from '@proton/shared/lib/api/members';
import { getMemberOrganizationRoles, updateMemberOrganizationRoles } from '@proton/shared/lib/api/organizationRoles';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Address, Api, EnhancedMember, Member, RoleAssignment } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import type { AddressesState } from '../addresses';
import { addressesThunk } from '../addresses';
import { bootstrapEvent } from '../bootstrap/action';
import { serverEvent } from '../eventLoop';
import { getGroupSourcedRoleIds, getUserSourcedRoleIds, isOrgKeyRequired } from '../organizationRoles/helpers';
import { type UserState, userThunk } from '../user';
import { type UserPermissionsState, userPermissionsThunk } from '../userPermissions';
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
            UnprivatizationMemberSuccess | UnprivatizationMemberFailure | UnprivatizationMemberApproval | undefined;
    };
    loading: {
        approval: boolean;
        automatic: boolean;
    };
}

export interface MembersState extends UserState, AddressesState, UserPermissionsState {
    [name]: ModelState<EnhancedMember[]> & {
        meta?: { type: ValueType };
        unprivatization: UnprivatizationMemberState;
    };
}

type SliceState = MembersState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMembers = (state: MembersState) => state.members;

export const canFetchMembers = async (
    dispatch: ThunkDispatch<MembersState, ProtonThunkArguments, UnknownAction>
): Promise<boolean> => {
    const user = await dispatch(userThunk());
    if (isAdmin(user)) {
        return true;
    }
    const { permissions } = await dispatch(userPermissionsThunk());
    return permissions['account.user.read'];
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
                        roleState: 'initial',
                        UserOrganizationRoles: [],
                    }),
                    merge: (a, b): EnhancedMember => ({
                        ...a,
                        ...b,
                        // In the event loop v6 we are always fetching individual members and get partial addresses
                        addressState: 'partial',
                        roleState: 'stale',
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
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        upsertMember: (
            state,
            action: PayloadAction<{ member: Member; type?: 'delete'; invalidateAddresses?: boolean }>
        ) => {
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
                roleState: 'initial' as const,
                UserOrganizationRoles: [],
            };
            if (memberIndex === -1) {
                state.value.push(newMember);
            } else {
                const previousMember = state.value[memberIndex];
                const previousAddressState =
                    previousMember.addressState === 'full'
                        ? {
                              // Keep the cached addresses for display, but when the caller signals the
                              // member's addresses changed (e.g. unprivatization re-encrypts address
                              // tokens), mark them 'stale' so the next getMemberAddresses refetches
                              // instead of serving the cached (now invalid) Token/Signature.
                              addressState: action.payload.invalidateAddresses ? ('stale' as const) : ('full' as const),
                              Addresses: previousMember.Addresses,
                          }
                        : {};
                const previousRoleState = {
                    roleState: previousMember.roleState,
                    UserOrganizationRoles: previousMember.UserOrganizationRoles,
                };
                const mergedValue: EnhancedMember = {
                    ...newMember,
                    ...previousAddressState,
                    ...previousRoleState,
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
        memberRoleFetchPending: (state, action: PayloadAction<{ member: Member }>) => {
            const member = getMemberFromState(state, action.payload.member);
            if (member) {
                member.roleState = 'pending';
            }
        },
        memberRoleFetchFulfilled: (
            state,
            action: PayloadAction<{ member: Member; organizationRoles: RoleAssignment[] }>
        ) => {
            const member = getMemberFromState(state, action.payload.member);
            if (member) {
                member.roleState = 'full';
                member.UserOrganizationRoles = action.payload.organizationRoles;
            }
        },
        memberRoleFetchRejected: (state, action: PayloadAction<{ member: Member }>) => {
            const member = getMemberFromState(state, action.payload.member);
            if (member) {
                member.roleState = 'rejected';
            }
        },
        invalidateMemberRoles: (state, action: PayloadAction<{ member: Member }>) => {
            const member = getMemberFromState(state, action.payload.member);
            if (member && member.roleState !== 'initial') {
                member.roleState = 'stale';
            }
        },
        setUnprivatizationState: (state, action: PayloadAction<UnprivatizationMemberState>) => {
            state.unprivatization = action.payload;
        },
        // Reconcile the cached member list with the user's current fetch permission. Dispatched by
        // membersListener with the resolved (permission-aware) canFetchMembers() result, which a
        // reducer can't await itself.
        handlePermissionChange: (state, action: PayloadAction<{ canFetch: boolean }>) => {
            if (!state.value) {
                return;
            }

            const isFreeMembers = original(state)?.meta?.type === ValueType.dummy;
            const { canFetch } = action.payload;

            // Fail closed: a demoted user who can no longer fetch members must not keep seeing the
            // cached privileged member list. Clear state.value immediately — the next read reruns
            // canFetchMembers() and repopulates it if the user still qualifies.
            if (!isFreeMembers && !canFetch) {
                state.value = freeMembers;
                state.unprivatization = initialState.unprivatization;
                state.error = undefined;
                state.meta.fetchedEphemeral = undefined;
                state.meta.fetchedAt = 0;
            }

            // A user who has (re)gained access should drop the dummy free-members cache so the next
            // read refetches the real member list.
            if (isFreeMembers && canFetch) {
                state.error = undefined;
                state.meta.fetchedEphemeral = undefined;
                state.meta.fetchedAt = 0;
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(bootstrapEvent, (state) => {
            state.unprivatization = initialState.unprivatization;
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
                            roleState: 'initial',
                            UserOrganizationRoles: [],
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
            const defaultValue = {
                value: freeMembers,
                type: ValueType.dummy,
            };
            if (!(await canFetchMembers(dispatch))) {
                return defaultValue;
            }
            try {
                const value = await getAllMembers(extraArgument.api).then((members): EnhancedMember[] => {
                    return members.map((member) => ({
                        ...member,
                        addressState: 'partial' as const,
                        roleState: 'initial' as const,
                        UserOrganizationRoles: [],
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

const getTemporaryRolePromiseMap = (() => {
    let map: undefined | Map<string, Promise<RoleAssignment[]>>;
    return () => {
        if (!map) {
            map = new Map();
        }
        return map;
    };
})();

export const getMemberRoles = ({
    member: targetMember,
    retry,
    cache,
}: {
    member: Member;
    retry?: boolean;
    cache?: CacheType;
}): ThunkAction<Promise<RoleAssignment[]>, MembersState, ProtonThunkArguments, UnknownAction> => {
    const map = getTemporaryRolePromiseMap();

    return async (dispatch, getState, extra) => {
        const isAdminRoleEnabled = extra.unleashClient?.isEnabled('AdminRoleMVP') ?? false;
        if (!isAdminRoleEnabled) {
            return [];
        }
        const member = getMemberFromState(selectMembers(getState()), targetMember);
        if (!member) {
            return [];
        }
        if (cache !== CacheType.None) {
            if (member.roleState === 'full') {
                return member.UserOrganizationRoles;
            }
            if (member.roleState === 'rejected' && !retry) {
                return [];
            }
        }
        const oldPromise = map.get(member.ID);
        if (oldPromise) {
            return oldPromise;
        }
        const promise = extra
            .api<{ RoleAssignments: RoleAssignment[] }>(getMemberOrganizationRoles(member.ID))
            .then(({ RoleAssignments }) => RoleAssignments);
        try {
            map.set(member.ID, promise);
            dispatch(slice.actions.memberRoleFetchPending({ member }));
            const result = await promise;
            dispatch(slice.actions.memberRoleFetchFulfilled({ member, organizationRoles: result }));
            return result;
        } catch (e) {
            dispatch(slice.actions.memberRoleFetchRejected({ member }));
            throw e;
        } finally {
            map.delete(member.ID);
        }
    };
};

export interface RoleAssignmentsResult {
    roleAssignments: RoleAssignment[];
    changed: boolean;
}

export const updateMemberRoles = ({
    member,
    currentRoles,
    desiredRoleIds,
    api,
}: {
    member: Member;
    currentRoles: RoleAssignment[];
    desiredRoleIds: Set<string>;
    api: Api;
}): ThunkAction<Promise<RoleAssignmentsResult>, MembersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _getState, extra) => {
        const isAdminRoleEnabled = extra.unleashClient?.isEnabled('AdminRoleMVP') ?? false;
        if (!isAdminRoleEnabled) {
            return { roleAssignments: [], changed: false };
        }
        // Only user-sourced roles can be added/removed via this endpoint
        const groupSourcedRoleIds = getGroupSourcedRoleIds(currentRoles);
        const previousRoleIds = getUserSourcedRoleIds(currentRoles);
        const add = [...desiredRoleIds].filter((id) => !previousRoleIds.has(id) && !groupSourcedRoleIds.has(id));
        const remove = [...previousRoleIds].filter((id) => !desiredRoleIds.has(id));

        if (add.length === 0 && remove.length === 0) {
            return { roleAssignments: currentRoles, changed: false };
        }

        const { RoleAssignments } = await api<{ RoleAssignments: RoleAssignment[] }>(
            updateMemberOrganizationRoles(member.ID, { add, remove })
        );
        dispatch(slice.actions.memberRoleFetchFulfilled({ member, organizationRoles: RoleAssignments }));

        const currentRolesRequireOrgKey = currentRoles.some(({ Role }) => isOrgKeyRequired(Role));
        const desiredRolesRequireOrgKey = RoleAssignments.some(({ Role }) => isOrgKeyRequired(Role));
        if (currentRolesRequireOrgKey && !desiredRolesRequireOrgKey) {
            // The API demotes the member when its last org key role is removed. Refresh Role now
            // instead of waiting for the event loop, otherwise a promotion following shortly after
            // reads a stale admin Role above and skips setRole.
            dispatch(slice.actions.upsertMember({ member: await getMember(api, member.ID) }));
        }

        return { roleAssignments: RoleAssignments, changed: true };
    };
};

export const membersReducer = { [name]: slice.reducer };
export const membersThunk = modelThunk;
export const upsertMember = slice.actions.upsertMember;
export const invalidateMemberRoles = slice.actions.invalidateMemberRoles;
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
        if (!(await canFetchMembers(dispatch))) {
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
