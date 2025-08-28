import { type PropsWithChildren, type RefObject, createContext, useContext, useRef } from 'react';

import { useActiveBreakpoint } from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { isColumnMode } from 'proton-mail/helpers/mailSettings';
import { useMailSelector } from 'proton-mail/store/hooks';

export interface MailboxProviderProps {
    labelDropdownToggleRef: RefObject<() => void>;
    moveDropdownToggleRef: RefObject<() => void>;
    mainAreaRef: RefObject<HTMLDivElement>;
    resizeAreaRef: RefObject<HTMLButtonElement>;
    listContainerRef: RefObject<HTMLDivElement>;
    messageContainerRef: RefObject<HTMLElement>;
    isColumnModeActive: boolean;
    isColumnLayoutPreferred: boolean;
    isConversationGroupingEnabled: boolean;
}

const MailboxLayoutContext = createContext<MailboxProviderProps | undefined>(undefined);

export const useMailboxLayoutProvider = () => {
    const context = useContext(MailboxLayoutContext);
    if (!context) {
        throw new Error('`useMailboxLayoutProvider` is used in a context not encapsulated by `MailboxLayoutContext`');
    }

    return context;
};

export const MailboxLayoutProvider = ({ children }: PropsWithChildren) => {
    const labelDropdownToggleRef = useRef<() => void>(() => {});
    const moveDropdownToggleRef = useRef<() => void>(() => {});
    const messageContainerRef = useRef<HTMLElement>(null);
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const resizeAreaRef = useRef<HTMLButtonElement>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    const [mailSettings] = useMailSettings();
    const breakpoints = useActiveBreakpoint();
    const currentLabelID = useMailSelector((state) => state.elements.params.labelID);

    const forceRowMode =
        breakpoints.viewportWidth['<=small'] || breakpoints.viewportWidth.medium || breakpoints.viewportWidth.large;

    // Force message view on Deleted folder because we don't have ConversationID for soft-deleted messages
    const isInDeletedFolder = currentLabelID === MAILBOX_LABEL_IDS.SOFT_DELETED;
    const isConversationGroupingEnabled = isInDeletedFolder ? false : mailSettings?.ViewMode === VIEW_MODE.GROUP;

    return (
        <MailboxLayoutContext.Provider
            value={{
                labelDropdownToggleRef,
                moveDropdownToggleRef,
                messageContainerRef,
                mainAreaRef,
                resizeAreaRef,
                listContainerRef,
                isColumnModeActive: isColumnMode(mailSettings) && !forceRowMode,
                isColumnLayoutPreferred: isColumnMode(mailSettings) || forceRowMode,
                isConversationGroupingEnabled,
            }}
        >
            {children}
        </MailboxLayoutContext.Provider>
    );
};
