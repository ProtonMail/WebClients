import { useMemo } from 'react';

import { useSettingsLink } from '@proton/components/components';
import QuickSettingsReminder from '@proton/components/components/drawer/views/quickSettings/QuickSettingsReminder';
import QuickSettingsSection from '@proton/components/components/drawer/views/quickSettings/QuickSettingsSection';
import { useRecoveryNotification } from '@proton/components/hooks';
import { QuickSettingsReminders } from '@proton/shared/lib/drawer/interfaces';
import isTruthy from '@proton/utils/isTruthy';

interface Props {
    inAppReminders?: QuickSettingsReminders[];
}
const QuickSettingsRemindersSection = ({ inAppReminders = [] }: Props) => {
    const goToSettings = useSettingsLink();

    const insideDropdownRecoveryNotification = useRecoveryNotification(false);

    const reminders: QuickSettingsReminders[] = useMemo(() => {
        const recoveryNotificationReminder: QuickSettingsReminders | undefined = insideDropdownRecoveryNotification
            ? {
                  text: insideDropdownRecoveryNotification.text,
                  icon: 'exclamation-circle-filled',
                  color: insideDropdownRecoveryNotification.color,
                  callback: () => goToSettings(insideDropdownRecoveryNotification.path),
                  testID: 'recovery',
              }
            : undefined;

        return [...inAppReminders, recoveryNotificationReminder].filter(isTruthy);
    }, [insideDropdownRecoveryNotification, inAppReminders]);

    if (reminders.length === 0) {
        return null;
    }

    return (
        <QuickSettingsSection>
            {reminders.map((reminder) => {
                return (
                    <QuickSettingsReminder
                        reminder={reminder}
                        key={reminder.text}
                        data-testid={`drawer-quick-settings:${reminder.testID}-button`}
                    />
                );
            })}
        </QuickSettingsSection>
    );
};

export default QuickSettingsRemindersSection;
