import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';

import { BookingLocation } from './interface';

export const getBookingLocationOption = () => {
    return [
        { text: MEET_APP_NAME, value: BookingLocation.MEET },
        { text: c('Location').t`In person`, value: BookingLocation.IN_PERSON },
    ];
};
