import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useApi, useNotifications } from 'react-components';

import { fromUnixTime, differenceInMilliseconds } from 'date-fns';
import { getEvent } from 'proton-shared/lib/api/calendars';

import useGetCalendarEventRaw from '../../containers/calendar/useGetCalendarEventRaw';
import { getAlarmMessage } from '../../helpers/alarms';

const AlarmWatcher = ({ alarms = [], updateAlarms, tzid }) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const cacheRef = useRef();
    const getEventRaw = useGetCalendarEventRaw();

    const alarmsLength = alarms.length;
    const firstAlarmID = alarmsLength ? alarms[0].ID : undefined;

    useEffect(() => {
        if (!cacheRef.current) {
            cacheRef.current = { tzid };
        }
        const setNextAlarm = async () => {
            if (!alarmsLength) {
                return;
            }
            const [{ ID, EventID, CalendarID, NextOccurrence }] = alarms;
            const { Event: nextEvent } = await api(getEvent(CalendarID, EventID));
            const nextEventRaw = await getEventRaw(nextEvent);
            if (ID === cacheRef.current.nextAlarmID && tzid === cacheRef.current.tzid) {
                return;
            }
            if (cacheRef.current.timeout) {
                clearTimeout(cacheRef.current.timeout);
            }
            const nextAlarmTime = fromUnixTime(NextOccurrence);
            const now = Date.now();
            const delay = differenceInMilliseconds(nextAlarmTime, now);
            const message = await getAlarmMessage(nextEventRaw, now, tzid);
            // eslint-disable-next-line require-atomic-updates
            cacheRef.current.timeout = setTimeout(() => {
                createNotification({ text: message });
                updateAlarms((alarms) => alarms.slice(1));
            }, delay);
        };

        setNextAlarm();

        return () => {
            if (!cacheRef.current.timeout) {
                return;
            }
            clearTimeout(cacheRef.current.timeout);
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
