import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useApi } from 'react-components';
import { fromUnixTime, differenceInMilliseconds } from 'date-fns';
import { getEvent as getEventRoute } from 'proton-shared/lib/api/calendars';
import { create, isEnabled, request } from 'proton-shared/lib/helpers/desktopNotification';
import { dateLocale } from 'proton-shared/lib/i18n';

import notificationIcon from '../../../assets/notification.gif';
import useGetCalendarEventRaw from '../../containers/calendar/useGetCalendarEventRaw';
import { getAlarmMessage } from '../../helpers/alarms';
import { MINUTE } from '../../constants';

const MIN_CUTOFF = -MINUTE * 1000;

const displayNotification = ({ title = c('Title').t`Calendar alarm`, text, ...rest }) => {
    return create(title, {
        body: text,
        icon: notificationIcon,
        onClick() {
            window.focus();
        },
        ...rest
    });
};

const getFirstUnseenAlarm = (alarms = [], set = new Set()) => {
    return alarms.find(({ ID }) => {
        return !set.has(ID);
    });
};

const AlarmWatcher = ({ alarms = [], tzid, getCachedEvent }) => {
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
            if (unmounted) {
                return;
            }
            if (!cacheRef.current) {
                cacheRef.current = new Set();
            }

            const { ID, Occurrence, CalendarID, EventID } = getFirstUnseenAlarm(alarms, cacheRef.current) || {
                ID: 'non-existing'
            };

            if (ID === 'non-existing') {
                return;
            }

            const nextAlarmTime = fromUnixTime(Occurrence);
            const now = Date.now();
            const diff = differenceInMilliseconds(nextAlarmTime, now);
            const delay = Math.max(diff, 0);

            const getEvent = () => {
                const cachedEvent = getCachedEvent(CalendarID, EventID);
                if (cachedEvent) {
                    return Promise.resolve(cachedEvent);
                }
                return api({ ...getEventRoute(CalendarID, EventID), silence: true }).then(({ Event }) => Event);
            };

            timeoutHandle = setTimeout(() => {
                // Eagerly add the event to seen, ignore if it would fail
                cacheRef.current.add(ID);

                // Ignore the event if it's in the past after the cutoff
                if (diff < MIN_CUTOFF) {
                    setTimeout(run, 0);
                    return;
                }

                getEvent(CalendarID, EventID)
                    .then((Event) => getEventRaw(Event))
                    .then((eventRaw) => {
                        if (unmounted) {
                            return;
                        }
                        const text = getAlarmMessage(eventRaw, new Date(), tzid, { locale: dateLocale });
                        displayNotification({ text, tag: ID });
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
