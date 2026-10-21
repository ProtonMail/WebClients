import { isAfter, roundToNearestMinutes } from 'date-fns';
import { c } from 'ttag';
import { v4 as uuidv4 } from 'uuid';

import { convertZonedDateTimeToUTC, toUTCDate } from '@proton/shared/lib/date/timezone';

import { ALWAYS_LOCAL_TIMEZONE_ID } from '../../../../components/RecurrenceRuleFieldset/types';
import type { ScheduleDetails, ScheduleTemplate } from '../../types';

export type ScheduleDetailsValidationField =
    'name' | 'instructions' | 'time' | 'dateTime' | 'weekDayPicker' | 'monthDayPicker';

export type ScheduleDetailsValidationErrors = Partial<Record<ScheduleDetailsValidationField, string>>;

/** Generates a default, empty schedule details object. */
export const getEmptyScheduleDetails = (): ScheduleDetails => {
    // Default run time: snap to the next 15-minute slot (same step as `TimeInput` in the recurrence fieldset).
    const defaultRunTime = roundToNearestMinutes(new Date(), { nearestTo: 15, roundingMethod: 'ceil' });

    return {
        id: uuidv4(),
        name: '',
        instructions: '',
        recurrenceRule: {
            frequency: 'DAILY',
            hour: defaultRunTime.getHours(),
            minute: defaultRunTime.getMinutes(),
            timezone: ALWAYS_LOCAL_TIMEZONE_ID,
        },
        connectors: [],
        autoApprove: true,
        notifyOnComplete: true,
    };
};

/** Converts a schedule template to a schedule details object. */
export const createScheduleDetailsFrom = (template: ScheduleTemplate): ScheduleDetails => {
    const copiedRecurrenceRule = { ...template.recurrenceRule };

    switch (copiedRecurrenceRule.frequency) {
        case 'WEEKLY':
            copiedRecurrenceRule.byWeekDay = [...copiedRecurrenceRule.byWeekDay];
            break;
        case 'MONTHLY':
            copiedRecurrenceRule.byMonthDay = [...copiedRecurrenceRule.byMonthDay];
            break;
    }

    return {
        id: uuidv4(),
        name: template.name,
        instructions: template.instructions,
        recurrenceRule: copiedRecurrenceRule,
        connectors: template.connectors.map((connector) => ({ ...connector })),
        autoApprove: true,
        notifyOnComplete: true,
    };
};

/** Returns validation error messages keyed by form field (empty object when valid). */
export const getScheduleDetailsValidationErrors = (details: ScheduleDetails): ScheduleDetailsValidationErrors => {
    const errors: ScheduleDetailsValidationErrors = {};

    if (!details.name.trim()) {
        // translator: Validation error when the scheduled task name is empty.
        errors.name = c('collider_2025:Error').t`Enter a name`;
    }

    if (!details.instructions.trim()) {
        // translator: Validation error when the scheduled task instructions are empty.
        errors.instructions = c('collider_2025:Error').t`Enter instructions for each run`;
    }

    const { frequency, hour, minute } = details.recurrenceRule;

    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        // translator: Validation error when the scheduled run time is invalid.
        errors.time = c('collider_2025:Error').t`Enter a valid time`;
    } else {
        switch (frequency) {
            case 'ONCE': {
                try {
                    const { date, timezone } = details.recurrenceRule;
                    const [year, month, day] = date.split('-').map(Number);
                    const runAt =
                        timezone === ALWAYS_LOCAL_TIMEZONE_ID
                            ? new Date(year, month - 1, day, hour, minute, 0)
                            : toUTCDate(
                                  convertZonedDateTimeToUTC(
                                      { year, month, day, hours: hour, minutes: minute, seconds: 0 },
                                      timezone
                                  )
                              );

                    if (!isAfter(runAt, new Date())) {
                        // translator: Validation error when user inputs a one-time schedule that is in the past.
                        errors.dateTime = c('collider_2025:Error').t`Choose a date and time in the future`;
                    }
                } catch {
                    // translator: Validation error when the one-time schedule date cannot be parsed or converted.
                    errors.dateTime = c('collider_2025:Error').t`Enter a valid date and time for this one-time run`;
                }

                break;
            }
            case 'WEEKLY':
                if (details.recurrenceRule.byWeekDay.length === 0) {
                    // translator: Validation error when no day is selected when configuring a weekly schedule.
                    errors.weekDayPicker = c('collider_2025:Error').t`Select at least one day of the week`;
                }
                break;
            case 'MONTHLY':
                if (details.recurrenceRule.byMonthDay.length === 0) {
                    // translator: Validation error when no day is selected when configuring a monthly schedule.
                    errors.monthDayPicker = c('collider_2025:Error').t`Select at least one day of the month`;
                }
                break;
            default:
                break;
        }
    }

    return errors;
};
