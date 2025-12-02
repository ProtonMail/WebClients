import { c } from 'ttag';

import { MAX_BOOKING_SLOTS } from '../bookingsProvider/interface';

export const BookingErrorMessages = {
    get RANGE_ALREADY_EXIST() {
        return c('Info').t`Range already exists.`;
    },
    get RANGE_OVERLAP() {
        return c('Info').t`Range overlaps with an existing range.`;
    },
    get BOOKING_IN_PAST() {
        return c('Info').t`Booking cannot be added in the past.`;
    },
    get RANGE_IN_PAST() {
        return c('Info').t`Cannot create a range in the past.`;
    },
    get RANGE_MULTIPLE_DAYS() {
        return c('Info').t`Cannot create a range across days.`;
    },
    get RANGE_LIMIT_EXCEEDED() {
        return c('Info').t`You can’t have more than ${MAX_BOOKING_SLOTS} booking slots on a page.`;
    },
    get RANGE_TOO_SHORT() {
        return c('Info').t`Range is too short.`;
    },
    get NO_CALENDAR_AVAILABLE() {
        return c('Info').t`No calendar available; please delete the booking page.`;
    },
} as const;
