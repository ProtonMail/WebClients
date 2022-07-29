import { RefObject, createContext, useContext, useEffect, useState } from 'react';

import debounce from '@proton/utils/debounce';

interface ContextProps {
    /**
     * Related to column layout when user is resizing MessageView.
     */
    isResizing: boolean;
    /**
     * MessageView VerticalScroll offsetTop
     */
    containerScrollTop: number;
}
interface ProviderProps {
    children: React.ReactNode;
    /**
     * Related to column layout when user is resizing MessageView.
     */
    isResizing: boolean;
    /**
     * MessageView VerticalScroll offsetTop
     * Pass null value for tests
     */
    containerRef: RefObject<HTMLElement> | null;
    elementID: string | undefined;
}

const MailboxContainerContext = createContext<ContextProps | undefined>(undefined);

export const MailboxContainerContextProvider = ({ children, isResizing, containerRef, elementID }: ProviderProps) => {
    /**
     * This value is set in order to trigger a rerender after containerRef scroll.
     * This helps the tooltip to keep up to date x/y coords related to the iframe
     */
    const [containerScrollTop, setContainerScrollTop] = useState(0);

    useEffect(() => {
        const containerEl = containerRef && containerRef?.current;

        if (!containerEl) {
            return;
        }

        const onScroll = debounce(() => {
            setContainerScrollTop(containerEl.scrollTop);
        }, 100);
        containerEl.addEventListener('scroll', onScroll);

        return () => {
            containerEl.removeEventListener('scroll', onScroll);
            setContainerScrollTop(0);
        };
    }, [elementID]);

    return (
        <MailboxContainerContext.Provider value={{ isResizing, containerScrollTop }}>
            {children}
        </MailboxContainerContext.Provider>
    );
};

export const useMailboxContainerContext = (): ContextProps => {
    const context = useContext(MailboxContainerContext);

    if (context === undefined) {
        throw new Error('useResizeMessageViewContext hook should be used inside MailboxContainerContextProvider');
    }

    return {
        isResizing: context.isResizing,
        containerScrollTop: context.containerScrollTop,
    };
};
