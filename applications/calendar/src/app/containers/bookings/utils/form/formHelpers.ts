import { addHours, getUnixTime, isSameDay } from 'date-fns';
import { c } from 'ttag';

import { convertZonedDateTimeToUTC, fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';

import { BookingFormValidationReasons, BookingLocation, MAX_BOOKING_SLOTS } from '../../bookingsProvider/interface';
import type { BookingFormData, BookingFormValidation, BookingRange } from '../../bookingsProvider/interface';
import type { SerializedFormData } from '../../bookingsTypes';

export const validateFormData = (data: BookingFormData): BookingFormValidation | undefined => {
    if (data.bookingSlots.length >= MAX_BOOKING_SLOTS) {
        return {
            type: 'error',
            reason: BookingFormValidationReasons.TIME_SLOT_LIMIT,
            message: c('Info').t`You can’t have more than ${MAX_BOOKING_SLOTS} booking slots on a page.`,
        };
    }

    if (data.summary.trim().length === 0) {
        return {
            type: 'warning',
            reason: BookingFormValidationReasons.TITLE_REQUIRED,
        };
    }

    if (data.bookingSlots.length === 0) {
        return {
            type: 'warning',
            reason: BookingFormValidationReasons.TIME_SLOT_REQUIRED,
        };
    }

    if (data.locationType === BookingLocation.IN_PERSON && (data.location?.trim().length === 0 || !data.location)) {
        return {
            type: 'warning',
            reason: BookingFormValidationReasons.MISSING_LOCATION,
        };
    }

    if (data.bookingRanges.some((range) => range.error)) {
        return {
            type: 'warning',
            reason: BookingFormValidationReasons.RANGE_ERROR,
        };
    }

    return undefined;
};

export const serializeFormData = (formData: BookingFormData): SerializedFormData => {
    return {
        ...formData,
        bookingSlots: formData.bookingSlots.map((slot) => ({
            ...slot,
            start: getUnixTime(toUTCDate(convertZonedDateTimeToUTC(fromLocalDate(slot.start), formData.timezone))),
            end: getUnixTime(toUTCDate(convertZonedDateTimeToUTC(fromLocalDate(slot.end), formData.timezone))),
        })),
        bookingRanges: formData.bookingRanges.map((range) => ({
            ...range,
            start: range.start.getTime(),
            end: range.end.getTime(),
        })),
    };
};

export const wouldOverflowDay = (range: BookingRange): boolean => {
    const newStart = addHours(range.end, 1);
    return !isSameDay(range.start, newStart);
};
