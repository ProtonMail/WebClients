import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { updateFlags } from '@proton/shared/lib/api/settings';
import type { PASSWORD_REMINDERS_VALUE, UserSettings } from '@proton/shared/lib/interfaces';

import { type UserSettingsState, userSettingsActions } from '../userSettings';

export const setPasswordReminderFlag = ({
    value,
}: {
    value: PASSWORD_REMINDERS_VALUE;
}): ThunkAction<Promise<void>, UserSettingsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        await extra.api<{ UserSettings: UserSettings }>(updateFlags({ PasswordReminderOptOut: value }));
        dispatch(userSettingsActions.update({ UserSettings: { Flags: { PasswordReminderOptOut: value } } }));
    };
};
