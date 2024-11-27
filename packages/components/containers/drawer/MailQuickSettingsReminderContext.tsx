import { createContext } from 'react';

import type { ThemeColor } from '@proton/colors/types';

export const QuickSettingsRemindersContext = createContext<{
    reminders: ThemeColor[];
} | null>(null);
