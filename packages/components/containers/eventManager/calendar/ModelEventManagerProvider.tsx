import { ReactNode, createContext, useContext, useEffect } from 'react';

import { CalendarModelEventManager, calendarEventModelManager } from '@proton/calendar';

import { useApi } from '../../../hooks';

const CalendarModelEventManagerContext = createContext<CalendarModelEventManager | null>(null);

interface Props {
    children: ReactNode;
}

const ModelEventManagerProvider = ({ children }: Props) => {
    const api = useApi();
    const silentApi: <T>(config: object) => Promise<T> = (config) => api({ ...config, silence: true });

    useEffect(() => {
        calendarEventModelManager.setApi(silentApi);
    }, []);

    return (
        <CalendarModelEventManagerContext.Provider value={calendarEventModelManager}>
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

export default ModelEventManagerProvider;
