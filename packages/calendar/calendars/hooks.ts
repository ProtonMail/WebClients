import { useMemo } from 'react';

import { createHooks } from '@proton/redux-utilities';
import { getIsCalendarWritable, getVisualCalendars, sortCalendars } from '@proton/shared/lib/calendar/calendar';

import { calendarsThunk, selectCalendars } from './index';

const hooks = createHooks(calendarsThunk, selectCalendars);

export const useCalendars = hooks.useValue;
export const useGetCalendars = hooks.useGet;

export const useWriteableCalendars = (): [ReturnType<typeof getVisualCalendars>, boolean] => {
    const [calendars = [], loading] = useCalendars();

    const writeableCalendars = useMemo(() => {
        const visualCalendars = sortCalendars(getVisualCalendars(calendars));
        return visualCalendars.filter((calendar) => getIsCalendarWritable(calendar));
    }, [calendars]);

    return [writeableCalendars, loading];
};
