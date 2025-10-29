import { uint8ArrayToPaddedBase64URLString } from '@proton/shared/lib/helpers/encoding';

export const createBookingLink = (secretBytes: Uint8Array<ArrayBuffer>) => {
    const base64Secret = uint8ArrayToPaddedBase64URLString(secretBytes);

    return `${window.location.origin}/bookings#${base64Secret}`;
};

// The keys MUST be sorted alphabetically.
// We didn't used a replacer to avoid any potential issue with nested objects.
export const JSONFormatData = ({
    description,
    location,
    summary,
}: {
    description: string;
    location: string;
    summary: string;
}) => {
    return JSON.stringify({ description, location, summary });
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
