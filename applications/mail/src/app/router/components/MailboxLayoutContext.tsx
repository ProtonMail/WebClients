import { type PropsWithChildren, type RefObject, createContext, useContext, useRef } from 'react';

import { useActiveBreakpoint } from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { isColumnMode } from 'proton-mail/helpers/mailSettings';

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

    const forceRowMode =
        breakpoints.viewportWidth['<=small'] || breakpoints.viewportWidth.medium || breakpoints.viewportWidth.large;

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
                isConversationGroupingEnabled: mailSettings?.ViewMode === VIEW_MODE.GROUP,
            }}
        >
            {children}
        </MailboxLayoutContext.Provider>
    );
};
