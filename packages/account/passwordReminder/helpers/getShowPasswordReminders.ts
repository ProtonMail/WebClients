import type { OrganizationExtended, UserModel, UserSettings } from '@proton/shared/lib/interfaces';

import { getIsPasswordReminderAvailable } from './getIsPasswordReminderAvailable';
import { getIsPasswordReminderEnabled } from './getIsPasswordReminderEnabled';
import { getMessageCadenceHasExpired } from './getMessageCadenceHasExpired';

export const getShowPasswordReminders = ({
    user,
    userSettings,
    organization,
}: {
    user: UserModel;
    userSettings: UserSettings;
    organization?: OrganizationExtended;
}) => {
    const isAvailable = getIsPasswordReminderAvailable({ user, organization });
    const isEnabled = getIsPasswordReminderEnabled({ userSettings });
    const messageCadenceHasExpired = getMessageCadenceHasExpired({ userSettings });

    return isAvailable && isEnabled && messageCadenceHasExpired;
};
