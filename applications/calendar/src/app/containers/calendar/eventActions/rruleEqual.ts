import {
    VcalDateOrDateTimeValue,
    VcalRruleProperty,
    VcalRrulePropertyValue,
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { shallowEqual } from 'proton-shared/lib/helpers/array';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { omit } from 'proton-shared/lib/helpers/object';
import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { isSameDay } from 'proton-shared/lib/date-fns-utc';

const maybeArrayComparisonKeys: (keyof VcalRrulePropertyValue)[] = [
    'byday',
    'bymonthday',
    'bymonth',
    'bysecond',
    'byminute',
    'byhour',
    'byyearday',
    'byweekno',
];

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
    return !!(oldUntil && newUntil && isSameDay(toUTCDate(oldUntil), toUTCDate(newUntil)));
};

export const getIsRruleEqual = (oldRrule: VcalRruleProperty, newRrule?: VcalRruleProperty) => {
    const oldValue = oldRrule?.value;
    const newValue = newRrule?.value;
    if (newValue && oldValue) {
        // Compare array values separately because they can be possibly unsorted...
        const oldWithoutMaybeArrays = omit(oldValue, [...maybeArrayComparisonKeys, 'until']);
        const newWithoutMaybeArrays = omit(newValue, [...maybeArrayComparisonKeys, 'until']);
        if (!isDeepEqual(newWithoutMaybeArrays, oldWithoutMaybeArrays)) {
            return false;
        }
        // Separate comparison for until to handle all-day -> to part-day
        if (!isUntilEqual(oldValue.until, newValue.until)) {
            return false;
        }
        return !maybeArrayComparisonKeys.some((key) => {
            return !isMaybeArrayEqual(oldValue[key], newValue[key]);
        });
    }
    return isDeepEqual(oldRrule, newRrule);
};
