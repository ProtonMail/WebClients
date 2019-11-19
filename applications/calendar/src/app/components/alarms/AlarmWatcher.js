import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useApi } from 'react-components';

import { fromUnixTime, differenceInMilliseconds } from 'date-fns';
import { getEvent } from 'proton-shared/lib/api/calendars';
import { create } from 'proton-shared/lib/helpers/desktopNotification';

import useGetCalendarEventRaw from '../../containers/calendar/useGetCalendarEventRaw';
import { getAlarmMessage } from '../../helpers/alarms';

const AlarmWatcher = ({ alarms = [], updateAlarms, tzid }) => {
    const api = useApi();
    const cacheRef = useRef();
    const getEventRaw = useGetCalendarEventRaw();

    const alarmsLength = alarms.length;
    const firstAlarmID = alarmsLength ? alarms[0].ID : undefined;

    const handleCreateDesktopNotification = useCallback((text) => {
        create(c('Title').t`Calendar alarm`, {
            body: text,
            icon: '/assets/img/notification-badge.gif',
            onClick() {
                window.focus();
            }
        });
    }, []);

    useEffect(() => {
        if (!cacheRef.current) {
            cacheRef.current = { tzid };
        }
        const setNextAlarm = async () => {
            if (!alarmsLength) {
                return;
            }
            const [{ ID, EventID, CalendarID, Occurrence }] = alarms;
            const { Event: nextEvent } = await api(getEvent(CalendarID, EventID));
            const nextEventRaw = await getEventRaw(nextEvent);
            if (ID === cacheRef.current.nextAlarmID) {
                return;
            }
            cacheRef.current.nextAlarmID = ID;
            if (cacheRef.current.timeoutID) {
                clearTimeout(cacheRef.current.timeoutID);
            }
            const nextAlarmTime = fromUnixTime(Occurrence);
            const now = Date.now();
            const delay = differenceInMilliseconds(nextAlarmTime, now);
            cacheRef.current.timeoutID = setTimeout(() => {
                const text = getAlarmMessage(nextEventRaw, now, tzid);
                handleCreateDesktopNotification(text);
                updateAlarms((alarms) => alarms.slice(1));
            }, delay);
        };

        setNextAlarm();

        return () => {
            if (!cacheRef.current.timeoutID) {
                return;
            }
            clearTimeout(cacheRef.current.timeoutID);
        };
    }, [firstAlarmID, tzid]);

    return null;
};

AlarmWatcher.propTypes = {
    alarms: PropTypes.array,
    updateAlarms: PropTypes.func,
    tzid: PropTypes.string.isRequired
};

export default AlarmWatcher;
