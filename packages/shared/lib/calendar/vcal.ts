/**
 * This file needs to be improved in terms of typing. They were rushed due to time constraints.
 */
import ICAL from 'ical.js';

import { parseWithRecovery } from '@proton/shared/lib/calendar/icsSurgery/ics';

import { DAY, HOUR, MINUTE, SECOND, WEEK } from '../constants';
import type {
    VcalCalendarComponent,
    VcalCalendarComponentWithMaybeErrors,
    VcalDateOrDateTimeValue,
    VcalDateTimeValue,
    VcalDateValue,
    VcalDurationValue,
    VcalErrorComponent,
    VcalRrulePropertyValue,
    VcalValarmComponent,
    VcalVcalendar,
    VcalVcalendarWithMaybeErrors,
    VcalVeventComponent,
    VcalVeventComponentWithMaybeErrors,
} from '../interfaces/calendar';
import { UNIQUE_PROPERTIES } from './vcalDefinition';
import { getIsVcalErrorComponent } from './vcalHelper';

const getIcalDateValue = (value: any, tzid: string | undefined, isDate: boolean) => {
    const icalTimezone = value.isUTC ? ICAL.Timezone.utcTimezone : ICAL.Timezone.localTimezone;
    const icalData = {
        year: value.year,
        month: value.month,
        day: value.day,
        hour: value.hours || 0,
        minute: value.minutes || 0,
        second: value.seconds || 0,
        isDate,
    };
    return ICAL.Time.fromData(icalData, icalTimezone);
};

const getIcalPeriodValue = (value: any, tzid: string | undefined) => {
    return ICAL.Period.fromData({
        // periods must be of date-time
        start: value.start ? getIcalDateValue(value.start, tzid, false) : undefined,
        end: value.end ? getIcalDateValue(value.end, tzid, false) : undefined,
        duration: value.duration ? ICAL.Duration.fromData(value.duration) : undefined,
    });
};

const getIcalDurationValue = (value?: any) => {
    return ICAL.Duration.fromData(value);
};

const getIcalUntilValue = (value?: any) => {
    if (!value) {
        return;
    }
    return getIcalDateValue(value, '', typeof value.hours === 'undefined');
};

export const internalValueToIcalValue = (type: string, value: any, { tzid }: { tzid?: string } = {}) => {
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (type === 'date' || type === 'date-time') {
        return getIcalDateValue(value, tzid, type === 'date');
    }
    if (type === 'duration') {
        return getIcalDurationValue(value);
    }
    if (type === 'period') {
        return getIcalPeriodValue(value, tzid);
    }
    if (type === 'recur') {
        if (!value.until) {
            return ICAL.Recur.fromData(value);
        }
        const until = getIcalUntilValue(value.until);
        return ICAL.Recur.fromData({ ...value, until });
    }
    return value.toString();
};

