import { c } from 'ttag';

import { BookingFormValidationReasons, MAX_BOOKING_SLOTS } from '../../bookingsProvider/interface';
import type { BookingFormData, BookingFormValidation } from '../../bookingsProvider/interface';

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
