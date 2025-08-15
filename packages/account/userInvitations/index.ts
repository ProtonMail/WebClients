import { type PayloadAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments, SharedStartListening } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { getInvitation, getInvitations } from '@proton/shared/lib/api/user';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Api, PendingInvitation, PendingInvitation as PendingUserInvitation } from '@proton/shared/lib/interfaces';
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

const fetchUserInvitation = (invitationID: string, api: Api) => {
    return api<{ UserInvitation: PendingUserInvitation }>(getInvitation(invitationID)).then(({ UserInvitation }) => {
        return UserInvitation;
    });
};

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
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<PendingInvitation>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload);
            }
        },
    },
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
const userInvitationsActions = slice.actions;
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

export const userInvitationsEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: CoreEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, UserInvitationsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.UserInvitations,
            get: (ID) => fetchUserInvitation(ID, api),
            refetch: () => dispatch(userInvitationsThunk({ cache: CacheType.None })),
            update: (result) => dispatch(userInvitationsActions.eventLoopV6(result)),
        });
    };
};
