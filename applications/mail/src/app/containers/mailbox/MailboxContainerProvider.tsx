import type { RefObject } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import debounce from 'lodash/debounce';

import { selectElementID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

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
}

const MailboxContainerContext = createContext<ContextProps | undefined>(undefined);

export const MailboxContainerContextProvider = ({ children, isResizing, containerRef }: ProviderProps) => {
    /**
     * This value is set in order to trigger a rerender after containerRef scroll.
     * This helps the tooltip to keep up to date x/y coords related to the iframe
     */
    const [containerScrollTop, setContainerScrollTop] = useState(0);
    const elementID = useMailSelector(selectElementID);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-60916B
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
