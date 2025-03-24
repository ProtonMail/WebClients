import { type PropsWithChildren, type RefObject, createContext, useContext, useRef } from 'react';

import { useActiveBreakpoint } from '@proton/components/index';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { isColumnMode } from 'proton-mail/helpers/mailSettings';
import { useResizeMessageView } from 'proton-mail/hooks/useResizeMessageView';

export interface MailboxProviderProps {
    labelDropdownToggleRef: RefObject<() => void>;
    moveDropdownToggleRef: RefObject<() => void>;
    mainAreaRef: RefObject<HTMLDivElement>;
    resizeAreaRef: RefObject<HTMLButtonElement>;
    listContainerRef: RefObject<HTMLDivElement>;
    messageContainerRef: RefObject<HTMLElement>;
    columnModeSetting: boolean;
    columnMode: boolean;
    columnLayout: boolean;
    isConversationContentView: boolean;
    resize: {
        isResizing: boolean;
        enableResize: () => void;
        resetWidth: () => void;
        scrollBarWidth: number;
    };
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

    const resizeData = useResizeMessageView(mainAreaRef, resizeAreaRef, listContainerRef);

    const [mailSettings] = useMailSettings();
    const breakpoints = useActiveBreakpoint();

    const columnModeSetting = isColumnMode(mailSettings);
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
                columnModeSetting,
                columnMode: columnModeSetting && !forceRowMode,
                columnLayout: columnModeSetting || forceRowMode,
                isConversationContentView: mailSettings?.ViewMode === VIEW_MODE.GROUP,
                resize: {
                    isResizing: resizeData.isResizing,
                    enableResize: resizeData.enableResize,
                    resetWidth: resizeData.resetWidth,
                    scrollBarWidth: resizeData.scrollBarWidth,
                },
            }}
        >
            {children}
        </MailboxLayoutContext.Provider>
    );
};
