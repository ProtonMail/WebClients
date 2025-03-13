import type { PayloadAction, UnknownAction } from '@reduxjs/toolkit';
import { createSlice, miniSerializeError, original } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { CacheType } from '@proton/redux-utilities';
import {
    cacheHelper,
    createPromiseStore,
    getFetchedAt,
    getFetchedEphemeral,
    previousSelector,
} from '@proton/redux-utilities';
import { getIsMissingScopeError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { APPS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import type { OrganizationWithSettings, User } from '@proton/shared/lib/interfaces';
import { UserLockedFlags } from '@proton/shared/lib/interfaces';
import { getOrganizationWithSettings } from '@proton/shared/lib/organization/api';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { type UserState, userThunk } from '../user';

const name = 'organization' as const;

enum ValueType {
    dummy,
    complete,
}

export interface OrganizationState extends UserState {
    [name]: ModelState<OrganizationWithSettings> & { meta: { type: ValueType } };
}

type SliceState = OrganizationState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectOrganization = (state: OrganizationState) => state[name];

const canFetch = (user: User) => {
    /*
    After auto-downgrade admin user is downgraded to a free user, organization state is set to `Delinquent`
    and the user gets into a locked state if they have members in their organizaion and .
    In that case we want to refetch the organization to avoid getting FREE_ORGANIZATION object.
    */
    const isOrgAdminUserInLockedState = hasBit(user.LockedFlags, UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN);
    return isPaid(user) || isOrgAdminUserInLockedState;
};

const freeOrganization = { Settings: {} } as unknown as OrganizationWithSettings;

const initialState: SliceState = {
    value: undefined,
    error: undefined,
    meta: {
        type: ValueType.dummy,
        fetchedAt: 0,
        fetchedEphemeral: undefined,
    },
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
            state.meta.type = action.payload.type;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
        },
        updateOrganizationSettings: (
            state,
            action: PayloadAction<{ value: Partial<OrganizationWithSettings['Settings']> }>
        ) => {
            if (!state.value) {
                return;
            }
            state.value.Settings = updateObject(state.value.Settings, action.payload.value);
        },
    },
    extraReducers: (builder) => {
        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }
            if (action.payload.Organization || action.payload.OrganizationSettings) {
                state.value = updateObject(state.value, {
                    ...action.payload.Organization,
                    ...(action.payload.OrganizationSettings
                        ? { Settings: action.payload.OrganizationSettings }
                        : undefined),
                });
                state.error = undefined;
                state.meta.type = ValueType.complete;
            } else {
                const isFreeOrganization = original(state)?.meta.type === ValueType.dummy;

                if (!isFreeOrganization && action.payload.User && !canFetch(action.payload.User)) {
                    // Do not get any organization update when user becomes unsubscribed.
                    state.value = freeOrganization;
                    state.error = undefined;
                    state.meta.type = ValueType.dummy;
                }

                if (isFreeOrganization && action.payload.User && canFetch(action.payload.User)) {
                    state.value = undefined;
                    state.error = undefined;
                    state.meta.type = ValueType.complete;
                }
            }
        });
    },
});

const promiseStore = createPromiseStore<Model>();
const previous = previousSelector(selectOrganization);

const modelThunk = (options?: {
    cache?: CacheType;
}): ThunkAction<Promise<Model>, OrganizationState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument, options });
        };
        const getPayload = async () => {
            const user = await dispatch(userThunk());
            const defaultValue = {
                value: freeOrganization,
                type: ValueType.dummy,
            };
            if (!canFetch(user)) {
                return defaultValue;
            }

            try {
                const value = await getOrganizationWithSettings({
                    api: extraArgument.api,
                    defaultSettings: extraArgument.config.APP_NAME === APPS.PROTONACCOUNTLITE,
                });
                return {
                    value: value,
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

export const organizationReducer = { [name]: slice.reducer };
export const organizationActions = slice.actions;
export const organizationThunk = modelThunk;

export const MAX_CHARS_API = {
    ORG_NAME: 40,
};
