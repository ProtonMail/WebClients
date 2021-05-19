import React, { createContext, ReactNode, RefObject, useContext, useEffect } from 'react';
import { useHandler } from 'react-components';

const MailContentRefContext = createContext<RefObject<HTMLDivElement>>(null as any);

/**
 * Call the handler whenever the user click on the mail app content
 * but not on any kind of modal / notification / composer window
 */
export const useClickMailContent = (handler: (event: Event) => void) => {
    const stableHandler = useHandler(handler);

    const mailContentRef = useContext(MailContentRefContext);

    useEffect(() => {
        mailContentRef.current?.addEventListener('click', stableHandler, { passive: true });
        mailContentRef.current?.addEventListener('touchstart', stableHandler, { passive: true });

        return () => {
            mailContentRef.current?.removeEventListener('click', stableHandler);
            mailContentRef.current?.removeEventListener('touchstart', stableHandler);
        };
    }, []);
};

interface Props {
    children: ReactNode;
    mailContentRef: RefObject<HTMLDivElement>;
}

export const MailContentRefProvider = ({ children, mailContentRef }: Props) => {
    return <MailContentRefContext.Provider value={mailContentRef}>{children}</MailContentRefContext.Provider>;
};
