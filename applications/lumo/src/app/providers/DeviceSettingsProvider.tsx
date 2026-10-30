import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { useNativeNotificationPermission } from '../hooks/useNativeNotificationPermission';

interface DeviceSettingsContextValue {
    /** Native notification permission and actions, currently implemented for desktop. */
    notificationSettings: ReturnType<typeof useNativeNotificationPermission>;
}

const DeviceSettingsContext = createContext<DeviceSettingsContextValue | null>(null);

/** Shares device settings and owns their app-level change listeners. */
export const DeviceSettingsProvider = ({ children }: { children: ReactNode }) => {
    const notificationSettings = useNativeNotificationPermission();
    const value = useMemo(() => ({ notificationSettings }), [notificationSettings]);

    return <DeviceSettingsContext.Provider value={value}>{children}</DeviceSettingsContext.Provider>;
};

/** Reads app-wide device settings without adding listeners or querying the OS. */
export const useDeviceSettings = () => {
    const context = useContext(DeviceSettingsContext);
    if (!context) {
        throw new Error('useDeviceSettings must be used within a DeviceSettingsProvider');
    }
    return context;
};
