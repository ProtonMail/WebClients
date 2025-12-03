import { c } from 'ttag';

import { MAX_BOOKING_SLOTS } from '../interface';

export const BookingErrorMessages = {
    get RANGE_ALREADY_EXIST() {
        return c('Info').t`Range already exists.`;
    },
    get RANGE_OVERLAP() {
        return c('Info').t`Range overlaps with an existing range.`;
    },
    get RANGE_IN_PAST() {
        return c('Info').t`Cannot create a range in the past.`;
    },
    get RANGE_MULTIPLE_DAYS() {
        return c('Info').t`Cannot create a range across days.`;
    },
    get RANGE_TOO_SHORT() {
        return c('Info').t`Range is too short.`;
    },
    get NO_CALENDAR_AVAILABLE() {
        return c('Info').t`No calendar available; please delete the booking page.`;
    },
    maxSlotsReached(numberOfSlots: number) {
        return c('Info').t`You’ve reached the limit of booking slots (${numberOfSlots}/${MAX_BOOKING_SLOTS})`;
    },
} as const;
