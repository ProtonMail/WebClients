import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';

import { differenceInMilliseconds, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import useApi from '@proton/components/hooks/useApi';
import useGetCalendarEventRaw from '@proton/components/hooks/useGetCalendarEventRaw';
import useHasSuspendedCounter from '@proton/components/hooks/useHasSuspendedCounter';
import { getEvent as getEventRoute } from '@proton/shared/lib/api/calendars';
import { getAlarmMessage, getNextEventTime } from '@proton/shared/lib/calendar/alarms';
import { MINUTE } from '@proton/shared/lib/constants';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { create, createElectronNotification } from '@proton/shared/lib/helpers/desktopNotification';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { CalendarAlarm, CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import notificationIcon from '../../../assets/notification.png';
import type { CalendarsEventsCache } from '../calendar/eventStore/interface';

const MIN_CUTOFF = -MINUTE;

export const displayNotification = ({ title = c('Title').t`Calendar alarm`, text = '', ...rest }) => {
    if (isElectronMail) {
        // Calendar view and sidebar-calendar notifications conflict
        // Don't send notifications when embedded on Desktop
        if (getIsIframe()) {
            return;
        }
        return createElectronNotification({ title, body: text, app: 'calendar' });
    }
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
    const hasSuspendedCounter = useHasSuspendedCounter({ refreshInterval: MINUTE, tolerance: MINUTE / 2 });
    const { contactEmailsMap } = useContactEmailsCache();
    const getCalendarEventRaw = useGetCalendarEventRaw(contactEmailsMap);
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
                        void displayNotification({ text, tag: ID });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A50792
    }, [alarms, tzid, getCalendarEventRaw, hasSuspendedCounter]);

    return null;
};

export default AlarmWatcher;
