import { PASSWORD_REMINDERS_VALUE, type UserSettings } from '@proton/shared/lib/interfaces';

export const getIsPasswordReminderEnabled = ({ userSettings }: { userSettings: UserSettings }) => {
    const passwordRemindersEnabled = userSettings.Flags.PasswordReminderOptOut === PASSWORD_REMINDERS_VALUE.ENABLED;

    return passwordRemindersEnabled;
};