const getInternalDateValue = (value: any): VcalDateValue => {
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

const getInternalDurationValue = (value: any): VcalDurationValue => {
    return {
        weeks: value.weeks,
        days: value.days,
        hours: value.hours,
        minutes: value.minutes,
        seconds: value.seconds,
        isNegative: value.isNegative,
    };
};

const getInternalUntil = (value?: any): VcalDateOrDateTimeValue | undefined => {
    if (!value) {
        return;
    }
    return value.icaltype === 'date' ? getInternalDateValue(value) : getInternalDateTimeValue(value);
};

const getInternalRecur = (value?: any): VcalRrulePropertyValue | undefined => {
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

/**
 * Get an ical property.
 */
const getProperty = (name: string, { value, parameters }: any) => {
    const property = new ICAL.Property(name);

    const { type: specificType, ...restParameters } = parameters || {};

    if (specificType) {
        property.resetType(specificType);
    }

    const type = specificType || property.type;

    if (property.isMultiValue && Array.isArray(value)) {
        property.setValues(value.map((val) => internalValueToIcalValue(type, val, restParameters)));
    } else {
        property.setValue(internalValueToIcalValue(type, value, restParameters));
    }

    Object.keys(restParameters).forEach((key) => {
        property.setParameter(key, restParameters[key]);
    });

    return property;
};

const addInternalProperties = (component: any, properties: any) => {
    Object.keys(properties).forEach((name) => {
        const jsonProperty = properties[name];

        if (Array.isArray(jsonProperty)) {
            jsonProperty.forEach((property) => {
                component.addProperty(getProperty(name, property));
            });
            return;
        }

        component.addProperty(getProperty(name, jsonProperty));
    });
    return component;
};

const fromInternalComponent = (properties: any) => {
    const { component: name, components, ...restProperties } = properties;

    const component = addInternalProperties(new ICAL.Component(name), restProperties);

    if (Array.isArray(components)) {
        components.forEach((otherComponent) => {
            component.addSubcomponent(fromInternalComponent(otherComponent));
        });
    }

    return component;
};

export const serialize = (component: any): string => {
    return fromInternalComponent(component).toString();
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

const fromIcalProperties = (properties = []) => {
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

export const fromIcalComponentWithMaybeErrors = (
    component: any
): VcalCalendarComponentWithMaybeErrors | VcalErrorComponent => {
    const components = component.getAllSubcomponents().map((subcomponent: any) => {
        try {
            return fromIcalComponentWithMaybeErrors(subcomponent);
        } catch (error: any) {
            return { error, icalComponent: subcomponent };
        }
    });
    return {
        component: component.name,
        ...(components.length && { components }),
        ...fromIcalProperties(component ? component.getAllProperties() : undefined),
    } as VcalCalendarComponentWithMaybeErrors;
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

/**
 * Same as the parseWithRecovery function, but catching errors in individual components.
 * This is useful in case we can parse some events but not all in a given ics
 */
export const parseVcalendarWithRecoveryAndMaybeErrors = (
    vcal: string,
    retry?: {
        retryLineBreaks?: boolean;
        retryEnclosing?: boolean;
        retryDateTimes?: boolean;
        retryOrganizer?: boolean;
        retryDuration?: boolean;
    }
): VcalVcalendarWithMaybeErrors | VcalCalendarComponentWithMaybeErrors => {
    try {
        const result = parseWithRecovery(vcal, retry) as VcalVcalendar;
        // add mandatory but maybe missing properties
        if (!result.prodid) {
            result.prodid = { value: '' };
        }
        if (!result.version) {
            result.version = { value: '2.0' };
        }
        return result;
    } catch (e) {
        return fromIcalComponentWithMaybeErrors(new ICAL.Component(ICAL.parse(vcal))) as
            | VcalVcalendarWithMaybeErrors
            | VcalCalendarComponentWithMaybeErrors;
    }
};

export const getVeventWithoutErrors = (
    veventWithMaybeErrors: VcalVeventComponentWithMaybeErrors
): VcalVeventComponent => {
    const filteredComponents: VcalValarmComponent[] | undefined = veventWithMaybeErrors.components?.filter(
        (component): component is VcalValarmComponent => !getIsVcalErrorComponent(component)
    );

    return {
        ...veventWithMaybeErrors,
        components: filteredComponents,
    };
};

export const fromRruleString = (rrule = '') => {
    return getInternalRecur(ICAL.Recur.fromString(rrule));
};

/**
 * Parse a trigger string (e.g. '-PT15M') and return an object indicating its duration
 */
export const fromTriggerString = (trigger = '') => {
    return getInternalDurationValue(ICAL.Duration.fromString(trigger));
};

export const toTriggerString = (value: VcalDurationValue): string => {
    return getIcalDurationValue(value).toString();
};

/**
 * Transform a duration object into milliseconds
 */
export const durationToMilliseconds = ({
    isNegative = false,
    weeks = 0,
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
}) => {
    const lapse = weeks * WEEK + days * DAY + hours * HOUR + minutes * MINUTE + seconds * SECOND + milliseconds;
    return isNegative ? -lapse : lapse;
};

/**
 * Parse a trigger string (e.g. '-PT15M') and return its duration in milliseconds
 */
export const getMillisecondsFromTriggerString = (trigger = '') => {
    return durationToMilliseconds(fromTriggerString(trigger));
};
