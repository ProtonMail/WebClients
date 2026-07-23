import { createContext, useContext } from 'react';

import type { GlobalModal } from './interface';

export const GlobalModalContext = createContext<GlobalModal | undefined>(undefined);

export const useCalendarGlobalModals = () => {
    const context = useContext(GlobalModalContext);
    if (!context) {
        throw new Error('useCalendarGlobalModals must be used within a GlobalModalProvider');
    }

    return context;
};
