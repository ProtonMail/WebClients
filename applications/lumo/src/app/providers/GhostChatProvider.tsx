import type { ReactNode } from 'react';
import { createContext, useCallback, useContext } from 'react';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import {
    setGhostChatMode as setGhostChatModeAction,
    toggleGhostChatMode as toggleGhostChatModeAction,
} from '../redux/slices/ghostChat';

interface GhostChatContextValue {
    isGhostChatMode: boolean;
    setGhostChatMode: (enabled: boolean) => void;
    toggleGhostChatMode: () => void;
}

const GhostChatContext = createContext<GhostChatContextValue | null>(null);

export const useGhostChat = () => {
    const context = useContext(GhostChatContext);
    if (context === null) {
        throw new Error('useGhostChat must be used within a GhostChatProvider');
    }
    return context;
};

interface GhostChatProviderProps {
    children: ReactNode;
}

export const GhostChatProvider = ({ children }: GhostChatProviderProps) => {
    const dispatch = useLumoDispatch();
    const isGhostChatModeRedux = useLumoSelector((state) => state.ghostChat.isGhostChatMode);

    // Allow both guests and regular users to use ghost chat mode
    const isGhostChatMode = isGhostChatModeRedux;

    const setGhostChatMode = useCallback(
        (enabled: boolean) => {
            dispatch(setGhostChatModeAction(enabled));
        },
        [dispatch]
    );

    const toggleGhostChatMode = useCallback(() => {
        dispatch(toggleGhostChatModeAction());
    }, [dispatch]);

    const value: GhostChatContextValue = {
        isGhostChatMode,
        setGhostChatMode,
        toggleGhostChatMode,
    };

    return <GhostChatContext.Provider value={value}>{children}</GhostChatContext.Provider>;
};
