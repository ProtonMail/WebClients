import type { ReactNode, RefObject } from 'react';
import { createContext, useContext, useEffect } from 'react';

import { useHandler } from '@proton/components';

const MailContentRefContext = createContext<RefObject<HTMLDivElement>>(null as any);

/**
 * Call the handler whenever the user click on the mail app content
 * but not on any kind of modal / notification / composer window
 */
export const useClickMailContent = (handler: (event: Event) => void) => {
    const stableHandler = useHandler(handler);

    const mailContentRef = useContext(MailContentRefContext);

    // mousedown and touchstart avoid issue with the click in portal (modal, notification, composer, dropdown)
    useEffect(() => {
        mailContentRef.current?.addEventListener('mousedown', stableHandler, { passive: true });
        mailContentRef.current?.addEventListener('touchstart', stableHandler, { passive: true });

        return () => {
            mailContentRef.current?.removeEventListener('mousedown', stableHandler);
            // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-44599F
            mailContentRef.current?.removeEventListener('touchstart', stableHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-233B5C
    }, []);
};

interface Props {
    children: ReactNode;
    mailContentRef: RefObject<HTMLDivElement>;
}

export const MailContentRefProvider = ({ children, mailContentRef }: Props) => {
    return <MailContentRefContext.Provider value={mailContentRef}>{children}</MailContentRefContext.Provider>;
};
