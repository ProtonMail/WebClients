import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getInvitations } from '@proton/shared/lib/api/user';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { PendingInvitation } from '@proton/shared/lib/interfaces';
import type { Api, PendingInvitation as PendingUserInvitation } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { serverEvent } from '../eventLoop';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import type { OrganizationState } from '../organization';
import { selectOrganization } from '../organization';

const fetchPendingUserInvitations = (api: Api) =>
    api<{ UserInvitations: PendingUserInvitation[] }>(getInvitations()).then(({ UserInvitations }) => {
        return UserInvitations;
    });

const name = 'userInvitations' as const;

export interface UserInvitationsState extends OrganizationState {
    [name]: ModelState<PendingInvitation[]>;
}

type SliceState = UserInvitationsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserInvitations = (state: UserInvitationsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, UserInvitationsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return fetchPendingUserInvitations(extraArgument.api);
    },
    previous: previousSelector(selectUserInvitations),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.UserInvitations) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.UserInvitations,
                    itemKey: 'UserInvitation',
                });
            }
        });
    },
});

export const userInvitationsReducer = { [name]: slice.reducer };
export const userInvitationsThunk = modelThunk.thunk;

export const userInvitationsListener = (startListening: SharedStartListening<UserInvitationsState>) => {
    startListening({
        predicate: (action, currentState, previousState) => {
            // Force refresh the invitations when the organization changes since this could cause errors in the invitations
            const previousOrganization = selectOrganization(previousState).value;
            const currentOrganization = selectOrganization(currentState).value;
            if ((['PlanName'] as const).some((key) => currentOrganization?.[key] !== previousOrganization?.[key])) {
                return true;
            }
            return false;
        },
        effect: (action, listenerApi) => {
            listenerApi.dispatch(userInvitationsThunk({ cache: CacheType.None })).catch(noop);
        },
    });
};
