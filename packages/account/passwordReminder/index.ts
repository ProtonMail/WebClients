import { getSrp } from '@protontech/crypto/srp';
import { type PayloadAction, type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { type AuthReminderResponse, authReminder, deleteAuthReminder, getInfo } from '@proton/shared/lib/api/auth';
import type { InfoAuthedResponse } from '@proton/shared/lib/authentication/interface';

import type { UserState } from '../user';
import type { UserSettingsState } from '../userSettings';

const name = 'passwordReminder' as const;

interface PasswordReminderState {
    /**
     * Whether the password reminders feature is available to this user
     */
    isAvailable: boolean;

    /**
     * Whether password reminders isAvailable and the setting is enabled
     */
    isEnabled: boolean;

    /**
     * Whether password reminders is available, enabled and the messaging cadence has expired
     */
    showReminders: boolean;
}

export interface PasswordReminderReduxState extends UserState, UserSettingsState {
    [name]: PasswordReminderState;
}

export const selectPasswordReminder = (state: PasswordReminderReduxState) => state.passwordReminder;

const initialState: PasswordReminderState = {
    isAvailable: false,
    isEnabled: false,
    showReminders: false,
};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        setIsAvailable: (state, action: PayloadAction<{ isAvailable: boolean }>) => {
            state.isAvailable = action.payload.isAvailable;
        },
        setIsEnabled: (state, action: PayloadAction<{ isEnabled: boolean }>) => {
            state.isEnabled = action.payload.isEnabled;
        },
        setShowReminders: (state, action: PayloadAction<{ showReminders: boolean }>) => {
            state.showReminders = action.payload.showReminders;
        },
        hideReminders: (state) => {
            state.showReminders = false;
        },
    },
});

export const passwordReminderReducer = { [name]: slice.reducer };
export const passwordReminderActions = slice.actions;

export const dismissPasswordReminder = (): ThunkAction<
    Promise<void>,
    PasswordReminderReduxState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        await extra.api(deleteAuthReminder());

        dispatch(passwordReminderActions.hideReminders());
    };
};

export const submitPasswordReminder = ({
    password,
}: {
    password: string;
}): ThunkAction<Promise<void>, PasswordReminderReduxState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const info = await extra.api<InfoAuthedResponse>(getInfo({}));
        const srp = await getSrp(info, { password }, info.Version);

        const { ServerProof } = await extra.api<AuthReminderResponse>(
            authReminder({
                ClientEphemeral: srp.clientEphemeral,
                ClientProof: srp.clientProof,
                SRPSession: info.SRPSession,
            })
        );

        if (ServerProof !== srp.expectedServerProof) {
            throw new Error('Unexpected server proof');
        }

        dispatch(passwordReminderActions.hideReminders());
    };
};
