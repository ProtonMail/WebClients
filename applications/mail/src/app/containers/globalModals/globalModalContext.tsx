import { createContext, useContext } from 'react';

import type { GlobalModal } from './inteface';

export const GlobalModalContext = createContext<GlobalModal | undefined>(undefined);

export const useMailGlobalModals = () => {
    const context = useContext(GlobalModalContext);
    if (!context) {
        throw new Error('useGlobalModal must be used within a GlobalModalProvider');
    }

    return context;
};
