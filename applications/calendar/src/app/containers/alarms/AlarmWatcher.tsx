import { MutableRefObject, useEffect, useRef } from 'react';
import { c } from 'ttag';
import { useApi, useGetCalendarEventRaw } from '@proton/components';
import { fromUnixTime, differenceInMilliseconds } from 'date-fns';
import { getEvent as getEventRoute } from '@proton/shared/lib/api/calendars';
import { create } from '@proton/shared/lib/helpers/desktopNotification';
import { dateLocale } from '@proton/shared/lib/i18n';
import { CalendarAlarm, CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { noop } from '@proton/shared/lib/helpers/function';

import { getAlarmMessage, getNextEventTime } from '@proton/shared/lib/calendar/alarms';
import { MINUTE } from '@proton/shared/lib/constants';
import notificationIcon from '../../../assets/notification.gif';

import { CalendarsEventsCache } from '../calendar/eventStore/interface';

const MIN_CUTOFF = -MINUTE;

export const displayNotification = ({ title = c('Title').t`Calendar alarm`, text = '', ...rest }) => {
    return create(title, {
        body: text,
        icon: notificationIcon,
        onClick() {
            window.focus();
        },
        ...rest,
    });
};

const getFirstUnseenAlarm = (alarms: CalendarAlarm[] = [], set: Set<string>) => {
    return alarms.find(({ ID }) => {
        return !set.has(ID);
    });
};

interface Props {
    alarms: CalendarAlarm[];
    tzid: string;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
}
const AlarmWatcher = ({ alarms = [], tzid, calendarsEventsCacheRef }: Props) => {
    const api = useApi();
    const getCalendarEventRaw = useGetCalendarEventRaw();
    const cacheRef = useRef<Set<string>>();

    useEffect(() => {
        let timeoutHandle = 0;
        let unmounted = false;

        const run = () => {
            if (unmounted) {
                return;
            }
            if (!cacheRef.current) {
                cacheRef.current = new Set();
            }

            const firstUnseenAlarm = getFirstUnseenAlarm(alarms, cacheRef.current);
            if (!firstUnseenAlarm) {
                return;
            }

            const { ID, Occurrence, Trigger, CalendarID, EventID } = firstUnseenAlarm;

            const nextAlarmTime = fromUnixTime(Occurrence);
            const now = Date.now();
            const diff = differenceInMilliseconds(nextAlarmTime, now);
            const delay = Math.max(diff, 0);

            const getEvent = () => {
                const cachedEvent = calendarsEventsCacheRef.current.getCachedEvent(CalendarID, EventID);
                if (cachedEvent) {
                    return Promise.resolve(cachedEvent);
                }
                return api<{ Event: CalendarEvent }>({ ...getEventRoute(CalendarID, EventID), silence: true }).then(
                    ({ Event }) => Event
                );
            };

            timeoutHandle = window.setTimeout(() => {
                if (unmounted || !cacheRef.current) {
                    return;
                }
                // Eagerly add the event to seen, ignore if it would fail
                cacheRef.current.add(ID);

                // Ignore the event if it's in the past after the cutoff
                if (diff < MIN_CUTOFF) {
                    window.setTimeout(run, 0);
                    return;
                }

                getEvent()
                    .then((Event) => getCalendarEventRaw(Event))
                    .then((eventRaw) => {
                        if (unmounted) {
                            return;
                        }
                        const { veventComponent: component } = eventRaw;
                        // compute event start time based on trigger, as we cannot rely on dtstart for recurring events
                        const start = new Date(getNextEventTime({ Occurrence, Trigger, tzid }));
                        const now = new Date();
                        const formatOptions = { locale: dateLocale };
                        const text = getAlarmMessage({ component, start, now, tzid, formatOptions });
                        return displayNotification({ text, tag: ID });
                    })
                    .catch(noop);

                window.setTimeout(run, 0);
            }, delay);
        };

        run();

        return () => {
            unmounted = true;
            if (timeoutHandle) {
                window.clearTimeout(timeoutHandle);
            }
        };
    }, [alarms, tzid, getCalendarEventRaw]);

    return null;
};

export default AlarmWatcher;
