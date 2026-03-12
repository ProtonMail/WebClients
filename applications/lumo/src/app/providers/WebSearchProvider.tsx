import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useLumoUserSettings } from '../hooks';
import { ModelType } from '../remote/nativeComposerBridge';
import {
    onNativeChangeModelType,
    onNativeToggleCreateImage,
    onNativeToggleWebSearch,
    setNativeCreateImage,
    setNativeModelType,
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
    const [modelType, setModelType] = useState<ModelType>(ModelType.Auto);
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const automaticWebSearch = lumoUserSettings.automaticWebSearch ?? true; // Default to true (automatic)

    // Initialize from persisted setting
    const [isWebSearchButtonToggled, setIsWebSearchButtonToggled] = useState<boolean>(automaticWebSearch);

    useEffect(() => {
        // TODO: i need an update
        setNativeCreateImage(createImageEnabled);
    }, [createImageEnabled]);

    useEffect(() => {
        // TODO: i need an update
        setNativeModelType(modelType);
    }, [modelType]);

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

    const handleChangeModelButtonClicked = useCallback(
        (modelType: ModelType) => {
            // TODO: i need an update
            setModelType(modelType);
        },
        [modelType]
    );

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

        const unsubscribeChangeModel = onNativeChangeModelType((e) => {
            console.log('Received change model listener');

            const { modelType } = e.detail;
            if (Object.values<string>(ModelType).includes(modelType)) {
                handleChangeModelButtonClicked(modelType as ModelType);
            } else {
                handleChangeModelButtonClicked(ModelType.Auto);
            }
        });

        return () => {
            console.log('Un-registered web search listener');
            unsubscribeToggleWebSearch();
            unsubscribeToggleCreateImage();
            unsubscribeChangeModel();
        };
    }, [handleWebSearchButtonClick, handleCreateImageButtonClick, handleChangeModelButtonClicked]);

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
