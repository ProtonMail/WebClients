import { transformBeforeAt } from './trigger';
import { NOTIFICATION_UNITS, NOTIFICATION_WHEN, SETTINGS_NOTIFICATION_TYPE } from './constants';
import { NotificationModel, VcalDurationValue } from '../interfaces/calendar';

const getInt = (value: any) => parseInt(value, 10) || 0;

interface TriggerToModelShared {
    when: NOTIFICATION_WHEN;
    type: SETTINGS_NOTIFICATION_TYPE;
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
}

const allDayTriggerToModel = ({ type, when, weeks, days, hours, minutes }: TriggerToModelShared) => {
    const isNegative = when === NOTIFICATION_WHEN.BEFORE;

    const at = new Date(2000, 0, 1, hours, minutes);
    const modifiedAt = isNegative ? transformBeforeAt(at) : at;
    const modifyNegativeDay = isNegative && (modifiedAt.getHours() > 0 || modifiedAt.getMinutes() > 0);

    const [value, unit] = (() => {
        // Transform for example -P1W6DT10H10M into 2 weeks at...
        if (weeks >= 0 && days === 6 && modifyNegativeDay) {
            return [weeks + 1, NOTIFICATION_UNITS.WEEK];
        }
        // Otherwise, if there is something in the week, and even if there are days in the trigger, the client will truncate this into a week notification since the selector is not more advanced than that.
        if (weeks > 0) {
            return [weeks, NOTIFICATION_UNITS.WEEK];
        }
        // Finally just return it as a day notification.
        return [days + +modifyNegativeDay, NOTIFICATION_UNITS.DAY];
    })();

    return {
        unit,
        type,
        when,
        value,
        at: modifiedAt,
        isAllDay: true,
    };
};

const partDayTriggerToModel = ({ type, when, weeks, days, hours, minutes }: TriggerToModelShared) => {
    const [value, unit] = (() => {
        if (weeks) {
            return [weeks, NOTIFICATION_UNITS.WEEK];
        }
        if (days) {
            return [days, NOTIFICATION_UNITS.DAY];
        }
        if (hours) {
            return [hours, NOTIFICATION_UNITS.HOURS];
        }
        return [minutes, NOTIFICATION_UNITS.MINUTES];
    })();

    return {
        unit,
        type,
        when,
        value,
        isAllDay: false,
    };
};

interface TriggerToModel {
    isAllDay: boolean;
    type: SETTINGS_NOTIFICATION_TYPE;
    trigger: Partial<VcalDurationValue>;
}

export const triggerToModel = ({
    isAllDay,
    type,
    // eslint-disable-next-line no-unused-vars
    trigger: { weeks = 0, days = 0, hours = 0, minutes = 0, isNegative = false },
}: TriggerToModel): Omit<NotificationModel, 'id'> => {
    const parsedTrigger = {
        weeks: getInt(weeks),
        days: getInt(days),
        hours: getInt(hours),
        minutes: getInt(minutes),
    };
    const when = isNegative ? NOTIFICATION_WHEN.BEFORE : NOTIFICATION_WHEN.AFTER;
    if (isAllDay) {
        return allDayTriggerToModel({ type, when, ...parsedTrigger });
    }
    return partDayTriggerToModel({ type, when, ...parsedTrigger });
};

export const getDeviceNotifications = (notifications: NotificationModel[]) => {
    return notifications.filter(({ type }) => type === SETTINGS_NOTIFICATION_TYPE.DEVICE);
};
