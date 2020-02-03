import React, { createContext, ReactNode } from 'react';

import { ConversationCache } from '../ConversationProvider';
import { getInstance } from '../../../__mocks__/cache';

export const cacheMock = getInstance();

export const ConversationContext = createContext<ConversationCache>(cacheMock);

interface Props {
    children: ReactNode;
}

const ConversationProvider = ({ children }: Props) => {
    return <ConversationContext.Provider value={cacheMock}>{children}</ConversationContext.Provider>;
};

export default ConversationProvider;
