import { c, msgid } from 'ttag';
import { fromTriggerString, toTriggerString } from 'proton-shared/lib/calendar/vcal';
import { triggerToModel } from '../components/eventModal/eventForm/propertiesToModel';
import { getValarmTrigger } from '../components/eventModal/eventForm/modelToProperties';
import { NOTIFICATION_TYPE, NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../constants';

export const notificationUnitToString = (n, unit) => {
    return {
        [NOTIFICATION_UNITS.WEEK]: c('Notifications').ngettext(msgid`${n} week`, `${n} weeks`, n),
        [NOTIFICATION_UNITS.DAY]: c('Notifications').ngettext(msgid`${n} day`, `${n} days`, n),
        [NOTIFICATION_UNITS.MINUTES]: c('Notifications').ngettext(msgid`${n} minute`, `${n} minutes`, n),
        [NOTIFICATION_UNITS.HOURS]: c('Notifications').ngettext(msgid`${n} hour`, `${n} hours`, n)
    }[unit];
};

export const notificationWhenToString = (when) => {
    return when === NOTIFICATION_WHEN.BEFORE ? c('Notifications').t`before` : c('Notifications').t`after`;
};

export const notificationAtToString = (time) => {
    return c('Notifications').t`at ${time}`;
};

export const notificationsToModel = (notifications = [], isAllDay) => {
    return notifications.map(({ Type, Trigger }) =>
        triggerToModel({
            isAllDay,
            type: Type,
            trigger: fromTriggerString(Trigger)
        })
    );
};

export const modelToNotifications = (notifications = []) => {
    return notifications.map(({ type, ...rest }) => ({
        Type: type,
        Trigger: toTriggerString(getValarmTrigger(rest))
    }));
};

export const DEFAULT_PART_DAY_NOTIFICATION = triggerToModel({
    isAllDay: false,
    type: NOTIFICATION_TYPE.DEVICE,
    trigger: fromTriggerString('-PT15M')
});

export const DEFAULT_FULL_DAY_NOTIFICATION = triggerToModel({
    isAllDay: true,
    type: NOTIFICATION_TYPE.DEVICE,
    trigger: fromTriggerString('-PT15H')
});

export const DEFAULT_PART_DAY_NOTIFICATIONS = [
    {
        Type: NOTIFICATION_TYPE.DEVICE,
        Trigger: '-PT15M'
    }
];

export const DEFAULT_FULL_DAY_NOTIFICATIONS = [
    {
        Type: NOTIFICATION_TYPE.DEVICE,
        Trigger: '-PT15H'
    }
];
