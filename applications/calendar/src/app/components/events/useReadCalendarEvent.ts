import { useEffect, useMemo, useRef, useState } from 'react';
import { isIcalAllDay } from 'proton-shared/lib/calendar/vcalConverter';
import { propertiesToModel } from '../eventModal/eventForm/propertiesToModel';
import { propertiesToNotificationModel } from '../eventModal/eventForm/propertiesToNotificationModel';
import { CalendarViewEventData } from '../../containers/calendar/interface';
import { DecryptedTupleResult } from '../../containers/calendar/eventStore/interface';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { EventPersonalMap } from '../../interfaces/EventPersonalMap';
import { EventModelReadView } from '../../interfaces/EventModel';

const DEFAULT_VEVENT: VcalVeventComponent = {
    component: 'vevent',
    uid: { value: '123' },
    dtstart: {
        value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true }
    },
    dtend: {
        value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true }
    },
    dtstamp: {
        value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true }
    }
};

export const useReadEvent = (value: DecryptedTupleResult | undefined, tzid: string): EventModelReadView => {
    return useMemo(() => {
        const [veventComponent = DEFAULT_VEVENT, alarmMap = {}]: [VcalVeventComponent, EventPersonalMap] = value || [
            DEFAULT_VEVENT,
            {}
        ];
        const isAllDay = isIcalAllDay(veventComponent);
        const model = propertiesToModel(veventComponent, isAllDay, tzid);
        const notifications = Object.keys(alarmMap)
            .map((key) => {
                return propertiesToNotificationModel(alarmMap[key], isAllDay);
            })
            .flat(1);

        return {
            ...model,
            isAllDay,
            notifications
        };
    }, [value, tzid]);
};

export type ReadCalendarEventResult = [DecryptedTupleResult | undefined, boolean, Error | undefined];
export const useReadCalendarEvent = (calendarViewEventData?: CalendarViewEventData) => {
    const { readEvent, counter, Calendar, Event } = calendarViewEventData || {};

    const eventCounterRef = useRef(0);
    const unmountedRef = useRef(false);

    const [state, setState] = useState<ReadCalendarEventResult>(() => {
        if (!readEvent || !Calendar || !Event) {
            // Temporary events
            return [undefined, false, undefined];
        }

        const [newValue, promise, error] = readEvent(Calendar.ID, Event.ID);
        return [newValue, !!promise, error];
    });

    useEffect(() => {
        return () => {
            unmountedRef.current = true;
        };
    }, []);

    useEffect(() => {
        if (!readEvent || !Calendar || !Event || typeof counter === 'undefined') {
            // Temporary events
            setState([undefined, false, undefined]);
            return;
        }

        const [newValue, promise, error] = readEvent(Calendar.ID, Event.ID);

        if (error) {
            setState([undefined, false, error]);
            return;
        }

        if (!promise) {
            setState([newValue, false, undefined]);
            return;
        }

        eventCounterRef.current = counter;
        const currentCounter = eventCounterRef.current;
        setState([state[0], true, undefined]);

        promise.then(([result, , error]) => {
            if (currentCounter === eventCounterRef.current && !unmountedRef.current) {
                setState([result, false, error]);
            }
        });
    }, [Event && Event.ID, counter]);

    return state;
};
