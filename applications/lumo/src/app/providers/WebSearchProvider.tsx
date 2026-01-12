import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useLumoUserSettings } from '../hooks';
import { sendWebSearchButtonToggledEvent } from '../util/telemetry';

interface WebSearchContextType {
    isWebSearchButtonToggled: boolean;
    handleWebSearchButtonClick: () => void;
}

const WebSearchContext = createContext<WebSearchContextType | undefined>(undefined);

interface WebSearchProviderProps {
    children: ReactNode;
}

export const WebSearchProvider = ({ children }: WebSearchProviderProps) => {
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const automaticWebSearch = lumoUserSettings.automaticWebSearch ?? false;

    // Initialize from persisted setting
    const [isWebSearchButtonToggled, setIsWebSearchButtonToggled] = useState<boolean>(automaticWebSearch);

    // Sync with persisted setting when it changes (e.g., from settings modal)
    useEffect(() => {
        setIsWebSearchButtonToggled(automaticWebSearch);
    }, [automaticWebSearch]);

    const handleWebSearchButtonClick = useCallback(() => {
        sendWebSearchButtonToggledEvent(isWebSearchButtonToggled);
        const newValue = !isWebSearchButtonToggled;
        setIsWebSearchButtonToggled(newValue);
        // Persist the setting change
        updateSettings({
            automaticWebSearch: newValue,
            _autoSave: true,
        });
    }, [isWebSearchButtonToggled, updateSettings]);

    const value = {
        isWebSearchButtonToggled,
        handleWebSearchButtonClick,
    };

    return <WebSearchContext.Provider value={value}>{children}</WebSearchContext.Provider>;
};

export const useWebSearch = (): WebSearchContextType => {
    const context = useContext(WebSearchContext);
    if (context === undefined) {
        throw new Error('useWebSearch must be used within a WebSearchProvider');
    }
    return context;
};
