import { useEffect } from 'react';

import { calendarServerEvent } from '@proton/calendar/calendarServerEvent';
import { baseUseDispatch } from '@proton/react-redux-store';

import { useCalendarModelEventManager } from './CalendarModelEventManagerProvider';

/**
 * Listen to updates to calendar keys and settings (via calendar event loop)
 */
const useCalendarsInfoCalendarListener = (calendarIDs: string[]) => {
    const { subscribe: calendarSubscribe } = useCalendarModelEventManager();
    const dispatch = baseUseDispatch();

    useEffect(() => {
        // subscribe via the calendar event loop to updates of CalendarKeysModel and CalendarSettingsModel
        return calendarSubscribe(calendarIDs, (data) => {
            if (data) {
                dispatch(calendarServerEvent(data));
            }
        });
    }, [dispatch, calendarIDs]);
};

export const useCalendarsInfoListener = (calendarIDs: string[]) => {
    useCalendarsInfoCalendarListener(calendarIDs);
};

export default useCalendarsInfoListener;
