import React, { createContext, ReactNode } from 'react';

import { MessageCache } from '../MessageProvider';
import { getInstance } from '../../../__mocks__/cache';

export const cacheMock = getInstance();

export const MessageContext = createContext<MessageCache>(cacheMock);

interface Props {
    children: ReactNode;
}

const MessageProvider = ({ children }: Props) => {
    return <MessageContext.Provider value={cacheMock}>{children}</MessageContext.Provider>;
};

export default MessageProvider;
