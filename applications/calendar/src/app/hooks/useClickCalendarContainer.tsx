import { ReactNode, RefObject, createContext, useContext, useEffect } from 'react';

import { useHandler } from '@proton/components';

const CalendarContentRefContext = createContext<RefObject<HTMLDivElement>>(null as any);

/**
 * Call the handler whenever the user clicks on the calendar app content
 * but not on any kind of modal / notification / event popover
 */
export const useClickCalendarContainer = (handler: (event: Event) => void) => {
    const stableHandler = useHandler(handler);

    const calendarContentRef = useContext(CalendarContentRefContext);

    // mousedown and touchstart avoid issue with the click in portal (modal, notification, composer, dropdown)
    useEffect(() => {
        calendarContentRef.current?.addEventListener('mousedown', stableHandler, { passive: true });
        calendarContentRef.current?.addEventListener('touchstart', stableHandler, { passive: true });

        return () => {
            calendarContentRef.current?.removeEventListener('mousedown', stableHandler);
            calendarContentRef.current?.removeEventListener('touchstart', stableHandler);
        };
    }, [calendarContentRef]);
};

interface Props {
    children: ReactNode;
    calendarContentRef: RefObject<HTMLDivElement>;
}

export const CalendarContentRefProvider = ({ children, calendarContentRef }: Props) => {
    return (
        <CalendarContentRefContext.Provider value={calendarContentRef}>{children}</CalendarContentRefContext.Provider>
    );
};
