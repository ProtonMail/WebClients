import { useEffect, useMemo, useRef, useState } from 'react';
import { isIcalAllDay } from 'proton-shared/lib/calendar/vcalConverter';
import { propertiesToModel, propertiesToNotificationModel } from '../eventModal/eventForm/propertiesToModel';

export const useReadEvent = (value, tzid) => {
    return useMemo(() => {
        const [veventComponent = {}, alarmMap = {}] = value || [];
        const isAllDay = isIcalAllDay(veventComponent);
        const model = propertiesToModel(veventComponent, isAllDay, tzid);
        const notifications = Object.keys(alarmMap)
            .map((key) => {
                return propertiesToNotificationModel(alarmMap[key], isAllDay);
            })
            .flat();

        return {
            ...model,
            isAllDay,
            notifications
        };
    }, [value, tzid]);
};

export const useReadCalendarEvent = ({ readEvent, counter, Calendar, Event } = {}) => {
    const eventCounterRef = useRef();
    const unmountedRef = useRef();

    const [state, setState] = useState(() => {
        if (!readEvent) {
            // Temporary events
            return [undefined, false];
        }

        const [newValue, promise, error] = readEvent(Calendar.ID, Event.ID);
        return [newValue, !!promise, error];
    });

    useEffect(() => {
        return () => (unmountedRef.current = true);
    }, []);

    useEffect(() => {
        if (!readEvent) {
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
