import React from 'react';
import AlarmWatcher from './AlarmWatcher';
import useCalendarsAlarms from './useCalendarsAlarms';

const AlarmContainer = ({ calendars, tzid, getCachedEvent }) => {
    const alarms = useCalendarsAlarms(calendars);
    return <AlarmWatcher alarms={alarms} tzid={tzid} getCachedEvent={getCachedEvent} />;
};

export default AlarmContainer;
