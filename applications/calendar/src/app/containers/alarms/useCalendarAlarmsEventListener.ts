import { MutableRefObject, useEffect } from 'react';
import { CalendarAlarmsCache } from './CacheInterface';
import { useEventManager } from 'react-components';
import { CalendarAlarmEventManager, CalendarEventManager } from '../../interfaces/EventManager';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';

export const useCalendarsAlarmsEventListeners = (cacheRef: MutableRefObject<CalendarAlarmsCache>) => {
    const { subscribe } = useEventManager();

    useEffect(() => {
        return subscribe(
            ({
                CalendarAlarms = [],
                Calendars = []
            }: {
                CalendarAlarms?: CalendarAlarmEventManager[];
                Calendars?: CalendarEventManager[];
            }) => {
                if (!cacheRef.current) {
                    return;
                }

                let actions = 0;

                const { cache, end } = cacheRef.current;
                const now = new Date();

                Calendars.forEach(({ ID: CalendarID, Action }) => {
                    if (Action === EVENT_ACTIONS.DELETE) {
                        if (cache[CalendarID]) {
                            delete cache[CalendarID];
                            actions++;
                        }
                    }
                });

                const calendarAlarmChangesToTreat = CalendarAlarms.filter((CalendarAlarmChange) => {
                    // If it's delete we'll fallback to search later
                    if (CalendarAlarmChange.Action === EVENT_ACTIONS.DELETE) {
                        return true;
                    }

                    const { Occurrence, CalendarID } = CalendarAlarmChange.Alarm;

                    const hasCalendarInCache = !!cache[CalendarID];
                    const occurrenceInMs = Occurrence > 0 ? Occurrence * 1000 : -1;
                    const isAlarmInRange = Occurrence !== -1 && occurrenceInMs >= +now && occurrenceInMs <= +end;

                    return hasCalendarInCache && isAlarmInRange;
                });

                for (const CalendarAlarmChange of calendarAlarmChangesToTreat) {
                    if (CalendarAlarmChange.Action === EVENT_ACTIONS.DELETE) {
                        const { ID: AlarmID } = CalendarAlarmChange;
                        let index = -1;

                        const calendarID = Object.keys(cache).find((calendarID) => {
                            const result = cache[calendarID]?.result;
                            if (!result) {
                                return false;
                            }
                            index = result.findIndex(({ ID: otherID }) => otherID === AlarmID);
                            return index !== -1;
                        });

                        if (calendarID && index >= 0) {
                            const result = cache[calendarID]?.result;
                            if (result) {
                                result.splice(index, 1);
                                actions++;
                            }
                        }
                    }

                    if (CalendarAlarmChange.Action === EVENT_ACTIONS.CREATE) {
                        const {
                            Alarm,
                            Alarm: { CalendarID }
                        } = CalendarAlarmChange;

                        const result = cache[CalendarID]?.result;
                        if (result) {
                            result.push(Alarm);
                            actions++;
                        }
                    }

                    // This case only happens when the user changes timezone
                    if (CalendarAlarmChange.Action === EVENT_ACTIONS.UPDATE) {
                        const {
                            Alarm,
                            Alarm: { ID: AlarmID, CalendarID }
                        } = CalendarAlarmChange;

                        const result = cache[CalendarID]?.result;
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
            }
        );
    }, []);
};

export default useCalendarsAlarmsEventListeners;
