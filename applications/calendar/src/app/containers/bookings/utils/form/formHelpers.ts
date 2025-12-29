import { addHours, getUnixTime, isSameDay } from 'date-fns';

import { convertZonedDateTimeToUTC, fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';

import type { SerializedFormData } from '../../bookingsTypes';
import type { BookingFormData, BookingFormValidation, BookingRange } from '../../interface';
import { BookingFormValidationReasons, BookingLocation, MAX_BOOKING_SLOTS, MinimumNoticeMode } from '../../interface';
import { BookingErrorMessages } from '../bookingCopy';

export const validateFormData = (data: BookingFormData): BookingFormValidation | undefined => {
    if (data.bookingSlots.length > MAX_BOOKING_SLOTS) {
        return {
            type: 'error',
            reason: BookingFormValidationReasons.TIME_SLOT_LIMIT,
            message: BookingErrorMessages.maxSlotsReached(data.bookingSlots.length),
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

    if (
        data.locationType === BookingLocation.OTHER_LOCATION &&
        (data.location?.trim().length === 0 || !data.location)
    ) {
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
        minimumNoticeMode: formData.minimumNoticeMode || MinimumNoticeMode.OFF,
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
