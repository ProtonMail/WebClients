import { ReactNode } from 'react';

import { QuickSettingsRemindersContext } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

interface Props {
    children: ReactNode;
}

/**
 * It's a duplicate of the original QuickSettingsReminderProvider for testing purpose
 * We want the experiments to always be "A" and loaded
 */
const QuickSettingsTestProvider = ({ children }: Props) => {
    return (
        <QuickSettingsRemindersContext.Provider value={{ reminders: [] }}>
            {children}
        </QuickSettingsRemindersContext.Provider>
    );
};

export default QuickSettingsTestProvider;
