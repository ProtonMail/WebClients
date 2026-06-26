import React, { type ReactNode, createContext, useContext } from 'react';

import type { HandleEditMessage, HandleRegenerateMessage, HandleSendMessage } from '../hooks/useLumoActions';
import type { ConversationError } from '../redux/slices/meta/errors';
import type { Message, SiblingInfo } from '../types';

interface ConversationActionsContextType {
    handleSendMessage: HandleSendMessage;
    handleAbort: () => void;
    handleEditMessage: HandleEditMessage;
    handleRegenerateMessage: HandleRegenerateMessage;
    getSiblingInfo: (message: Message) => SiblingInfo;
    handleRetryGeneration: (error: ConversationError) => void;
    messageChain: Message[];
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>;
}

const ConversationActionsContext = createContext<ConversationActionsContextType | undefined>(undefined);

interface ConversationActionsProviderProps {
    children: ReactNode;
    handleSendMessage: HandleSendMessage;
    handleAbort: () => void;
    handleEditMessage: HandleEditMessage;
    handleRegenerateMessage: HandleRegenerateMessage;
    getSiblingInfo: (message: Message) => SiblingInfo;
    handleRetryGeneration: (error: ConversationError) => void;
    messageChain: Message[];
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>;
}

export const ConversationActionsProvider = ({
    children,
    handleSendMessage,
    handleAbort,
    handleEditMessage,
    handleRegenerateMessage,
    getSiblingInfo,
    handleRetryGeneration,
    messageChain,
    messageChainRef,
}: ConversationActionsProviderProps) => {
    return (
        <ConversationActionsContext.Provider
            value={{
                handleSendMessage,
                handleAbort,
                handleEditMessage,
                handleRegenerateMessage,
                getSiblingInfo,
                handleRetryGeneration,
                messageChain,
                messageChainRef,
            }}
        >
            {children}
        </ConversationActionsContext.Provider>
    );
};

export const useConversationActions = (): ConversationActionsContextType => {
    const context = useContext(ConversationActionsContext);
    if (!context) {
        throw new Error('useConversationActions must be used within a ConversationActionsProvider');
    }
    return context;
};
