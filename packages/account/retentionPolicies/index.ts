import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getRetentionRules } from '@proton/shared/lib/api/retentionPolicies';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';
import type { RetentionRule } from '@proton/shared/lib/interfaces/RetentionRule';

import { serverEvent } from '../eventLoop';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { organizationThunk } from '../organization';
import type { OrganizationState } from '../organization';
import { userThunk } from '../user';
import type { UserState } from '../user';

const name = 'retentionPolicies';

export interface RetentionPoliciesState extends UserState, OrganizationState {
    [name]: ModelState<RetentionRule[]>;
}

type SliceState = RetentionPoliciesState[typeof name];
type Model = NonNullable<SliceState['value']>;

const initialState: SliceState = getInitialModelState<RetentionRule[]>();

export const selectRetentionPolicies = (state: RetentionPoliciesState) => state[name];

const canFetch = (user: UserModel, organization: Organization) => {
    return user.isAdmin && organization?.ID;
};

const modelThunk = createAsyncModelThunk<Model, RetentionPoliciesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        const [user, organization] = await Promise.all([dispatch(userThunk()), dispatch(organizationThunk())]);
        if (!canFetch(user, organization)) {
            return [];
        }
        return extraArgument
            .api(getRetentionRules())
            .then(({ RetentionRules }: { RetentionRules: RetentionRule[] }) => RetentionRules);
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
