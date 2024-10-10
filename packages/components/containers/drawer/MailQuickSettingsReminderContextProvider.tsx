import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import { useUser } from '@proton/account/user/hooks';
import type { ThemeColor } from '@proton/colors/types';
import { QuickSettingsRemindersContext } from '@proton/components/hooks/drawer/useQuickSettingsReminders';
import useKeyTransparencyNotification from '@proton/components/hooks/useKeyTransparencyNotification';
import useLocalState from '@proton/components/hooks/useLocalState';
import { KEY_TRANSPARENCY_REMINDER_UPDATE } from '@proton/shared/lib/drawer/interfaces';
import isTruthy from '@proton/utils/isTruthy';

interface Props {
    defaultReminders?: ThemeColor[];
    children: ReactNode;
}
const MailQuickSettingsReminderContextProvider = ({ defaultReminders = [], children }: Props) => {
    const [user] = useUser();

    const [keyTransparencyNotificationSeen, toggleKeyTransparencyNotificationSeen] = useLocalState(
        false,
        `${user.ID || 'item'}-seen-key-transparency-notification`
    );

    const keyTransparencyNotification = useKeyTransparencyNotification();
    const reminders: ThemeColor[] = useMemo(() => {
        const keyTransparencyReminder: ThemeColor | undefined =
            keyTransparencyNotification && !keyTransparencyNotificationSeen ? keyTransparencyNotification : undefined;

        return [keyTransparencyReminder, ...defaultReminders].filter(isTruthy);
    }, [keyTransparencyNotification, keyTransparencyNotificationSeen, defaultReminders]);

    useEffect(() => {
        const resetKeyTransparencyReminder = (event: CustomEvent) => {
            const value = event.detail.value || true;
            if (value) {
                toggleKeyTransparencyNotificationSeen(value);
            }
        };

        document.addEventListener(KEY_TRANSPARENCY_REMINDER_UPDATE, resetKeyTransparencyReminder as EventListener);
        return () => {
            document.removeEventListener(
                KEY_TRANSPARENCY_REMINDER_UPDATE,
                resetKeyTransparencyReminder as EventListener
            );
        };
    }, []);

    return (
        <QuickSettingsRemindersContext.Provider
            value={{
                reminders,
            }}
        >
            {children}
        </QuickSettingsRemindersContext.Provider>
    );
};

export default MailQuickSettingsReminderContextProvider;
