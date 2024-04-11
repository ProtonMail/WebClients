import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getSAMLConfigs, getSAMLStaticInfo, getSCIMInfo } from '@proton/shared/lib/api/samlSSO';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import { Organization, SSO, User } from '@proton/shared/lib/interfaces';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { OrganizationState, organizationThunk } from '../organization';
import { UserState, userThunk } from '../user';

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
            return {
                configs: [],
                staticInfo: { EntityID: '', CallbackURL: '' },
                scimInfo: defaultScimInfo,
            };
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

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};
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
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.User && !canFetchSSO(action.payload.User)) {
                // Do not get any SSO update when user becomes unsubscribed.
                state.value.configs = [];
                state.value.scimInfo = defaultScimInfo;
                return;
            }

            if (state.value && action.payload.Organization && !canFetchScim(action.payload.Organization)) {
                state.value.scimInfo = defaultScimInfo;
            }

            if (state.value && action.payload.SSO) {
                state.value.configs = updateCollection({
                    model: state.value.configs,
                    events: action.payload.SSO,
                    itemKey: 'SSO',
                });
            }
        });
    },
});

export const samlReducer = { [name]: slice.reducer };
export const samlSSOThunk = modelThunk.thunk;
export const updateScim = slice.actions.updateScim;
