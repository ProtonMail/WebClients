import type { OrganizationExtended, UserModel, UserSettings } from '@proton/shared/lib/interfaces';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

import { getIsPasswordReminderAvailable } from './getIsPasswordReminderAvailable';
import { getIsPasswordReminderEnabled } from './getIsPasswordReminderEnabled';
import { getMessageCadenceHasExpired } from './getMessageCadenceHasExpired';

export const getShowPasswordReminders = ({
    unleashClient,
    user,
    userSettings,
    organization,
}: {
    unleashClient: UnleashClient;
    user: UserModel;
    userSettings: UserSettings;
    organization?: OrganizationExtended;
}) => {
    const isAvailable = getIsPasswordReminderAvailable({ user, unleashClient, organization });
    const isEnabled = getIsPasswordReminderEnabled({ userSettings });
    const messageCadenceHasExpired = getMessageCadenceHasExpired({ userSettings });

    return isAvailable && isEnabled && messageCadenceHasExpired;
};
