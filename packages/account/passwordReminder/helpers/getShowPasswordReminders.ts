import type { UserModel, UserSettings } from '@proton/shared/lib/interfaces';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

import { getIsPasswordReminderAvailable } from './getIsPasswordReminderAvailable';
import { getIsPasswordReminderEnabled } from './getIsPasswordReminderEnabled';
import { getMessageCadenceHasExpired } from './getMessageCadenceHasExpired';

export const getShowPasswordReminders = ({
    unleashClient,
    user,
    userSettings,
}: {
    unleashClient: UnleashClient;
    user: UserModel;
    userSettings: UserSettings;
}) => {
    const isAvailable = getIsPasswordReminderAvailable({ user, unleashClient });
    const isEnabled = getIsPasswordReminderEnabled({ userSettings });
    const messageCadenceHasExpired = getMessageCadenceHasExpired({ userSettings });

    return isAvailable && isEnabled && messageCadenceHasExpired;
};
