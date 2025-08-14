import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ConversationContext {
    conversationId: string | undefined;
    setConversationId: (id: string | undefined) => void;
    isNewChatPage: boolean;
}

export const HistoryContext = createContext<ConversationContext | null>(null);

interface Props {
    children?: ReactNode;
}

const useConversationState = () => {
    const [conversationId, setConversationId] = useState<string | undefined>(undefined);

    return {
        conversationId,
        setConversationId,
        isNewChatPage: conversationId === undefined,
    };
};

export const ConversationProvider = ({ children }: Props) => {
    const value = useConversationState();

    return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};

export function useConversation() {
    const state = useContext(HistoryContext);

    if (!state) {
        throw new Error('Initizale ConversationId Provider');
    }

    return state;
}
