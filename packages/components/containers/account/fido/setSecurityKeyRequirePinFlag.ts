import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { type UserSettingsState, userSettingsActions } from '@proton/account/userSettings';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { updateFlags } from '@proton/shared/lib/api/settings';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { FIDO2_CREDENTIALS_PIN_VALUE } from '@proton/shared/lib/interfaces';

export const setSecurityKeyRequirePinFlag = (
    value: boolean
): ThunkAction<Promise<void>, UserSettingsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const flagValue = value ? FIDO2_CREDENTIALS_PIN_VALUE.ENABLED : FIDO2_CREDENTIALS_PIN_VALUE.DISABLED;
        if (getState().userSettings.value?.Flags.Fido2CredentialsPinOptIn !== flagValue) {
            await extra.api<{ UserSettings: UserSettings }>(updateFlags({ Fido2CredentialsPinOptIn: flagValue }));
            dispatch(userSettingsActions.update({ UserSettings: { Flags: { Fido2CredentialsPinOptIn: flagValue } } }));
        }
    };
};
