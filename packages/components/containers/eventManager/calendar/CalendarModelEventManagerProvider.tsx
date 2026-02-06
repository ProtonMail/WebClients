import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { CalendarModelEventManager } from '@proton/calendar/calendarModelEventManager';

const CalendarModelEventManagerContext = createContext<CalendarModelEventManager | null>(null);

interface Props {
    children: ReactNode;
    calendarModelEventManager: CalendarModelEventManager;
}

const CalendarModelEventManagerProvider = ({ children, calendarModelEventManager }: Props) => {
    return (
        <CalendarModelEventManagerContext.Provider value={calendarModelEventManager}>
            {children}
        </CalendarModelEventManagerContext.Provider>
    );
};

export const useCalendarModelEventManager = () => {
    const state = useContext(CalendarModelEventManagerContext);
    if (!state) {
        throw new Error('Trying to use uninitialized ModelEventManagerProvider');
    }
    return state;
};

export default CalendarModelEventManagerProvider;
