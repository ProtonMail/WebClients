import { isBefore } from 'date-fns';

import type { UserSettings } from '@proton/shared/lib/interfaces';

export const getMessageCadenceHasExpired = ({ userSettings }: { userSettings: UserSettings }) => {
    const nextReminderTime = (userSettings.NextPasswordReminderTime || 0) * 1000;
    const nextReminder = new Date(nextReminderTime);
    const nextReminderIsInThePast = isBefore(nextReminder, new Date());

    return nextReminderIsInThePast;
};
