import React from 'react';

import getNotificationString from '../../helpers/getNotificationString';
import { NotificationModel } from '../../interfaces/NotificationModel';

interface Props {
    notification: NotificationModel;
    formatTime: (date: Date) => string;
}
const PopoverNotification = React.memo(({ notification, formatTime }: Props) => {
    const str = getNotificationString(notification, formatTime);
    return <div>{str}</div>;
});

export default PopoverNotification;
