import { useMemo } from 'react';

import { createHooks } from '@proton/redux-utilities';
import {
    getIsCalendarDisabled,
    getIsCalendarWritable,
    getIsSharedCalendar,
    getVisualCalendars,
    sortCalendars,
} from '@proton/shared/lib/calendar/calendar';

import { calendarsThunk, selectCalendars } from './index';

const hooks = createHooks(calendarsThunk, selectCalendars);

export const useCalendars = hooks.useValue;
export const useGetCalendars = hooks.useGet;

export interface UseWriteableCalendarsOptions {
    canBeShared?: boolean;
    canBeDisabled?: boolean;
}

export const useWriteableCalendars = ({
    canBeShared = false,
    canBeDisabled = false,
}: UseWriteableCalendarsOptions = {}): [ReturnType<typeof getVisualCalendars>, boolean] => {
    const [calendars = [], loading] = useCalendars();

    const writeableCalendars = useMemo(() => {
        const visualCalendars = sortCalendars(getVisualCalendars(calendars));
        return visualCalendars.filter((calendar) => {
            if (!getIsCalendarWritable(calendar)) {
                return false;
            }

            if (!canBeDisabled && getIsCalendarDisabled(calendar)) {
                return false;
            }

            if (!canBeShared && getIsSharedCalendar(calendar)) {
                return false;
            }

            return true;
        });
    }, [calendars]);

    return [writeableCalendars, loading];
};
