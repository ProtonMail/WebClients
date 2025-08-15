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
import updateObject from '@proton/shared/lib/helpers/updateObject';
import type { OrganizationExtended, User } from '@proton/shared/lib/interfaces';
import {
    getDefaultOrganizationSettings,
    getOrganization,
    getOrganizationSettings,
} from '@proton/shared/lib/organization/api';

import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import type { ModelState } from '../interface';
import { type UserState, userFulfilled, userThunk } from '../user';
import { canFetchOrganization } from './helper';

const name = 'organization' as const;

enum ValueType {
    dummy,
    complete,
}

export interface OrganizationState extends UserState {
    [name]: ModelState<OrganizationExtended> & { meta: { type: ValueType } };
}

type SliceState = OrganizationState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectOrganization = (state: OrganizationState) => state[name];

const freeOrganization = { Settings: {} } as unknown as OrganizationExtended;

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
        update: (state, action: PayloadAction<{ Organization: Partial<OrganizationExtended> }>) => {
            if (!state.value) {
                return;
            }
            state.value = { ...state.value, ...action.payload.Organization };
        },
        updateOrganizationSettings: (
            state,
            action: PayloadAction<{ value: Partial<OrganizationExtended['Settings']> }>
        ) => {
            if (!state.value) {
                return;
            }
            state.value.Settings = updateObject(state.value.Settings, action.payload.value);
        },
    },
    extraReducers: (builder) => {
        const handleUserUpdate = (state: OrganizationState['organization'], user: User | undefined) => {
            if (!state.value || !user) {
                return;
            }

            const isFreeOrganization = original(state)?.meta.type === ValueType.dummy;

            if (!isFreeOrganization && user && !canFetchOrganization(user)) {
                // Do not get any organization update when user becomes unsubscribed.
                state.value = freeOrganization;
                state.error = undefined;
                state.meta.type = ValueType.dummy;
                state.meta.fetchedEphemeral = undefined;
                state.meta.fetchedAt = 0;
            }

            if (isFreeOrganization && user && canFetchOrganization(user)) {
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

        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }
            if (action.payload.Organization || action.payload.OrganizationSettings) {
                state.value = updateObject(state.value, {
                    ...action.payload.Organization,
                    ...(action.payload.OrganizationSettings
                        ? { Settings: updateObject(state.value.Settings, action.payload.OrganizationSettings) }
                        : undefined),
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
const previous = previousSelector(selectOrganization);

const modelThunk = (options?: {
    cache?: CacheType;
    type?: 'extended' | 'organization' | 'settings';
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
            if (!canFetchOrganization(user)) {
                return defaultValue;
            }

            const getOrganizationPromise = () => {
                return getOrganization({ api: extraArgument.api });
            };

            const getSettingsPromise = () => {
                return extraArgument.config.APP_NAME === APPS.PROTONACCOUNTLITE
                    ? getDefaultOrganizationSettings()
                    : getOrganizationSettings({ api: extraArgument.api });
            };

            const getValue = async (): Promise<OrganizationExtended> => {
                const originalOrganization = select()?.value;
                const originalSettings = originalOrganization?.Settings;

                if (originalSettings && options?.type === 'organization') {
                    const organization = await getOrganizationPromise();
                    const settings = select()?.value?.Settings || originalSettings;
                    return {
                        ...organization,
                        Settings: settings,
                    };
                }

                if (originalOrganization && options?.type === 'settings') {
                    const settings = await getSettingsPromise();
                    const organization = select()?.value || originalOrganization;
                    return {
                        ...organization,
                        Settings: settings,
                    };
                }

                const [organization, settings] = await Promise.all([getOrganizationPromise(), getSettingsPromise()]);
                return {
                    ...organization,
                    Settings: settings,
                };
            };

            try {
                const value = await getValue();
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
export const organizationFulfilled = slice.actions.fulfilled;

export const MAX_CHARS_API = {
    ORG_NAME: 40,
};
