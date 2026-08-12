import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { getRetentionRules } from '@proton/shared/lib/api/retentionPolicies';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';
import type { RetentionRule } from '@proton/shared/lib/interfaces/RetentionRule';
import { isAdminOrLoginAsAdmin } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import { organizationThunk } from '../organization';
import type { OrganizationState } from '../organization';
import { userThunk } from '../user';
import type { UserState } from '../user';
import { userPermissionsThunk } from '../userPermissions';
import type { UserPermissionsState } from '../userPermissions';

const name = 'retentionPolicies';

export interface RetentionPoliciesState extends UserState, OrganizationState, UserPermissionsState {
    [name]: ModelState<RetentionRule[]>;
}

type SliceState = RetentionPoliciesState[typeof name];
type Model = NonNullable<SliceState['value']>;

const initialState: SliceState = getInitialModelState<RetentionRule[]>();

export const selectRetentionPolicies = (state: RetentionPoliciesState) => state[name];

const canFetch = (user: UserModel, organization: Organization, canReadRetention: boolean): boolean => {
    return (isAdminOrLoginAsAdmin(user) || canReadRetention) && !!organization?.ID;
};

const modelThunk = createAsyncModelThunk<Model, RetentionPoliciesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        const [user, organization, { permissions }] = await Promise.all([
            dispatch(userThunk()),
            dispatch(organizationThunk()),
            dispatch(userPermissionsThunk()),
        ]);
        const flag = extraArgument.unleashClient?.isEnabled('DataRetentionPolicy') ?? false;
        const canReadRetention = !!permissions?.['account.data_retention.read'];
        if (!flag || !canFetch(user, organization, canReadRetention)) {
            return [];
        }
        return extraArgument
            .api(getRetentionRules())
            .then(({ RetentionRules }: { RetentionRules: RetentionRule[] }) => RetentionRules)
            .catch(() => []);
    },
    previous: previousSelector(selectRetentionPolicies),
});

const slice = createSlice({
    name,
    initialState,
    reducers: {
        addRetentionRule: (state, action: PayloadAction<RetentionRule>) => {
            if (!state.value) {
                return;
            }

            if (state.value.find((rule) => rule.ID === action.payload.ID)) {
                return;
            }

            state.value.push(action.payload);
        },
        updateRetentionRule: (state, action: PayloadAction<RetentionRule>) => {
            if (!state.value) {
                return;
            }
            const index = state.value.findIndex((rule) => rule.ID === action.payload.ID);
            if (index !== -1) {
                state.value[index] = action.payload;
            }
        },
        deleteRetentionRule: (state, action: PayloadAction<string>) => {
            if (state.value && action.payload) {
                const updatedRules = state.value.filter((rule) => rule.ID !== action.payload);
                state.value = updatedRules;
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }

            if (action.payload.RetentionRules) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.RetentionRules,
                    itemKey: 'RetentionRule',
                });
            }
        });
    },
});

export const { addRetentionRule, updateRetentionRule, deleteRetentionRule } = slice.actions;
export const retentionPoliciesReducer = { [name]: slice.reducer };
export const retentionPoliciesThunk = modelThunk.thunk;
