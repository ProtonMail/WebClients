import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { SchedulingState } from './interface';

interface SchedulingContextValue {
    createNewSchedulingPage: () => void;
    schedulingState: SchedulingState;
    writeableCalendars: VisualCalendar[];
    loadingWriteableCalendars: boolean;
}

const SchedulingContext = createContext<SchedulingContextValue | undefined>(undefined);

export const SchedulingProvider = ({ children }: { children: ReactNode }) => {
    const [schedulingState, setSchedulingState] = useState<SchedulingState>(SchedulingState.OFF);

    const [writeableCalendars = [], loadingWriteableCalendars] = useWriteableCalendars();

    const createNewSchedulingPage = () => {
        setSchedulingState(SchedulingState.CREATE_NEW);
    };

    const value: SchedulingContextValue = {
        createNewSchedulingPage,
        schedulingState,
        writeableCalendars,
        loadingWriteableCalendars,
    };

    return <SchedulingContext.Provider value={value}>{children}</SchedulingContext.Provider>;
};

export const useScheduling = () => {
    const context = useContext(SchedulingContext);
    if (context === undefined) {
        throw new Error('useScheduling must be used within a SchedulingProvider');
    }
    return context;
};
