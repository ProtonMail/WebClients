import { isBefore } from 'date-fns';

import type { UserSettings } from '@proton/shared/lib/interfaces';

export const getMessageCadenceHasExpired = ({ userSettings }: { userSettings: UserSettings }) => {
    if (!userSettings.NextPasswordReminderTime) {
        return false;
    }

    const nextReminder = new Date(userSettings.NextPasswordReminderTime * 1000);
    return isBefore(nextReminder, new Date());
};
