import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { MessageWithOptionalBody } from '@proton/mail-message/store/messages/messagesTypes';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

/**
 * Mailbox state and navigation the composer needs from the application hosting it.
 */
export interface ComposerHost {
    scheduledCount: number;
    scheduledCountLoading: boolean;
    onMessageSent: (sent: Message) => void;
    onDraftDiscarded: (draft: MessageWithOptionalBody) => void;
}

const ComposerHostContext = createContext<ComposerHost | undefined>(undefined);

interface Props {
    value: ComposerHost;
    children: ReactNode;
}

export const ComposerHostProvider = ({ value, children }: Props) => (
    <ComposerHostContext.Provider value={value}>{children}</ComposerHostContext.Provider>
);

export const useComposerHost = () => {
    const host = useContext(ComposerHostContext);

    if (!host) {
        throw new Error('useComposerHost must be used inside a ComposerHostProvider');
    }

    return host;
};
