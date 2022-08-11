import { NotificationModel } from '../interfaces/calendar/Notification';
import { NOTIFICATION_UNITS, NOTIFICATION_WHEN } from './constants';
import { transformBeforeAt } from './trigger';

const getValarmTriggerUnit = (unit: NOTIFICATION_UNITS) => {
    return (
        {
            [NOTIFICATION_UNITS.WEEK]: 'weeks',
            [NOTIFICATION_UNITS.DAY]: 'days',
            [NOTIFICATION_UNITS.HOUR]: 'hours',
            [NOTIFICATION_UNITS.MINUTE]: 'minutes',
        }[unit] || 'days'
    );
};

const getAllDayValarmTrigger = ({
    isNegative,
    unit,
    value = 0,
    at,
}: {
    isNegative: boolean;
    unit: NOTIFICATION_UNITS;
    value?: number;
    at: Date;
}) => {
    const modifiedAt = isNegative ? transformBeforeAt(at) : at;

    const hours = modifiedAt.getHours();
    const minutes = modifiedAt.getMinutes();

    const modifyNegativeDay = isNegative && (minutes > 0 || hours > 0);

    const [weeks, days] = (() => {
        const weeksValue = unit === NOTIFICATION_UNITS.WEEK ? value : 0;
        const daysValue = unit === NOTIFICATION_UNITS.DAY ? value : 0;

        if (modifyNegativeDay && weeksValue === 0) {
            return [0, daysValue - 1];
        }
        if (modifyNegativeDay && weeksValue >= 1) {
            return [weeksValue - 1, 6];
        }
        return [weeksValue, daysValue];
    })();

    return {
        weeks: Math.max(0, weeks),
        days: Math.max(0, days),
        hours,
        minutes,
        seconds: 0,
        isNegative,
    };
};

const getPartDayValarmTrigger = ({
    isNegative,
    unit,
    value = 0,
}: {
    isNegative: boolean;
    unit: NOTIFICATION_UNITS;
    value?: number;
}) => {
    return {
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        [getValarmTriggerUnit(unit)]: value,
        isNegative,
    };
};

export const getValarmTrigger = ({ isAllDay, unit, when, value, at }: NotificationModel) => {
    const isNegative = when === NOTIFICATION_WHEN.BEFORE;
    if (isAllDay) {
        if (!at) {
            throw new Error('Missing at');
        }
        return getAllDayValarmTrigger({ isNegative, unit, value, at });
    }
    return getPartDayValarmTrigger({ isNegative, unit, value });
};
