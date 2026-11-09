import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import { useUser } from '@proton/account/user/hooks';
import type { ThemeColor } from '@proton/colors/types';
import { KEY_TRANSPARENCY_REMINDER_UPDATE } from '@proton/shared/lib/drawer/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import useKeyTransparencyNotification from '../../hooks/useKeyTransparencyNotification';
import useLocalState from '../../hooks/useLocalState';
import { QuickSettingsRemindersContext } from './MailQuickSettingsReminderContext';

interface Props {
    defaultReminders?: ThemeColor[];
    children: ReactNode;
}

const MailQuickSettingsReminderContextProvider = ({ defaultReminders = [], children }: Props) => {
    const [user] = useUser();

    const [keyTransparencyNotificationSeen, setKeyTransparencyNotificationSeen] = useLocalState(
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
        const updateKeyTransparencyReminder = (event: CustomEvent<{ value: boolean }>) => {
            setKeyTransparencyNotificationSeen(event.detail.value);
        };

        document.addEventListener(KEY_TRANSPARENCY_REMINDER_UPDATE, updateKeyTransparencyReminder as EventListener);
        return () => {
            document.removeEventListener(
                KEY_TRANSPARENCY_REMINDER_UPDATE,
                updateKeyTransparencyReminder as EventListener
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
