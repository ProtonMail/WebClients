import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useApi } from 'react-components';

import { fromUnixTime, differenceInMilliseconds } from 'date-fns';
import { getEvent } from 'proton-shared/lib/api/calendars';
import { create } from 'proton-shared/lib/helpers/desktopNotification';
import calendarSvg from 'design-system/assets/img/pm-images/calendar.svg';

import useGetCalendarEventRaw from '../../containers/calendar/useGetCalendarEventRaw';
import { getAlarmMessage } from '../../helpers/alarms';

const handleCreateDesktopNotification = (text) => {
    create(c('Title').t`Calendar alarm`, {
        body: text,
        icon: calendarSvg,
        onClick() {
            window.focus();
        }
    });
};

const AlarmWatcher = ({ alarms = [], tzid }) => {
    const api = useApi();
    const cacheRef = useRef();
    const [isPastAlarm, setIsPastAlarm] = useState(Object.create(null));
    const getEventRaw = useGetCalendarEventRaw();

    const firstAlarm = useMemo(() => {
        if (!alarms.length) {
            return undefined;
        }
        for (const alarm of alarms) {
            if (!isPastAlarm[alarm.ID]) {
                return alarm;
            }
        }
        return undefined;
    }, [alarms, isPastAlarm]);

    useEffect(() => {
        if (!cacheRef.current) {
            cacheRef.current = { tzid };
        }
        const setNextAlarm = async () => {
            if (!firstAlarm) {
                return;
            }
            const { ID, EventID, CalendarID, Occurrence } = firstAlarm;
            const { Event: nextEvent } = await api(getEvent(CalendarID, EventID));
            const nextEventRaw = await getEventRaw(nextEvent);
            if (cacheRef.current.timeoutID) {
                clearTimeout(cacheRef.current.timeoutID);
            }
            const nextAlarmTime = fromUnixTime(Occurrence);
            const now = Date.now();
            const delay = Math.max(differenceInMilliseconds(nextAlarmTime, now), 0);
            cacheRef.current.timeoutID = setTimeout(() => {
                const text = getAlarmMessage(nextEventRaw, now, tzid);
                handleCreateDesktopNotification(text);
                setIsPastAlarm((isPastAlarm) => ({ ...isPastAlarm, [ID]: true }));
            }, delay);
        };

        setNextAlarm();

        return () => {
            if (!cacheRef.current.timeoutID) {
                return;
            }
            clearTimeout(cacheRef.current.timeoutID);
        };
    }, [firstAlarm, tzid]);

    return null;
};

AlarmWatcher.propTypes = {
    alarms: PropTypes.array,
    updateAlarms: PropTypes.func,
    tzid: PropTypes.string.isRequired
};

export default AlarmWatcher;
