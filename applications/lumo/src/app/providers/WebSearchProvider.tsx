import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { sendWebSearchButtonToggledEvent } from '../util/telemetry';

interface WebSearchContextType {
    isWebSearchButtonToggled: boolean;
    // toggleWebSearch: () => void;
    handleWebSearchButtonClick: () => void;
    // setIsWebSearchButtonToggled: (value: boolean) => void;
}

const WebSearchContext = createContext<WebSearchContextType | undefined>(undefined);

interface WebSearchProviderProps {
    children: ReactNode;
    initialValue?: boolean;
}

export const WebSearchProvider = ({ children, initialValue = false }: WebSearchProviderProps) => {
    const [isWebSearchButtonToggled, setIsWebSearchButtonToggled] = useState<boolean>(initialValue);

    const toggleWebSearch = useCallback(() => {
        setIsWebSearchButtonToggled((prev) => !prev);
    }, []);

    const handleWebSearchButtonClick = useCallback(() => {
        sendWebSearchButtonToggledEvent(isWebSearchButtonToggled);
        toggleWebSearch();
    }, [isWebSearchButtonToggled, toggleWebSearch]);

    const value = {
        isWebSearchButtonToggled,
        // toggleWebSearch,
        handleWebSearchButtonClick,
        // setIsWebSearchButtonToggled,
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
