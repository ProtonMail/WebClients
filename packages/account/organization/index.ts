import { PayloadAction, UnknownAction, createSlice, miniSerializeError, original } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { CacheType, createPromiseCache, previousSelector } from '@proton/redux-utilities';
import { getOrganization, getOrganizationSettings } from '@proton/shared/lib/api/organization';
import { APPS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getFetchedAt } from '@proton/shared/lib/helpers/fetchedAt';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import {
    type Organization,
    type OrganizationSettings,
    OrganizationWithSettings,
    type User,
    UserLockedFlags,
} from '@proton/shared/lib/interfaces';
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
        fetchedAt: 0,
        type: ValueType.dummy,
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
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
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

const promiseCache = createPromiseCache<Model>();
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
            if (!canFetch(user)) {
                return { value: freeOrganization, type: ValueType.dummy };
            }

            const defaultSettings = {
                ShowName: false,
                LogoID: null,
            };

            const [Organization, OrganizationSettings] = await Promise.all([
                extraArgument
                    .api<{
                        Organization: Organization;
                    }>(getOrganization())
                    .then(({ Organization }) => Organization),
                extraArgument.config.APP_NAME === APPS.PROTONACCOUNTLITE
                    ? defaultSettings
                    : extraArgument
                          .api<OrganizationSettings>(getOrganizationSettings())
                          .then(({ ShowName, LogoID }) => ({ ShowName, LogoID }))
                          .catch(() => {
                              return defaultSettings;
                          }),
            ]);

            const value = {
                ...Organization,
                Settings: OrganizationSettings,
            };

            return {
                value: value,
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

export const organizationReducer = { [name]: slice.reducer };
export const organizationThunk = modelThunk;

export const MAX_CHARS_API = {
    ORG_NAME: 40,
};
