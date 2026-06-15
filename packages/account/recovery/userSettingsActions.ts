import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { type UserSettingsState, userSettingsActions } from '@proton/account/userSettings';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { updateSessionAccountRecovery } from '@proton/shared/lib/api/sessionRecovery';
import { updateFlags } from '@proton/shared/lib/api/settings';
import type { UserSettings } from '@proton/shared/lib/interfaces';

export const toggleQrCodeSignIn = ({
    value,
}: {
    value: boolean;
}): ThunkAction<Promise<void>, UserSettingsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        // EdmOptOut: 0 = QR sign-in enabled; 1 = opted out
        const newValue = value ? 0 : 1;
        await extra.api<{ UserSettings: UserSettings }>(updateFlags({ EdmOptOut: newValue }));
        dispatch(userSettingsActions.update({ UserSettings: { Flags: { EdmOptOut: newValue } } }));
    };
};

export const toggleSignedInReset = ({
    value,
    persistPasswordScope = false,
}: {
    value: boolean;
    persistPasswordScope?: boolean;
}): ThunkAction<Promise<void>, UserSettingsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const newValue = value ? 1 : 0;
        await extra.api(
            updateSessionAccountRecovery({
                SessionAccountRecovery: newValue,
                PersistPasswordScope: persistPasswordScope,
            })
        );
        dispatch(userSettingsActions.update({ UserSettings: { SessionAccountRecovery: newValue } }));
    };
};
