import { createSlice, original } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getOrganization, getOrganizationSettings } from '@proton/shared/lib/api/organization';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
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
import { UserState, userThunk } from '../user';

const name = 'organization';

export interface OrganizationState extends UserState {
    [name]: ModelState<OrganizationWithSettings>;
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

const modelThunk = createAsyncModelThunk<Model, OrganizationState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());
        if (canFetch(user)) {
            const [Organization, OrganizationSettings] = await Promise.all([
                extraArgument
                    .api<{
                        Organization: Organization;
                    }>(getOrganization())
                    .then(({ Organization }) => Organization),
                extraArgument
                    .api<OrganizationSettings>(getOrganizationSettings())
                    .then(({ ShowName, LogoID }) => ({ ShowName, LogoID }))
                    .catch(() => {
                        return { ShowName: false, LogoID: null };
                    }),
            ]);
            return {
                ...Organization,
                Settings: OrganizationSettings,
            };
        }
        return freeOrganization;
    },
    previous: previousSelector(selectOrganization),
});

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
            } else {
                const isFreeOrganization = original(state)?.value === freeOrganization;

                if (!isFreeOrganization && action.payload.User && !canFetch(action.payload.User)) {
                    // Do not get any organization update when user becomes unsubscribed.
                    state.value = freeOrganization;
                }

                if (isFreeOrganization && action.payload.User && canFetch(action.payload.User)) {
                    state.value = undefined;
                    state.error = undefined;
                }
            }
        });
    },
});

export const organizationReducer = { [name]: slice.reducer };
export const organizationThunk = modelThunk.thunk;

export const MAX_CHARS_API = {
    ORG_NAME: 40,
};
