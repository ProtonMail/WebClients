// The keys MUST be sorted alphabetically.

// We didn't used a replacer to avoid any potential issue with nested objects.
export const JSONFormatData = ({
    description,
    location,
    summary,
    withProtonMeetLink,
}: {
    description?: string;
    location?: string;
    summary?: string;
    withProtonMeetLink: boolean;
}) => {
    return JSON.stringify({
        description: description || '',
        location: location || '',
        summary: summary || '',
        withProtonMeetLink,
    });
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

export const createBookingLink = (origin: string, secretBytes: Uint8Array<ArrayBuffer>) => {
    const base64Secret = secretBytes.toBase64({ alphabet: 'base64url' });

    return `${origin}/bookings#${base64Secret}`;
};
