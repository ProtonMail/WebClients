import { ALWAYS_LOCAL_TIMEZONE_ID } from '../../../components/RecurrenceRuleFieldset/types';
import type { ClientToolSuccessResult, ValidationResult } from '../validationUtils';
import {
    getUnexpectedProperty,
    invalidArguments,
    isIntegerInRange,
    isNonBlankString,
    isRecord,
} from '../validationUtils';
import type { CreateScheduleToolArguments } from './createScheduleTool';
import { createScheduleSchema } from './schema';

/**
 * Check decoded arguments before executing a call or rendering a persisted schedule draft.
 * Keep these checks aligned with the advertised schema, including unknown fields, frequency-specific
 * recurrence fields, valid dates and timezones, and connector ids.
 * Return the first invalid field to the model for correction without runtime code generation.
 * When registered connector ids are supplied, reject ids outside that catalog.
 * Omit the catalog when rendering persisted drafts so changes to the registry do not hide existing cards.
 */
export function validateCreateScheduleToolArguments(
    value: unknown,
    registeredConnectorIds?: ReadonlySet<string>
): ValidationResult<CreateScheduleToolArguments> {
    if (!isRecord(value)) return invalidArguments('arguments: must be an object');
    const schema = createScheduleSchema;
    const unexpectedProperty = getUnexpectedProperty(value, schema.properties);
    if (unexpectedProperty !== undefined) return invalidArguments(`arguments.${unexpectedProperty}: unknown field`);
    for (const field of ['name', 'instructions'] as const) {
        if (!isNonBlankString(value[field])) return invalidArguments(`${field}: must be a non-blank string`);
    }
    if (typeof value.name !== 'string' || value.name.length > schema.properties.name.maxLength) {
        return invalidArguments('name: must contain at most 64 characters');
    }
    if (
        typeof value.instructions !== 'string' ||
        value.instructions.length > schema.properties.instructions.maxLength
    ) {
        return invalidArguments('instructions: must contain at most 1024 characters');
    }

    const rule = value.recurrenceRule;
    if (!isRecord(rule)) return invalidArguments('recurrenceRule: must be an object');
    const ruleSchema = schema.properties.recurrenceRule.oneOf.find(
        (entry) => entry.properties.frequency.enum[0] === rule.frequency
    );
    if (!ruleSchema) return invalidArguments('recurrenceRule.frequency: must be ONCE, DAILY, WEEKLY, or MONTHLY');
    const unexpectedRuleProperty = getUnexpectedProperty(rule, ruleSchema.properties);
    if (unexpectedRuleProperty !== undefined) {
        return invalidArguments(`recurrenceRule.${unexpectedRuleProperty}: unknown field for this frequency`);
    }
    if (!isIntegerInRange(rule.hour, 0, 23)) {
        return invalidArguments('recurrenceRule.hour: must be an integer between 0 and 23');
    }
    if (!isIntegerInRange(rule.minute, 0, 59)) {
        return invalidArguments('recurrenceRule.minute: must be an integer between 0 and 59');
    }
    if (!isNonBlankString(rule.timezone)) {
        return invalidArguments('recurrenceRule.timezone: must be an IANA timezone or always_local_time');
    }
    if (rule.timezone !== ALWAYS_LOCAL_TIMEZONE_ID) {
        try {
            new Intl.DateTimeFormat('en', { timeZone: rule.timezone });
        } catch {
            return invalidArguments('recurrenceRule.timezone: unrecognized timezone');
        }
    }
    if (rule.frequency === 'ONCE') {
        if (typeof rule.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rule.date)) {
            return invalidArguments('recurrenceRule.date: must be a calendar date in YYYY-MM-DD format');
        }
        const date = new Date(`${rule.date}T00:00:00Z`);
        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== rule.date) {
            return invalidArguments('recurrenceRule.date: must be a valid calendar date');
        }
    }
    if (rule.frequency === 'WEEKLY') {
        const weekdays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
        if (
            !Array.isArray(rule.byWeekDay) ||
            rule.byWeekDay.length === 0 ||
            rule.byWeekDay.some((day) => typeof day !== 'string' || !weekdays.includes(day)) ||
            new Set(rule.byWeekDay).size !== rule.byWeekDay.length
        ) {
            return invalidArguments(
                'recurrenceRule.byWeekDay: must contain unique weekday tokens (MO, TU, WE, TH, FR, SA, SU)'
            );
        }
    }
    if (rule.frequency === 'MONTHLY') {
        if (
            !Array.isArray(rule.byMonthDay) ||
            rule.byMonthDay.length === 0 ||
            rule.byMonthDay.some((day) => !isIntegerInRange(day, 1, 31)) ||
            new Set(rule.byMonthDay).size !== rule.byMonthDay.length
        ) {
            return invalidArguments('recurrenceRule.byMonthDay: must contain unique integers between 1 and 31');
        }
    }

    if (!Array.isArray(value.connectors)) return invalidArguments('connectors: must be an array');
    for (const [index, connector] of value.connectors.entries()) {
        const path = `connectors[${index}]`;
        if (!isNonBlankString(connector)) return invalidArguments(`${path}: must be a non-blank connector id`);
        if (registeredConnectorIds && !registeredConnectorIds.has(connector)) {
            return invalidArguments(
                `${path}: unknown connector id ${JSON.stringify(connector)}. Registered IDs: ${JSON.stringify([...registeredConnectorIds])}`
            );
        }
    }

    // The structural checks above cover every model-supplied draft field; no schedule is saved here.
    return { ok: true, value: value as unknown as CreateScheduleToolArguments };
}

/** Only acknowledged calls may display a review card; validation failures remain available to the model to retry. */
export const isCreateScheduleToolSuccessResult = (value: unknown): value is ClientToolSuccessResult =>
    isRecord(value) && value.ok === true && typeof value.message === 'string';
