import { VcalRruleProperty, VcalRrulePropertyValue } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { shallowEqual } from 'proton-shared/lib/helpers/array';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { omit } from 'proton-shared/lib/helpers/object';

const maybeArrayComparisonKeys: (keyof VcalRrulePropertyValue)[] = [
    'byday',
    'bymonthday',
    'bymonth',
    'bysecond',
    'byminute',
    'byhour',
    'byyearday',
    'byweekno'
];

const isMaybeArrayEqual = (oldValue: any | any[], newValue: any | any[]) => {
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        return shallowEqual(oldValue.slice().sort(), newValue.slice().sort());
    }
    return oldValue === newValue;
};

export const getIsRruleEqual = (oldRrule: VcalRruleProperty, newRrule?: VcalRruleProperty) => {
    const oldValue = oldRrule?.value;
    const newValue = newRrule?.value;
    if (newValue && oldValue) {
        // Compare array values separately because they can be possibly unsorted...
        const oldWithoutMaybeArrays = omit(oldValue, maybeArrayComparisonKeys);
        const newWithoutMaybeArrays = omit(newValue, maybeArrayComparisonKeys);
        if (!isDeepEqual(newWithoutMaybeArrays, oldWithoutMaybeArrays)) {
            return false;
        }
        return !maybeArrayComparisonKeys.some((key) => {
            return !isMaybeArrayEqual(oldValue[key], newValue[key]);
        });
    }
    return isDeepEqual(oldRrule, newRrule);
};
