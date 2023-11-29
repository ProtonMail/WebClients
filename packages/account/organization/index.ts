import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getOrganization } from '@proton/shared/lib/api/organization';
import { FREE_ORGANIZATION } from '@proton/shared/lib/constants';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import type { Organization } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { UserState, userThunk } from '../user';

const name = 'organization';

export interface OrganizationState extends UserState {
    [name]: ModelState<Organization>;
}

type SliceState = OrganizationState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectOrganization = (state: OrganizationState) => state[name];

const modelThunk = createAsyncModelThunk<Model, OrganizationState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());
        if (user.isPaid) {
            return extraArgument.api(getOrganization()).then(({ Organization }) => Organization);
        }
        return FREE_ORGANIZATION as unknown as Organization;
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
            if (
                state.value &&
                state.value !== FREE_ORGANIZATION &&
                action.payload.User &&
                !action.payload.User.Subscribed
            ) {
                // Do not get any organization update when user becomes unsubscribed.
                state.value = FREE_ORGANIZATION as Organization;
                return;
            }

            if (state.value && action.payload.Organization) {
                state.value = updateObject(state.value, action.payload.Organization);
            }
        });
    },
});

export const organizationReducer = { [name]: slice.reducer };
export const organizationThunk = modelThunk.thunk;
