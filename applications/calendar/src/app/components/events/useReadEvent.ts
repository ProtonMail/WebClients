import { useMemo } from 'react';
import { isIcalAllDay } from 'proton-shared/lib/calendar/vcalConverter';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { propertiesToModel } from '../eventModal/eventForm/propertiesToModel';
import { propertiesToNotificationModel } from '../eventModal/eventForm/propertiesToNotificationModel';
import { DecryptedEventTupleResult } from '../../containers/calendar/eventStore/interface';
import { EventPersonalMap } from '../../interfaces/EventPersonalMap';
import { EventModelReadView } from '../../interfaces/EventModel';

const DEFAULT_VEVENT: VcalVeventComponent = {
    component: 'vevent',
    uid: { value: '123' },
    dtstart: {
        value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
    },
    dtend: {
        value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
    },
    dtstamp: {
        value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
    },
};
const useReadEvent = (value: DecryptedEventTupleResult | undefined, tzid: string): EventModelReadView => {
    return useMemo(() => {
        const [veventComponent = DEFAULT_VEVENT, alarmMap = {}]: [VcalVeventComponent, EventPersonalMap] = value || [
            DEFAULT_VEVENT,
            {},
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
            notifications,
        };
    }, [value, tzid]);
};

export default useReadEvent;
