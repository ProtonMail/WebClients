import { FREQUENCY } from './constants';
import {
    VcalDateOrDateTimeValue,
    VcalDays,
    VcalDaysKeys,
    VcalRruleProperty,
    VcalRrulePropertyValue,
} from '../interfaces/calendar/VcalModel';
import { shallowEqual } from '../helpers/array';
import isDeepEqual from '../helpers/isDeepEqual';
import { omit } from '../helpers/object';
import { toUTCDate } from '../date/timezone';
import { isSameDay } from '../date-fns-utc';
import { getRruleValue } from './rrule';
import { withRruleWkst } from './rruleWkst';
import { dayToNumericDay } from './vcalConverter';

const maybeArrayComparisonKeys = [
    'byday',
    'bymonthday',
    'bymonth',
    'bysecond',
    'byminute',
    'byhour',
    'byyearday',
    'byweekno',
] as const;

const isSingleValue = <T>(arg: T | T[] | undefined) => {
    if (arg === undefined) {
        return false;
    }
    return !Array.isArray(arg) || arg.length === 1;
};

/**
 * Remove redundant properties for a given RRULE
 */
const getNormalizedRrule = (rrule: VcalRrulePropertyValue, wkstCalendar = VcalDays.MO) => {
    const { freq, count, interval, byday, bymonth, bymonthday, wkst: wkstRrule } = rrule;
    const wkst = wkstRrule ? dayToNumericDay(wkstRrule) : wkstCalendar;
    const redundantProperties: (keyof VcalRrulePropertyValue)[] = [];
    if (count && count === 1) {
        redundantProperties.push('count');
    }
    if (interval && interval === 1) {
        redundantProperties.push('interval');
    }
    if (freq === FREQUENCY.WEEKLY) {
        if (isSingleValue(byday)) {
            redundantProperties.push('byday');
        }
    }
    if (freq === FREQUENCY.MONTHLY) {
        if (isSingleValue(bymonthday)) {
            redundantProperties.push('bymonthday');
        }
    }
    if (freq === FREQUENCY.YEARLY) {
        if (isSingleValue(byday) && isSingleValue(bymonth)) {
            redundantProperties.push('byday', 'bymonth');
        }
    }
    return withRruleWkst({ freq, ...omit(rrule, redundantProperties) }, wkst);
};

const isMaybeArrayEqual = (oldValue: any | any[], newValue: any | any[]) => {
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        return shallowEqual(oldValue.slice().sort(), newValue.slice().sort());
    }
    return oldValue === newValue;
};

const isUntilEqual = (oldUntil?: VcalDateOrDateTimeValue, newUntil?: VcalDateOrDateTimeValue) => {
    if (!oldUntil && !newUntil) {
        return true;
    }
    // If changing an all-day event into a part-day event the until adds the time part, so ignore that here.
    return oldUntil && newUntil && isSameDay(toUTCDate(oldUntil), toUTCDate(newUntil));
};

/**
 * Determine if two recurring rules are equal up to re-writing.
 */
export const getIsRruleEqual = (oldRrule?: VcalRruleProperty, newRrule?: VcalRruleProperty, ignoreWkst = false) => {
    const oldValue = getRruleValue(oldRrule);
    const newValue = getRruleValue(newRrule);
    if (ignoreWkst && oldValue && newValue) {
        // To ignore WKST, we just set it to 'MO' in both RRULEs
        oldValue.wkst = VcalDays[VcalDays.MO] as VcalDaysKeys;
        newValue.wkst = VcalDays[VcalDays.MO] as VcalDaysKeys;
    }
    if (newValue && oldValue) {
        // we "normalize" the rrules first (i.e. remove maybeArrayComparisonKeys in case they are redundant)
        const normalizedOldValue = getNormalizedRrule(oldValue);
        const normalizedNewValue = getNormalizedRrule(newValue);
        // Compare array values separately because they can be possibly unsorted...
        const oldWithoutMaybeArrays = omit(normalizedOldValue, [...maybeArrayComparisonKeys, 'until']);
        const newWithoutMaybeArrays = omit(normalizedNewValue, [...maybeArrayComparisonKeys, 'until']);
        if (!isDeepEqual(newWithoutMaybeArrays, oldWithoutMaybeArrays)) {
            return false;
        }
        // Separate comparison for until to handle all-day -> to part-day
        if (!isUntilEqual(oldValue.until, newValue.until)) {
            return false;
        }
        return !maybeArrayComparisonKeys.some((key) => {
            return !isMaybeArrayEqual(normalizedOldValue[key], normalizedNewValue[key]);
        });
    }
    return isDeepEqual(oldRrule, newRrule);
};
