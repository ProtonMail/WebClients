import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import {
    notificationAtToString,
    notificationUnitToString,
    notificationWhenToString
} from '../../helpers/notifications';
import { NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../../constants';

const PopoverNotification = ({ notification, formatTime }) => {
    const str = useMemo(() => {
        const { value, unit, when, at, isAllDay } = notification;
        const isAllDayBefore = isAllDay && when === NOTIFICATION_WHEN.BEFORE;

        const modifiedValue = isAllDayBefore && unit === NOTIFICATION_UNITS.DAY ? value + 1 : value;

        const modifiedAt = isAllDayBefore
            ? new Date(Date.UTC(2000, 0, 1, 24 - at.getHours(), at.getMinutes()))
            : new Date(Date.UTC(2000, 0, 1, at.getHours(), at.getMinutes()));

        return [
            notificationUnitToString(modifiedValue, unit),
            notificationWhenToString(when),
            isAllDay && notificationAtToString(formatTime(modifiedAt))
        ]
            .filter(Boolean)
            .join(' ');
    }, [notification, formatTime]);

    return <div>{str}</div>;
};

PopoverNotification.propTypes = {
    notification: PropTypes.object,
    formatTime: PropTypes.func
};

export default PopoverNotification;
