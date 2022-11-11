import { memo } from 'react';

import { c } from 'ttag';

import { isEmailNotification } from '@proton/shared/lib/calendar/alarms';
import getNotificationString from '@proton/shared/lib/calendar/alarms/getNotificationString';
import { NotificationModel } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    notification: NotificationModel;
    formatTime: (date: Date) => string;
}
const PopoverNotification = memo(function PopoverNotificationComponent({ notification, formatTime }: Props) {
    const str = getNotificationString(notification, formatTime);
    // translator: the leading string for this can be something like "minutes before" or "at time of event". The UI for an email notification looks like [15] [minutes before by email]
    const notificationSuffix = c('Notification suffix').t`by email`;

    return (
        <div>
            {str} {isEmailNotification(notification) ? notificationSuffix : ''}
        </div>
    );
});

export default PopoverNotification;
