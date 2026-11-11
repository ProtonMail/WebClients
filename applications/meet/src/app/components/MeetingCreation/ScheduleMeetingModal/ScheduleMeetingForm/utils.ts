import { MINUTE } from '@proton/shared/lib/constants';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    getSupportedTimezone,
    getTimeZoneOptions,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import { type Meeting, WaitingRoomState } from '@proton/shared/lib/interfaces/Meet';

import { getNextOccurrence } from '../../../../utils/getNextOccurrence';
import { isTimeZoneKnown } from '../../../../utils/zonedTime';
import type { FormValues } from './types';

const timeZoneOptions = getTimeZoneOptions();

export const combineDateAndTime = (date: Date | undefined, time: string, timeZone: string) => {
    if (!(date instanceof Date)) {
        return new Date(NaN);
    }
    const [hours, minutes] = time.split(':').map(Number);
    const wallClock = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hours,
        minutes,
        seconds: 0,
    };
    return toUTCDate(convertZonedDateTimeToUTC(wallClock, timeZone));
};

const padToTwoDigits = (value: number) => String(value).padStart(2, '0');

export const splitDateAndTime = (instant: Date, timeZone: string) => {
    const { year, month, day, hours, minutes } = convertUTCDateTimeToZone(fromUTCDate(instant), timeZone);
    return {
        date: new Date(year, month - 1, day),
        // Build canonical HH:MM directly — Intl.DateTimeFormat with the system locale
        // produces locale-specific separators (e.g. "14.30" in fi-FI) that break the
        // downstream `time.split(':')` assumption and lead to Invalid Date.
        time: `${padToTwoDigits(hours)}:${padToTwoDigits(minutes)}`,
    };
};

const validateTimeZone = (timeZone: string | undefined | null) => {
    return timeZone && !!timeZoneOptions.find((item) => item.value === timeZone);
};

const validateDate = (date?: any): date is Date => {
    const isDateInstance = date instanceof Date;

    return !!date && isDateInstance;
};

const checkIfCorrectMinuteOrSeconds = (text: string) => {
    const integerValue = parseInt(text);

    if (isNaN(integerValue)) {
        return false;
    }

    return integerValue >= 0 && integerValue < 60;
};

const validateTime = (time?: string) => {
    if (!time) {
        return false;
    }

    const parts = time.split(':');

    if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2) {
        return false;
    }

    return checkIfCorrectMinuteOrSeconds(parts[0]) && checkIfCorrectMinuteOrSeconds(parts[1]);
};

export const validate = (values: FormValues) => {
    const errors: Record<string, boolean> = {};

    if (!values.meetingName) {
        errors.meetingName = true;
    }

    if (!validateDate(values.startDate)) {
        errors.startDate = true;
    }

    if (!validateDate(values.endDate)) {
        errors.endDate = true;
    }

    if (!validateTimeZone(values.timeZone)) {
        errors.timeZone = true;
    }

    if (!validateTime(values.startTime)) {
        errors.time = true;
    }

    if (!validateTime(values.endTime)) {
        errors.endTime = true;
    }

    if (
        combineDateAndTime(values.startDate, values.startTime, values.timeZone) >
        combineDateAndTime(values.endDate, values.endTime, values.timeZone)
    ) {
        // Check if the dates are different
        const startDateOnly = new Date(values.startDate).setHours(0, 0, 0, 0);
        const endDateOnly = new Date(values.endDate).setHours(0, 0, 0, 0);

        if (startDateOnly !== endDateOnly) {
            // If dates are different, mark date fields as error
            errors.endDate = true;
            errors.startDate = true;
        } else {
            // If dates are the same, mark time fields as error
            errors.endTime = true;
            errors.startTime = true;
        }
    }

    return errors;
};

export const getInitialValues = (isWaitingRoomCreationEnabled: boolean, timeZone: string): FormValues => {
    const now = new Date();
    const start = splitDateAndTime(now, timeZone);
    const end = splitDateAndTime(new Date(now.getTime() + 30 * MINUTE), timeZone);

    return {
        meetingName: '',
        startDate: start.date,
        startTime: start.time,
        endDate: end.date,
        endTime: end.time,
        timeZone,
        recurrence: 'NO_REPEAT',
        waitingRoom: isWaitingRoomCreationEnabled ? WaitingRoomState.DISABLED : undefined,
    };
};

const getEditTimeZone = (storedTimeZone: string | null, userTimeZone: string) => {
    if (!storedTimeZone || !isTimeZoneKnown(storedTimeZone)) {
        return userTimeZone;
    }
    if (validateTimeZone(storedTimeZone)) {
        return storedTimeZone;
    }
    return getSupportedTimezone(storedTimeZone) ?? userTimeZone;
};

export const getEditValues = (
    meeting: Meeting,
    isWaitingRoomCreationEnabled: boolean,
    userTimeZone: string
): Partial<FormValues> => {
    const editValues: Partial<FormValues> = {
        meetingName: meeting.MeetingName,
        ...(isWaitingRoomCreationEnabled ? { waitingRoom: meeting.WaitingRoom ?? WaitingRoomState.DISABLED } : {}),
    };

    const formTimeZone = getEditTimeZone(meeting.Timezone, userTimeZone);

    if (meeting.Timezone) {
        editValues.timeZone = formTimeZone;
    }

    if (meeting.RRule) {
        editValues.recurrence = meeting.RRule;
    } else {
        editValues.recurrence = 'NO_REPEAT';
    }

    if (meeting.StartTime && meeting.Timezone) {
        const { startTime } = getNextOccurrence(meeting);
        const start = splitDateAndTime(new Date(Number(startTime) * 1000), formTimeZone);
        editValues.startDate = start.date;
        editValues.startTime = start.time;
    }

    if (meeting.EndTime && meeting.Timezone) {
        const { endTime } = getNextOccurrence(meeting);
        const end = splitDateAndTime(new Date(Number(endTime) * 1000), formTimeZone);
        editValues.endDate = end.date;
        editValues.endTime = end.time;
    }

    return editValues;
};
