import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useLumoUserSettings } from '../hooks';
import { sendArtifactCreationToggledEvent } from '../util/telemetry';

interface ArtifactCreationContextType {
    isArtifactCreationEnabled: boolean;
    handleArtifactCreationToggle: () => void;
}

const ArtifactCreationContext = createContext<ArtifactCreationContextType | undefined>(undefined);

interface ArtifactCreationProviderProps {
    children: ReactNode;
}

export const ArtifactCreationProvider = ({ children }: ArtifactCreationProviderProps) => {
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const automaticArtifactCreation = lumoUserSettings.automaticArtifactCreation ?? true;

    const [isArtifactCreationEnabled, setIsArtifactCreationEnabled] = useState<boolean>(automaticArtifactCreation);

    useEffect(() => {
        setIsArtifactCreationEnabled(automaticArtifactCreation);
    }, [automaticArtifactCreation]);

    const handleArtifactCreationToggle = useCallback(() => {
        sendArtifactCreationToggledEvent(isArtifactCreationEnabled);
        const newValue = !isArtifactCreationEnabled;
        setIsArtifactCreationEnabled(newValue);
        updateSettings({
            automaticArtifactCreation: newValue,
            _autoSave: true,
        });
    }, [isArtifactCreationEnabled, updateSettings]);

    const value = {
        isArtifactCreationEnabled,
        handleArtifactCreationToggle,
    };

    return <ArtifactCreationContext.Provider value={value}>{children}</ArtifactCreationContext.Provider>;
};

export const useArtifactCreation = (): ArtifactCreationContextType => {
    const context = useContext(ArtifactCreationContext);
    if (context === undefined) {
        throw new Error('useArtifactCreation must be used within an ArtifactCreationProvider');
    }
    return context;
};
