import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { ThemeColor } from '@proton/colors/types';
import MailQuickSettingsReminderContextProvider from '@proton/components/containers/drawer/MailQuickSettingsReminderContextProvider';
import useConfig from '@proton/components/hooks/useConfig';
import useRecoveryNotification from '@proton/components/hooks/useRecoveryNotification';
import { APPS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

/**
 * Quick settings are now part of the drawer.
 * Some elements might trigger the display of a dot on the quick settings button.
 * Once the notification has been seen by the user, the dot needs to disappear on the button.
 * The  role of this context is keep track of these values correctly across the application,
 * because the value might change after a user action within the drawer, involving a change on the setting button
 */
export const QuickSettingsRemindersContext = createContext<{
    reminders: ThemeColor[];
} | null>(null);

export default function useQuickSettingsReminders() {
    const quickSettingsNotificationContext = useContext(QuickSettingsRemindersContext);

    if (!quickSettingsNotificationContext) {
        throw new Error('Quick Settings reminders provider not initialized');
    }

    const { reminders } = quickSettingsNotificationContext;

    return reminders;
}

export const QuickSettingsRemindersProvider = ({ children }: { children: ReactNode }) => {
    const { APP_NAME } = useConfig();

    const recoveryNotification = useRecoveryNotification(false, true);

    const reminders: ThemeColor[] = [recoveryNotification?.color].filter(isTruthy);

    /**
     * Need to create a different context per app if some reminders are app specific
     */
    if (APP_NAME === APPS.PROTONMAIL) {
        return (
            <MailQuickSettingsReminderContextProvider defaultReminders={reminders}>
                {children}
            </MailQuickSettingsReminderContextProvider>
        );
    }

    return (
        <QuickSettingsRemindersContext.Provider value={{ reminders }}>
            {children}
        </QuickSettingsRemindersContext.Provider>
    );
};
