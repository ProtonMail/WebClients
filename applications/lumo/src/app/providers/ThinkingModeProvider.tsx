import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';

export type ThinkingMode = 'auto' | 'fast' | 'thinking';

interface ThinkingModeContextType {
    thinkingMode: ThinkingMode;
    setThinkingMode: (mode: ThinkingMode) => void;
    isThinkingEnabled: boolean;
}

const ThinkingModeContext = createContext<ThinkingModeContextType | undefined>(undefined);

interface ThinkingModeProviderProps {
    children: ReactNode;
}

export const ThinkingModeProvider = ({ children }: ThinkingModeProviderProps) => {
    const [thinkingMode, setThinkingModeState] = useState<ThinkingMode>('auto');

    const setThinkingMode = useCallback((mode: ThinkingMode) => {
        setThinkingModeState(mode);
    }, []);

    const value: ThinkingModeContextType = {
        thinkingMode,
        setThinkingMode,
        isThinkingEnabled: thinkingMode === 'thinking',
    };

    return <ThinkingModeContext.Provider value={value}>{children}</ThinkingModeContext.Provider>;
};

export const useThinkingMode = (): ThinkingModeContextType => {
    const context = useContext(ThinkingModeContext);
    if (context === undefined) {
        throw new Error('useThinkingMode must be used within a ThinkingModeProvider');
    }
    return context;
};
