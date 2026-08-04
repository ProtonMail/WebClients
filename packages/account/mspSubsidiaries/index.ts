import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { getAllMspSubsidiaries } from '@proton/shared/lib/api/msp';
import type { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { MspSubsidiary } from '@proton/shared/lib/interfaces/MspSubsidiary';

import { isOwnerRole } from '../organizationRoles/helpers';
import { userThunk } from '../user';
import { type UserPermissionsState, userPermissionsThunk } from '../userPermissions';

const name = 'mspSubsidiaries' as const;

export interface MspSubsidiariesState extends UserPermissionsState {
    [name]: ModelState<MspSubsidiary[]>;
}

type SliceState = MspSubsidiariesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMspSubsidiaries = (state: MspSubsidiariesState) => state[name];

const modelThunk = createAsyncModelThunk<Model, MspSubsidiariesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        const flag = extraArgument.unleashClient?.isEnabled('MspEnabled') ?? false;
        if (!flag) {
            return [];
        }
        // The subsidiaries routes are MSP-owner only, IT Managers (non-owner members of the MSP
        // org) get an empty list here and are shown their managed organizations instead.
        const isAdminRoleMVPEnabled = extraArgument.unleashClient?.isEnabled('AdminRoleMVP') ?? false;
        const [user, userPermissions] = await Promise.all([dispatch(userThunk()), dispatch(userPermissionsThunk())]);
        const isOwner = isAdminRoleMVPEnabled ? userPermissions.Roles.some(isOwnerRole) : user.isAdmin;
        if (!isOwner) {
            return [];
        }
        return getAllMspSubsidiaries(extraArgument.api);
    },
    previous: previousSelector(selectMspSubsidiaries),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        upsert: (state, action: PayloadAction<MspSubsidiary>) => {
            if (!state.value) {
                return;
            }
            const idx = state.value.findIndex((s) => s.ID === action.payload.ID);
            if (idx >= 0) {
                state.value[idx] = action.payload;
            } else {
                state.value.push(action.payload);
            }
        },
        patch: (state, action: PayloadAction<{ id: string; changes: Partial<MspSubsidiary> }>) => {
            if (!state.value) {
                return;
            }
            const item = state.value.find((s) => s.ID === action.payload.id);
            if (item) {
                Object.assign(item, action.payload.changes);
            }
        },
        remove: (state, action: PayloadAction<string>) => {
            if (!state.value) {
                return;
            }
            state.value = state.value.filter((s) => s.ID !== action.payload);
        },
        setStatus: (state, action: PayloadAction<{ id: string; status: ORGANIZATION_STATE }>) => {
            if (!state.value) {
                return;
            }
            const item = state.value.find((s) => s.ID === action.payload.id);
            if (item) {
                item.Status = action.payload.status;
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const mspSubsidiariesReducer = { [name]: slice.reducer };
export const mspSubsidiariesThunk = modelThunk.thunk;
export const mspSubsidiariesActions = slice.actions;
