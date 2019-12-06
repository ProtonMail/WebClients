import React from 'react';
import AlarmWatcher from './AlarmWatcher';
import useCalendarsAlarms from './useCalendarsAlarms';

const AlarmContainer = ({ calendars, tzid }) => {
    const alarms = useCalendarsAlarms(calendars);
    return <AlarmWatcher alarms={alarms} tzid={tzid} />;
};

export default AlarmContainer;
