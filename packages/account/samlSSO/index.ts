import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getSAMLConfigs, getSAMLStaticInfo, getSCIMInfo } from '@proton/shared/lib/api/samlSSO';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Organization, SSO, User } from '@proton/shared/lib/interfaces';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { type OrganizationState, organizationFulfilled } from '../organization';
import { organizationThunk } from '../organization';
import { type UserState, userFulfilled, userThunk } from '../user';

const name = 'sso' as const;

interface StaticInfo {
    EntityID: string;
    CallbackURL: string;
}

interface ScimInfo {
    baseUrl: string;
    state: 0 | 1;
}

const defaultScimInfo: ScimInfo = {
    state: 0,
    baseUrl: '',
};

const defaultValue = {
    configs: [],
    staticInfo: { EntityID: '', CallbackURL: '' },
    scimInfo: defaultScimInfo,
};

export interface SamlState extends UserState, OrganizationState {
    [name]: ModelState<{ configs: SSO[]; staticInfo: StaticInfo; scimInfo: ScimInfo }>;
}

type SliceState = SamlState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectSamlSSO = (state: SamlState) => state[name];

const canFetchScim = (organization: Organization) => {
    return organization.IsScimEnabled;
};

const canFetchSSO = (user: User) => {
    return isPaid(user);
};

const modelThunk = createAsyncModelThunk<Model, SamlState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());
        if (!canFetchSSO(user)) {
            return defaultValue;
        }

        const organization = await dispatch(organizationThunk());

        const [configs, staticInfo, scimInfo] = await Promise.all([
            extraArgument.api<{ Configs: SSO[] }>(getSAMLConfigs()).then(({ Configs }) => {
                return Configs;
            }),
            extraArgument.api<StaticInfo>(getSAMLStaticInfo()),
            canFetchScim(organization)
                ? await extraArgument
                      .api<{
                          SCIMBaseURL: string;
                          State: 0 | 1;
                      }>(getSCIMInfo())
                      .then(({ SCIMBaseURL, State }) => ({ baseUrl: SCIMBaseURL, state: State }))
                      .catch(() => defaultScimInfo)
                : defaultScimInfo,
        ]);

        return {
            configs,
            staticInfo,
            scimInfo,
        };
    },
    previous: previousSelector(selectSamlSSO),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        updateScim: (state, action: PayloadAction<Partial<ScimInfo>>) => {
            if (state.value) {
                const newScimInfo = action.payload;
                state.value.scimInfo = {
                    state: newScimInfo.state ?? 0,
                    baseUrl: newScimInfo.baseUrl ?? state.value.scimInfo.baseUrl ?? '',
                };
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);

        const handleUserUpdate = (state: SamlState['sso'], user: User | undefined) => {
            if (state.value && user && !canFetchSSO(user)) {
                // Do not get any SSO update when user becomes unsubscribed.
                return defaultValue;
            }
        };

        const handleOrganizationUpdate = (state: SamlState['sso'], organization: Organization | undefined) => {
            if (state.value && organization && !canFetchScim(organization)) {
                state.value.scimInfo = defaultScimInfo;
            }
        };

        builder.addCase(initEvent, (state, action) => {
            handleUserUpdate(state, action.payload.User);
        });
        builder.addCase(userFulfilled, (state, action) => {
            handleUserUpdate(state, action.payload);
        });

        builder.addCase(organizationFulfilled, (state, action) => {
            handleOrganizationUpdate(state, action.payload.value);
        });

        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.SSO) {
                state.value.configs = updateCollection({
                    model: state.value.configs,
                    events: action.payload.SSO,
                    itemKey: 'SSO',
                });
            }
            handleUserUpdate(state, action.payload.User);
            handleOrganizationUpdate(state, action.payload.Organization);
        });
    },
});

export const samlReducer = { [name]: slice.reducer };
export const samlSSOThunk = modelThunk.thunk;
export const updateScim = slice.actions.updateScim;
