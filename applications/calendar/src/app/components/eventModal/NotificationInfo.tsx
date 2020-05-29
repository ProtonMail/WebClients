import React from 'react';
import { format } from 'proton-shared/lib/date-fns-utc';
import { dateLocale } from 'proton-shared/lib/i18n';
import { c } from 'ttag';

import getNotificationString from '../../helpers/getNotificationString';
import { EventModel, EventModelErrors } from '../../interfaces/EventModel';

const getOneLineNotificationsDescription = ({
    isAllDay,
    fullDayNotifications,
    partDayNotifications,
}: Pick<EventModel, 'isAllDay' | 'fullDayNotifications' | 'partDayNotifications'>) => {
    const fmt = (utcDate: Date) => format(utcDate, 'p', { locale: dateLocale });

    const notifications = isAllDay ? fullDayNotifications : partDayNotifications;
    const notificationAsText = notifications[0] && getNotificationString(notifications[0], fmt);
    if (!notificationAsText) {
        return null;
    }
    if (notifications.length > 1) {
        return c('Notifications').t`First notification (of ${notifications.length}) is set ${notificationAsText}`;
    }
    return c('Notifications').t`First notification is set ${notificationAsText}`;
};

export const NotificationInfo = ({ model, errors }: { model: EventModel; errors: EventModelErrors }) => {
    return (
        <div className="mr0-5 capitalize-block">
            {getOneLineNotificationsDescription(model)}
            {errors?.notifications?.text && (
                <>
                    ,{' '}
                    <span className="color-global-warning">{c('Notifications')
                        .t`but some of the notifications have errors`}</span>
                </>
            )}
        </div>
    );
};
