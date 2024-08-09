import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getGroups } from '@proton/shared/lib/api/groups';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Group } from '@proton/shared/lib/interfaces';

import type { DomainsState } from '../domains';
import { serverEvent } from '../eventLoop';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import type { OrganizationKeyState } from '../organizationKey';

const name = 'groups';

export interface GroupsState extends DomainsState, OrganizationKeyState {
    [name]: ModelState<Group[]>;
}

type SliceState = GroupsState[typeof name];
type Model = NonNullable<SliceState['value']>;

const initialState: SliceState = getInitialModelState<Group[]>();

export const selectGroups = (state: GroupsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, GroupsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return extraArgument
            .api(getGroups())
            .then(({ Groups }: { Groups: Group[] }) => Groups)
            .catch(() => []);
    },
    previous: previousSelector(selectGroups),
});

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

            if (action.payload.Groups) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.Groups,
                    itemKey: 'Group',
                });
            }
        });
    },
});

export const groupsReducer = { [name]: slice.reducer };
export const groupThunk = modelThunk.thunk;
