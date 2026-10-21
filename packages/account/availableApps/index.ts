import { type PayloadAction, type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { type OrganizationState, organizationThunk } from '../organization';
import { userThunk } from '../user';
import { getAvailableAppsForUser } from './apps';

const name = 'availableApps' as const;

export interface AvailableAppsState extends OrganizationState {
    [name]: APP_NAMES[];
}

export const selectAvailableApps = (state: AvailableAppsState) => state[name];

const slice = createSlice({
    name,
    initialState: [] as APP_NAMES[],
    reducers: {
        set: (_, action: PayloadAction<APP_NAMES[]>) => action.payload,
    },
});

export const availableAppsReducer = { [name]: slice.reducer };
export const availableAppsActions = slice.actions;

/**
 * Gets the available apps and stores them. The listener does it at bootstrap; dispatch it to refresh them.
 * When the request fails, the stored list stays and the promise rejects.
 */
export const fetchAvailableApps = (): ThunkAction<
    Promise<void>,
    AvailableAppsState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extraArgument) => {
        const user = await dispatch(userThunk());
        const organization = await dispatch(organizationThunk()).catch(() => undefined);
        const apps = getAvailableAppsForUser({
            user,
            unleashClient: extraArgument.unleashClient,
            organization,
        });
        dispatch(availableAppsActions.set(apps));
    };
};
