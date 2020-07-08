import ICAL from 'ical.js';

import { PROPERTIES, UNIQUE_PROPERTIES } from './vcalDefinition';
import { DAY, HOUR, MINUTE, SECOND, WEEK } from '../constants';

const getIcalDateValue = (value, tzid, isDate) => {
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

const getIcalPeriodValue = (value, tzid) => {
    return ICAL.Period.fromData({
        // periods must be of date-time
        start: value.start ? getIcalDateValue(value.start, tzid, false) : undefined,
        end: value.end ? getIcalDateValue(value.end, tzid, false) : undefined,
        duration: value.duration ? ICAL.Duration.fromData(value.duration) : undefined,
    });
};

const getIcalDurationValue = (value) => {
    return ICAL.Duration.fromData(value);
};

const getIcalUntilValue = (value) => {
    if (!value) {
        return;
    }
    return getIcalDateValue(value, '', typeof value.hours === 'undefined');
};

export const internalValueToIcalValue = (type, value, { tzid } = {}) => {
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

const getInternalDateValue = (value) => {
    return {
        year: value.year,
        month: value.month,
        day: value.day,
    };
};

export const getInternalDateTimeValue = (value) => {
    return {
        ...getInternalDateValue(value),
        hours: value.hour,
        minutes: value.minute,
        seconds: value.second,
        isUTC: value.zone.tzid === 'UTC',
    };
};

const getInternalDurationValue = (value) => {
    return {
        weeks: value.weeks,
        days: value.days,
        hours: value.hours,
        minutes: value.minutes,
        seconds: value.seconds,
        isNegative: value.isNegative,
    };
};

const getInternalUntil = (value) => {
    if (!value) {
        return;
    }
    return value.icaltype === 'date' ? getInternalDateValue(value) : getInternalDateTimeValue(value);
};

const getInternalRecur = (value) => {
    if (!value) {
        return;
    }
    const result = {
        ...value.toJSON(),
    };
    const until = getInternalUntil(value.until);
    if (until) {
        result.until = until;
    }
    return result;
};

/**
 * Convert from ical.js format to an internal format
 * @param {string} type
 * @param {any} value
 * @return {string|Array|Object}
 */
export const icalValueToInternalValue = (type, value) => {
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
        const result = {};
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
 * @param {String} name
 * @param {any} value
 * @param {Object} [parameters]
 * @returns {ICAL.Property|ICAL.Property|*}
 */
const getProperty = (name, { value, parameters }) => {
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

/**
 * @param {ICAL.Component} component
 * @param {Object} properties
 * @return {ICAL.Component}
 */
const addInternalProperties = (component, properties) => {
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

/**
 * @param {Object} properties
 * @return {ICAL.Component}
 */
const fromInternalComponent = (properties) => {
    const { component: name, components, ...restProperties } = properties;

    const component = addInternalProperties(new ICAL.Component(name), restProperties);

    if (Array.isArray(components)) {
        components.forEach((otherComponent) => {
            component.addSubcomponent(fromInternalComponent(otherComponent));
        });
    }

    return component;
};

/**
 * @param {Object} component
 * @return {string}
 */
export const serialize = (component) => {
    return fromInternalComponent(component).toString();
};

const getParameters = (type, property) => {
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

/**
 * @param {Array} properties
 * @return {Object}
 */
const fromIcalProperties = (properties = []) => {
    if (properties.length === 0) {
        return;
    }
    return properties.reduce((acc, property) => {
        const { name } = property;

        if (!name) {
            return acc;
        }

        const { type } = property;
        const values = property.getValues().map((value) => icalValueToInternalValue(type, value));

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
            const normalizedValues = values.map((value) => ({ ...propertyAsObject, value }));

            acc[name] = acc[name].concat(normalizedValues);
        } else {
            acc[name].push(propertyAsObject);
        }

        return acc;
    }, {});
};

/**
 * @param {ICAL.Component} component
 * @returns {Object}
 */
export const fromIcalComponent = (component) => {
    const components = component.getAllSubcomponents().map(fromIcalComponent);
    return {
        component: component.name,
        ...(components.length && { components }),
        ...fromIcalProperties(component ? component.getAllProperties() : undefined),
    };
};

export const fromIcalComponentWithErrors = (component) => {
    const components = component.getAllSubcomponents().map((subcomponent) => {
        try {
            return fromIcalComponent(subcomponent);
        } catch (error) {
            return { error, component: subcomponent };
        }
    });
    return {
        component: component.name,
        ...(components.length && { components }),
        ...fromIcalProperties(component ? component.getAllProperties() : undefined),
    };
};

/**
 * Parse vCalendar String and return a component
 * @param {String} vcal
 * @returns {Object}
 */
export const parse = (vcal = '') => {
    if (!vcal) {
        return {};
    }
    return fromIcalComponent(new ICAL.Component(ICAL.parse(vcal)));
};

/**
 * Naively try to reformat badly formatted line breaks in a vcalendar string
 */
const reformatLineBreaks = (vcal = '') => {
    const crlf = '\r\n';
    const lines = vcal.includes(crlf) ? vcal.split(crlf) : vcal.split('\n');
    return lines.reduce((acc, line) => {
        const fieldMatch = line.match(/(\w+-?\w*)(?::|;)/);
        if (!fieldMatch) {
            return `${acc}\\n${line}`;
        }
        const field = fieldMatch[1].toLowerCase();
        if (PROPERTIES.has(field) || field.startsWith('x-') || ['begin', 'end'].includes(field)) {
            return `${acc}\r\n${line}`;
        }
        return `${acc}\\n${line}`;
    }, '');
};

/**
 * Same as the parse function, but catching errors
 */
export const parseWithErrors = (vcal = '', retry = true) => {
    try {
        if (!vcal) {
            return {};
        }
        return fromIcalComponentWithErrors(new ICAL.Component(ICAL.parse(vcal)));
    } catch (e) {
        // try to recover from line break errors
        if (e.message.toLowerCase().includes('invalid line (no token ";" or ":")') && retry) {
            const reformattedVcal = reformatLineBreaks(vcal);
            return parseWithErrors(reformattedVcal, false);
        }
        throw e;
    }
};

export const fromRruleString = (rrule = '') => {
    return getInternalRecur(ICAL.Recur.fromString(rrule));
};

/**
 * Parse a trigger string (e.g. '-PT15M') and return an object indicating its duration
 * @param {String} trigger
 * @return {{ isNegative: Boolean, hours: Number, seconds: Number, weeks: Number, minutes: Number, days: Number }}
 */
export const fromTriggerString = (trigger = '') => {
    return getInternalDurationValue(ICAL.Duration.fromString(trigger));
};

export const toTriggerString = (value) => {
    return getIcalDurationValue(value).toString();
};

/**
 * Transform a duration object into milliseconds
 * @param {{ isNegative: Boolean, hours: Number, seconds: Number, weeks: Number, minutes: Number, days: Number }}
 * @return {Number}
 */
const durationToMilliseconds = ({
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
 * @param trigger
 * @return {Number}
 */
export const getMillisecondsFromTriggerString = (trigger = '') => {
    return durationToMilliseconds(fromTriggerString(trigger));
};
