import type { MutableRefObject } from 'react';
import { useEffect } from 'react';

import { useCalendarModelEventManager } from '@proton/components/containers/eventManager/calendar/CalendarModelEventManagerProvider';
import useEventManager from '@proton/components/hooks/useEventManager';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { CalendarEventManager } from '@proton/shared/lib/interfaces/calendar/EventManager';

import type { CalendarsAlarmsCache } from './CacheInterface';

export const useCalendarsAlarmsEventListeners = (
    cacheRef: MutableRefObject<CalendarsAlarmsCache>,
    calendarIDs: string[]
) => {
    const { subscribe: coreSubscribe } = useEventManager();
    const { subscribe: calendarSubscribe } = useCalendarModelEventManager();

    // subscribe to general event loop
    useEffect(() => {
        return coreSubscribe(({ Calendars = [] }: { Calendars?: CalendarEventManager[] }) => {
            if (!cacheRef.current) {
                return;
            }

            let actions = 0;

            const { calendarsCache } = cacheRef.current;

            Calendars.forEach(({ ID: CalendarID, Action }) => {
                if (Action === EVENT_ACTIONS.DELETE) {
                    if (calendarsCache[CalendarID]) {
                        delete calendarsCache[CalendarID];
                        actions++;
                    }
                }
            });

            if (actions) {
                cacheRef.current.rerender?.();
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-C2930F
    }, []);

    // subscribe to calendar event loop
    useEffect(() => {
        return calendarSubscribe(calendarIDs, ({ CalendarAlarms = [] }) => {
            if (!cacheRef.current) {
                return;
            }

            let actions = 0;

            const { calendarsCache, end } = cacheRef.current;
            const now = new Date();

            const calendarAlarmChangesToTreat = CalendarAlarms.filter((CalendarAlarmChange) => {
                // If it's delete we'll fallback to search later
                if (CalendarAlarmChange.Action === EVENT_ACTIONS.DELETE) {
                    return true;
                }

                const { Occurrence, CalendarID } = CalendarAlarmChange.Alarm;

                const hasCalendarInCache = !!calendarsCache[CalendarID];
                const occurrenceInMs = Occurrence > 0 ? Occurrence * 1000 : -1;
                const isAlarmInRange = Occurrence !== -1 && occurrenceInMs >= +now && occurrenceInMs <= +end;
                return hasCalendarInCache && isAlarmInRange;
            });

            for (const CalendarAlarmChange of calendarAlarmChangesToTreat) {
                if (CalendarAlarmChange.Action === EVENT_ACTIONS.DELETE) {
                    const { ID: AlarmID } = CalendarAlarmChange;
                    let index = -1;

                    const calendarID = Object.keys(calendarsCache).find((calendarID) => {
                        const result = calendarsCache[calendarID]?.result;
                        if (!result) {
                            return false;
                        }
                        index = result.findIndex(({ ID: otherID }) => otherID === AlarmID);
                        return index !== -1;
                    });

                    if (calendarID && index >= 0) {
                        const result = calendarsCache[calendarID]?.result;
                        if (result) {
                            result.splice(index, 1);
                            actions++;
                        }
                    }
                }

                if (CalendarAlarmChange.Action === EVENT_ACTIONS.CREATE) {
                    const {
                        Alarm,
                        Alarm: { CalendarID },
                    } = CalendarAlarmChange;

                    const result = calendarsCache[CalendarID]?.result;
                    if (result) {
                        result.push(Alarm);
                        actions++;
                    }
                }

                // This case only happens when the user changes timezone
                if (CalendarAlarmChange.Action === EVENT_ACTIONS.UPDATE) {
                    const {
                        Alarm,
                        Alarm: { ID: AlarmID, CalendarID },
                    } = CalendarAlarmChange;

                    const result = calendarsCache[CalendarID]?.result;
                    if (result) {
                        const index = result.findIndex(({ ID: otherID }) => otherID === AlarmID);
                        if (index >= 0) {
                            result.splice(index, 1, Alarm);
                            actions++;
                        }
                    }
                }
            }

            if (actions) {
                cacheRef.current.rerender?.();
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-6C5055
    }, [calendarIDs]);
};

export default useCalendarsAlarmsEventListeners;
