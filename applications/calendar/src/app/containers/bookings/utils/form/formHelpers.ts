import { getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { convertZonedDateTimeToUTC, fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';

import { BookingFormValidationReasons, MAX_BOOKING_SLOTS } from '../../bookingsProvider/interface';
import type { BookingFormData, BookingFormValidation } from '../../bookingsProvider/interface';
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
            // TODO this might need to be updated
            start: range.start.getTime(),
            end: range.end.getTime(),
        })),
    };
};
