import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useLumoUserSettings } from '../hooks';
import {
    onNativeToggleCreateImage,
    onNativeToggleWebSearch,
    setNativeCreateImage,
    setNativeWebSearch,
} from '../remote/nativeComposerBridgeHelpers';
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
    const [createImageEnabled, setCreateImageEnabled] = useState(false);
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const automaticWebSearch = lumoUserSettings.automaticWebSearch ?? true; // Default to true (automatic)

    // Initialize from persisted setting
    const [isWebSearchButtonToggled, setIsWebSearchButtonToggled] = useState<boolean>(automaticWebSearch);

    useEffect(() => {
        // TODO: i need an update
        setNativeCreateImage(createImageEnabled);
    }, [createImageEnabled]);

    // Sync with persisted setting when it changes (e.g., from settings modal)
    useEffect(() => {
        setIsWebSearchButtonToggled(automaticWebSearch);
        setNativeWebSearch(automaticWebSearch);
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

    const handleCreateImageButtonClick = useCallback(() => {
        // TODO: i need an update
        const newValue = !createImageEnabled;
        setCreateImageEnabled(newValue);
    }, [createImageEnabled]);

    useEffect(() => {
        console.log('Registered web search listener');

        const unsubscribeToggleWebSearch = onNativeToggleWebSearch((_) => {
            console.log('Received toggle web search listener');

            handleWebSearchButtonClick();
        });

        const unsubscribeToggleCreateImage = onNativeToggleCreateImage((_) => {
            console.log('Received toggle create image listener');

            handleCreateImageButtonClick();
        });

        return () => {
            console.log('Un-registered web search listener');
            unsubscribeToggleWebSearch();
            unsubscribeToggleCreateImage();
        };
    }, [handleWebSearchButtonClick, handleCreateImageButtonClick]);

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
