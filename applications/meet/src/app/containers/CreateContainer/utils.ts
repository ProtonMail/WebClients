import { set } from 'date-fns';

import { MINUTE } from '@proton/shared/lib/constants';
import { getTimeZoneOptions } from '@proton/shared/lib/date/timezone';

import type { FormValues } from './types';

export const timeZoneOptions = getTimeZoneOptions();

export const combineDateAndTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
};

export const validateTimeZone = (timeZone: string | undefined | null) => {
    return timeZone && !!timeZoneOptions.find((item) => item.value === timeZone);
};

export const validateDate = (date?: any): date is Date => {
    const isDateInstance = date instanceof Date;

    return !!date && isDateInstance;
};

export const checkIfCorrectMinuteOrSeconds = (text: string) => {
    const integerValue = parseInt(text);

    if (isNaN(integerValue)) {
        return false;
    }

    return integerValue >= 0 && integerValue < 60;
};

export const validateTime = (time?: string) => {
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

    if (combineDateAndTime(values.startDate, values.startTime) > combineDateAndTime(values.endDate, values.endTime)) {
        errors.endTime = true;
        errors.startTime = true;
        errors.endDate = true;
        errors.startDate = true;
    }

    return errors;
};

export const getInitialValues = (): FormValues => {
    const now = new Date();

    const startTime = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(
        new Date()
    );

    const endTime = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(
        new Date(now.getTime() + 30 * MINUTE)
    );

    return {
        meetingName: '',
        startDate: new Date(),
        startTime,
        endDate: new Date(),
        endTime,
        timeZone: '',
        customPassword: '',
        recurrence: 'NO_REPEAT',
    };
};
