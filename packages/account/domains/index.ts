import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSlice, miniSerializeError, original } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { previousSelector } from '@proton/redux-utilities/creator';
import { getFetchedAt, getFetchedEphemeral } from '@proton/redux-utilities/fetchedAt';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { cacheHelper, createPromiseStore } from '@proton/redux-utilities/promiseStore';
import { getDomain as getDomainConfig, queryDomains } from '@proton/shared/lib/api/domains';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { getIsMissingScopeError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Api, Domain, Permission, User } from '@proton/shared/lib/interfaces';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import { removeById } from '@proton/utils/removeById';
import { upsertById } from '@proton/utils/upsertById';

import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import { userFulfilled, userThunk } from '../user';
import { type UserPermissionsState, userPermissionsFulfilled, userPermissionsThunk } from '../userPermissions';

const name = 'domains' as const;

enum ValueType {
    dummy,
    complete,
}

export interface DomainsState extends UserPermissionsState {
    [name]: ModelState<Domain[]> & { meta: { type: ValueType; hasDomainReadPermission: boolean } };
}

type SliceState = DomainsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectDomains = (state: DomainsState) => state.domains;

const domainReadPermissions = new Set<Permission>(['account.sso_config.read', 'account.domain.read']);

const getHasDomainReadPermission = (permissions: Permission[]) =>
    permissions.some((permission) => domainReadPermissions.has(permission));

const canFetch = (user: User, hasDomainReadPermission: boolean) => {
    return isAdmin(user) || hasDomainReadPermission;
};
const freeDomains: Domain[] = [];

const initialState: SliceState = {
    value: undefined,
    error: undefined,
    meta: {
        fetchedEphemeral: undefined,
        fetchedAt: 0,
        type: ValueType.dummy,
        hasDomainReadPermission: false,
    },
};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<Domain>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload);
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
        removeDomain: (state, action: PayloadAction<Domain>) => {
            if (!state.value) {
                return;
            }
            state.value = removeById(state.value, action.payload, 'ID');
        },
        upsertDomain: (state, action: PayloadAction<Domain>) => {
            if (!state.value) {
                return;
            }
            state.value = upsertById(state.value, action.payload, 'ID');
        },
    },
    extraReducers: (builder) => {
        const handleUserUpdate = (state: DomainsState['domains'], user: User | undefined) => {
            if (!state.value || !user) {
                return;
            }

            const isFreeDomains = original(state)?.meta?.type === ValueType.dummy;
            const hasFetchAccess = canFetch(user, state.meta.hasDomainReadPermission);

            if (!isFreeDomains && user && !hasFetchAccess) {
                // Do not get any domain update when user becomes unsubscribed.
                state.value = freeDomains;
                state.error = undefined;
                state.meta.type = ValueType.dummy;
                state.meta.fetchedEphemeral = undefined;
                state.meta.fetchedAt = 0;
            }

            if (isFreeDomains && user && hasFetchAccess) {
                state.error = undefined;
                state.meta.type = ValueType.complete;
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
        builder.addCase(userPermissionsFulfilled, (state, action) => {
            state.meta.hasDomainReadPermission = getHasDomainReadPermission(action.payload.Permissions);
        });

        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }
            const isFreeDomains = original(state)?.meta?.type === ValueType.dummy;
            if (action.payload.Domains && !isFreeDomains) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.Domains,
                    itemKey: 'Domain',
                });
                state.error = undefined;
                state.meta.type = ValueType.complete;
            } else {
                handleUserUpdate(state, action.payload.User);
            }
        });
    },
});

const promiseStore = createPromiseStore<Model>();

const previous = previousSelector(selectDomains);

const modelThunk = (options?: {
    cache?: CacheType;
}): ThunkAction<Promise<Model>, DomainsState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument, options });
        };
        const getPayload = async () => {
            const user = await dispatch(userThunk());
            const userPermission = await dispatch(userPermissionsThunk());
            const hasDomainReadPermission = getHasDomainReadPermission(userPermission.Permissions);
            const defaultValue = {
                value: freeDomains,
                type: ValueType.dummy,
            };
            if (!canFetch(user, hasDomainReadPermission)) {
                return defaultValue;
            }
            try {
                const pages = await queryPages((page, pageSize) => {
                    return extraArgument.api<{ Domains: Domain[]; Total: number }>(
                        queryDomains({
                            Page: page,
                            PageSize: pageSize,
                        })
                    );
                });
                const value = pages.flatMap(({ Domains }) => Domains);
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

export const domainsReducer = { [name]: slice.reducer };
export const domainsThunk = modelThunk;
export const domainsActions = slice.actions;
export const upsertDomain = slice.actions.upsertDomain;
export const removeDomain = slice.actions.removeDomain;

const getDomain = (api: Api, ID: string) => {
    return api<{ Domain: Domain }>(getDomainConfig(ID, false)).then(({ Domain }) => Domain);
};

export const domainsEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: CoreEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, DomainsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const user = await dispatch(userThunk());
        const userPermission = await dispatch(userPermissionsThunk());
        const hasDomainReadPermission = getHasDomainReadPermission(userPermission.Permissions);
        if (!canFetch(user, hasDomainReadPermission)) {
            return;
        }
        await updateCollectionAsyncV6({
            n: 5,
            events: event.Domains,
            get: (ID) => getDomain(api, ID),
            refetch: () => dispatch(domainsThunk({ cache: CacheType.None })),
            update: (result) => dispatch(domainsActions.eventLoopV6(result)),
        });
    };
};
