import ICAL from 'ical.js';

import type {
    VcalCalendarComponent,
    VcalDateOrDateTimeValue,
    VcalDateTimeValue,
    VcalDateValue,
    VcalDurationValue,
    VcalRrulePropertyValue,
} from '../interfaces/calendar';
import { UNIQUE_PROPERTIES } from './vcalDefinition';

export const getInternalDateValue = (value: any): VcalDateValue => {
    return {
        year: value.year,
        month: value.month,
        day: value.day,
    };
};

export const getInternalDateTimeValue = (value: any): VcalDateTimeValue => {
    return {
        ...getInternalDateValue(value),
        hours: value.hour,
        minutes: value.minute,
        seconds: value.second,
        isUTC: value.zone.tzid === 'UTC',
    };
};

export const getInternalDurationValue = (value: any): VcalDurationValue => {
    return {
        weeks: value.weeks,
        days: value.days,
        hours: value.hours,
        minutes: value.minutes,
        seconds: value.seconds,
        isNegative: value.isNegative,
    };
};

export const getInternalUntil = (value?: any): VcalDateOrDateTimeValue | undefined => {
    if (!value) {
        return;
    }
    return value.icaltype === 'date' ? getInternalDateValue(value) : getInternalDateTimeValue(value);
};

export const getInternalRecur = (value?: any): VcalRrulePropertyValue | undefined => {
    if (!value) {
        return;
    }
    const result = {
        ...value.toJSON(),
    };
    // COUNT = 0 gets ignored in the above step
    if (value.count === 0) {
        result.count = 0;
    }
    const until = getInternalUntil(value.until);
    if (until) {
        result.until = until;
    }
    return result;
};

/**
 * Convert from ical.js format to an internal format
 */
export const icalValueToInternalValue = (type: string, value: any) => {
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === 'string' || type === 'integer') {
        return value;
    }
    if (type === 'date') {
        return getInternalDateValue(value);
    }
    if (type === 'date-time') {
        return getInternalDateTimeValue(value);
    }
    if (type === 'duration') {
        return getInternalDurationValue(value);
    }
    if (type === 'period') {
        const result: any = {};
        if (value.start) {
            result.start = getInternalDateTimeValue(value.start);
        }
        if (value.end) {
            result.end = getInternalDateTimeValue(value.end);
        }
        if (value.duration) {
            result.duration = getInternalDurationValue(value.duration);
        }
        return result;
    }
    if (type === 'recur') {
        return getInternalRecur(value);
    }
    return value.toString();
};

const getParameters = (type: string, property: any) => {
    const allParameters = property.toJSON() || [];
    const parameters = allParameters[1];
    const isDefaultType = type === property.getDefaultType();

    const result = {
        ...parameters,
    };

    if (!isDefaultType) {
        result.type = type;
    }

    return result;
};

const checkIfDateOrDateTimeValid = (dateOrDateTimeString: string, isDateType = false) => {
    if (/--/.test(dateOrDateTimeString)) {
        // just to be consistent with error messages from ical.js
        const message = isDateType ? 'could not extract integer from' : 'invalid date-time value';
        throw new Error(message);
    }
};

export const fromIcalProperties = (properties = []) => {
    if (properties.length === 0) {
        return;
    }
    return properties.reduce<{ [key: string]: any }>((acc, property: any) => {
        const { name } = property;

        if (!name) {
            return acc;
        }
        const { type } = property;
        if (['date-time', 'date'].includes(type)) {
            checkIfDateOrDateTimeValid(property.toJSON()[3], type === 'date');
        }
        const values = property.getValues().map((value: any) => icalValueToInternalValue(type, value));

        const parameters = getParameters(type, property);
        const propertyAsObject = {
            value: property.isMultiValue ? values : values[0],
            ...(Object.keys(parameters).length && { parameters }),
        };

        if (UNIQUE_PROPERTIES.has(name)) {
            acc[name] = propertyAsObject;
            return acc;
        }

        if (!acc[name]) {
            acc[name] = [];
        }

        // Exdate can be both an array and multivalue, force it to only be an array
        if (name === 'exdate') {
            const normalizedValues = values.map((value: any) => ({ ...propertyAsObject, value }));

            acc[name] = acc[name].concat(normalizedValues);
        } else {
            acc[name].push(propertyAsObject);
        }

        return acc;
    }, {});
};

export const fromIcalComponent = (component: any) => {
    const components = component.getAllSubcomponents().map(fromIcalComponent);
    return {
        component: component.name,
        ...(components.length && { components }),
        ...fromIcalProperties(component ? component.getAllProperties() : undefined),
    } as VcalCalendarComponent;
};

/**
 * Parse vCalendar String and return a component
 */
export const parse = (vcal = ''): VcalCalendarComponent => {
    if (!vcal) {
        return {} as VcalCalendarComponent;
    }
    return fromIcalComponent(new ICAL.Component(ICAL.parse(vcal))) as VcalCalendarComponent;
};
