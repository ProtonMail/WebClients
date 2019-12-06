import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useApi } from 'react-components';

import { fromUnixTime, differenceInMilliseconds } from 'date-fns';
import { getEvent } from 'proton-shared/lib/api/calendars';
import { create, isEnabled, request } from 'proton-shared/lib/helpers/desktopNotification';
import calendarSvg from 'design-system/assets/img/pm-images/calendar.svg';

import useGetCalendarEventRaw from '../../containers/calendar/useGetCalendarEventRaw';
import { getAlarmMessage } from '../../helpers/alarms';
import { HOUR } from '../../constants';

const MIN_CUTOFF = -HOUR * 1000;

const displayNotification = (text) => {
    create(c('Title').t`Calendar alarm`, {
        body: text,
        icon: calendarSvg,
        timeout: 10000,
        onClick() {
            window.focus();
        }
    });
};

const getFirstUnseenAlarm = (alarms = [], set = new Set()) => {
    return alarms.find(({ ID }) => {
        return !set.has(ID);
    });
};

const AlarmWatcher = ({ alarms = [], tzid }) => {
    const api = useApi();
    const getEventRaw = useGetCalendarEventRaw();
    const cacheRef = useRef();

    // temporary code for standalone app
    useEffect(() => {
        if (!isEnabled()) {
            request();
        }
    }, []);

    useEffect(() => {
        let timeoutHandle;
        let unmounted;

        const run = () => {
            if (!cacheRef.current) {
                cacheRef.current = { seen: new Set(), next: undefined };
            }
            const { seen, next } = cacheRef.current;

            const { ID, Occurrence, CalendarID, EventID } = getFirstUnseenAlarm(alarms, seen) || { ID: 'non-existing' };

            if (
                next &&
                next.id === ID &&
                next.occurrence === Occurrence &&
                next.calendarID === CalendarID &&
                next.eventID === EventID
            ) {
                return;
            }
            cacheRef.current.next = {
                id: ID,
                occurrence: Occurrence,
                eventID: EventID,
                calendarID: CalendarID
            };

            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }

            if (ID === 'non-existing') {
                return;
            }

            const nextAlarmTime = fromUnixTime(Occurrence);
            const now = Date.now();
            const diff = differenceInMilliseconds(nextAlarmTime, now);
            const delay = Math.max(diff, 0);

            timeoutHandle = setTimeout(() => {
                if (unmounted) {
                    return;
                }

                // Eagerly add the event to seen, ignore if it would fail
                cacheRef.current.seen.add(ID);
                cacheRef.current.next = undefined;

                // Ignore the event if it's in the past after the cutoff
                if (diff < MIN_CUTOFF) {
                    setTimeout(run, 0);
                    return;
                }

                api(getEvent(CalendarID, EventID))
                    .then(({ Event }) => getEventRaw(Event))
                    .then((eventRaw) => {
                        if (unmounted) {
                            return;
                        }
                        const text = getAlarmMessage(eventRaw, new Date(), tzid);
                        displayNotification(text);
                    });

                setTimeout(run, 0);
            }, delay);
        };

        run();

        return () => {
            unmounted = true;
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
        };
    }, [alarms, tzid, getEventRaw]);

    return null;
};

AlarmWatcher.propTypes = {
    alarms: PropTypes.array,
    tzid: PropTypes.string.isRequired
};

export default AlarmWatcher;
