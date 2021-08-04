import { memo } from 'react';

import { NotificationModel } from '@proton/shared/lib/interfaces/calendar';
import getNotificationString from '../../helpers/getNotificationString';

interface Props {
    notification: NotificationModel;
    formatTime: (date: Date) => string;
}
const PopoverNotification = memo(({ notification, formatTime }: Props) => {
    const str = getNotificationString(notification, formatTime);
    return <div>{str}</div>;
});

export default PopoverNotification;
