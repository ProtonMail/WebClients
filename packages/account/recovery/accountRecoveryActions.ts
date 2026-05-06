import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { DelegatedAccessState } from '@proton/account/delegatedAccess';
import { selectAccountRecovery } from '@proton/account/recovery/accountRecovery';
import type { UserState } from '@proton/account/user';
import { type UserSettingsState, userSettingsActions } from '@proton/account/userSettings';
import type { ContactEmailsState } from '@proton/mail/store/contactEmails';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { updateEmail, updatePhone, updateResetEmail, updateResetPhone } from '@proton/shared/lib/api/settings';
import type { UserSettings } from '@proton/shared/lib/interfaces';

type RequiredState = UserSettingsState & UserState & ContactEmailsState & DelegatedAccessState;

export const toggleRecoveryEmailReset = ({
    value,
    persistPasswordScope,
}: {
    value: boolean;
    persistPasswordScope?: boolean;
}): ThunkAction<Promise<UserSettings>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const api = extra.api;

        const { UserSettings } = await api<{ UserSettings: UserSettings }>(
            updateResetEmail({ Reset: value ? 1 : 0, PersistPasswordScope: persistPasswordScope })
        );
        dispatch(userSettingsActions.set({ UserSettings }));

        return UserSettings;
    };
};

export const updateRecoveryEmailValue = ({
    value,
    persistPasswordScope,
}: {
    value: string;
    persistPasswordScope: boolean;
}): ThunkAction<Promise<UserSettings>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const accountRecoveryData = selectAccountRecovery(getState());
        const disableEmailReset = accountRecoveryData.isSentinelEnabled && accountRecoveryData.emailRecovery.hasReset;

        const api = extra.api;

        let { UserSettings } = await api<{ UserSettings: UserSettings }>(
            updateEmail({
                Email: value,
                // Prevent sentinel users getting double auth
                PersistPasswordScope: disableEmailReset || persistPasswordScope,
            })
        );

        dispatch(userSettingsActions.set({ UserSettings }));

        // TODO: temporarily included until BE takes care of it
        if (disableEmailReset) {
            UserSettings = await dispatch(
                toggleRecoveryEmailReset({ value: false, persistPasswordScope: persistPasswordScope })
            );
        }

        return UserSettings;
    };
};

export const toggleRecoveryPhoneReset = ({
    value,
    persistPasswordScope,
}: {
    value: boolean;
    persistPasswordScope?: boolean;
}): ThunkAction<Promise<UserSettings>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const api = extra.api;

        const { UserSettings } = await api<{ UserSettings: UserSettings }>(
            updateResetPhone({ Reset: value ? 1 : 0, PersistPasswordScope: persistPasswordScope })
        );
        dispatch(userSettingsActions.set({ UserSettings }));

        return UserSettings;
    };
};

export const updateRecoveryPhoneValue = ({
    value,
    persistPasswordScope,
}: {
    value: string;
    persistPasswordScope: boolean;
}): ThunkAction<Promise<UserSettings>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const accountRecoveryData = selectAccountRecovery(getState());
        const disablePhoneReset = accountRecoveryData.isSentinelEnabled && accountRecoveryData.phoneRecovery.hasReset;

        const api = extra.api;

        let { UserSettings } = await api<{ UserSettings: UserSettings }>(
            updatePhone({
                Phone: value,
                // Prevent sentinel users getting double auth
                PersistPasswordScope: disablePhoneReset || persistPasswordScope,
            })
        );

        dispatch(userSettingsActions.set({ UserSettings }));

        // TODO: temporarily included until BE takes care of it
        if (disablePhoneReset) {
            UserSettings = await dispatch(
                toggleRecoveryPhoneReset({ value: false, persistPasswordScope: persistPasswordScope })
            );
        }

        return UserSettings;
    };
};
