import { createContext, useContext, useMemo } from 'react';

import type { SwitchableSession } from '../../lib/auth/switch';
import { useAuthStore } from './AuthStoreProvider';

export const SessionsContext = createContext<SwitchableSession[]>([]);

export const useSessions = () => useContext(SessionsContext);

export const useSwitchableSessionCount = () => useSessions().length;

export const useAvailableSessions = () => {
    const sessions = useSessions();
    const authStore = useAuthStore();

    return useMemo(() => {
        const currentLocalID = authStore?.getLocalID();
        return sessions.filter(({ LocalID, PrimaryEmail, DisplayName }) =>
            Boolean(LocalID !== currentLocalID && (PrimaryEmail || DisplayName))
        );
    }, [sessions]);
};
