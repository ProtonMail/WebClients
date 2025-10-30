import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { uint8ArrayToPaddedBase64URLString } from '@proton/shared/lib/helpers/encoding';

import { BookingLocation } from './bookingsProvider/interface';

export const createBookingLink = (secretBytes: Uint8Array<ArrayBuffer>) => {
    const base64Secret = uint8ArrayToPaddedBase64URLString(secretBytes);

    return `${window.location.origin}/bookings#${base64Secret}`;
};

export const getBookingLocationOption = () => {
    return [
        { text: MEET_APP_NAME, value: BookingLocation.MEET },
        { text: c('Location').t`In person`, value: BookingLocation.IN_PERSON },
    ];
};

// The keys MUST be sorted alphabetically.
// We didn't used a replacer to avoid any potential issue with nested objects.
export const JSONFormatData = ({
    description,
    location,
    summary,
    withProtonMeetLink,
}: {
    description: string;
    location: string;
    summary: string;
    withProtonMeetLink: boolean;
}) => {
    return JSON.stringify({ description, location, summary, withProtonMeetLink });
};

// The keys MUST be sorted alphabetically
// // We didn't used a replacer to avoid any potential issue with nested objects.
export const JSONFormatTextData = ({
    EndTime,
    RRule,
    StartTime,
    Timezone,
}: {
    EndTime: number;
    RRule: string | null;
    StartTime: number;
    Timezone: string;
}) => {
    return JSON.stringify({ EndTime, RRule, StartTime, Timezone });
};
