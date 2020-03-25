import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { getNotificationString } from '../../helpers/notifications';

const PopoverNotification = ({ notification, formatTime }) => {
    const str = useMemo(() => {
        return getNotificationString(notification, formatTime);
    }, [notification, formatTime]);

    return <div>{str}</div>;
};

PopoverNotification.propTypes = {
    notification: PropTypes.object,
    formatTime: PropTypes.func
};

export default PopoverNotification;
