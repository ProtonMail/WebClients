import { type ReactNode, createContext, useContext } from 'react';

import type { HandleSendMessage } from '../hooks/useLumoActions';

interface ComposerActionsContextType {
    handleSendMessage: HandleSendMessage;
}

const ComposerActionsContext = createContext<ComposerActionsContextType | undefined>(undefined);

interface ComposerActionsProviderProps {
    children: ReactNode;
    handleSendMessage: HandleSendMessage;
}

export const ComposerActionsProvider = ({ children, handleSendMessage }: ComposerActionsProviderProps) => {
    return (
        <ComposerActionsContext.Provider value={{ handleSendMessage }}>{children}</ComposerActionsContext.Provider>
    );
};

export const useComposerActions = (): ComposerActionsContextType | undefined => {
    return useContext(ComposerActionsContext);
};
