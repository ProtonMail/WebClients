import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';

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
