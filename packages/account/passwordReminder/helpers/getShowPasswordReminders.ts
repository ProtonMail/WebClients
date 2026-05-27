import { isBefore } from 'date-fns';

import type { UserModel, UserSettings } from '@proton/shared/lib/interfaces';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

import { getIsPasswordReminderAvailable } from './getIsPasswordReminderAvailable';
import { getIsPasswordReminderEnabled } from './getIsPasswordReminderEnabled';

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
    if (!isAvailable || !isEnabled) {
        return false;
    }

    const nextReminderTime = (userSettings.NextPasswordReminderTime || 0) * 1000;
    const nextReminder = new Date(nextReminderTime);
    const nextReminderIsInThePast = isBefore(nextReminder, new Date());

    return nextReminderIsInThePast;
};
