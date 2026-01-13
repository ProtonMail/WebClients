import type { SessionKey } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { getPrimaryCalendarKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import type { Address } from '@proton/shared/lib/interfaces';
import type { CalendarUserSettings, DecryptedCalendarKey } from '@proton/shared/lib/interfaces/calendar';

import type { BookingDetails } from '../booking.store';
import type { AttendeeSharedKeyPacketResult } from './attendeeKeyPacketHelper';
import { getAttendeeSharedKeyPacket } from './attendeeKeyPacketHelper';

interface BookingSharedKeyPacketResult {
    sharedSessionKey: SessionKey;
    attendeeSharedKeyPacket: AttendeeSharedKeyPacketResult;
    sharedKeyPacket: string;
}

export const getBookingSharedKeyPacket = async ({
    isGuest,
    attendeeEmail,
    bookingDetails,
    getAddresses,
    getCalendarKeys,
    getCalendarUserSettings,
}: {
    isGuest: boolean;
    attendeeEmail: string;
    bookingDetails: BookingDetails | null;
    getAddresses: () => Promise<Address[]>;
    getCalendarUserSettings: () => Promise<CalendarUserSettings>;
    getCalendarKeys: (calendarID: string) => Promise<DecryptedCalendarKey[]>;
}): Promise<null | BookingSharedKeyPacketResult> => {
    if (!bookingDetails || !bookingDetails.calendarPublicKey) {
        return null;
    }

    const calendarPublicKey = bookingDetails.calendarPublicKey;

    let attendeeCalendarKey;
    if (!isGuest) {
        const calendarSettings = await getCalendarUserSettings();
        if (calendarSettings && calendarSettings.DefaultCalendarID) {
            const calendarKeys = await getCalendarKeys(calendarSettings.DefaultCalendarID);
            attendeeCalendarKey = getPrimaryCalendarKey(calendarKeys).privateKey;
        }
    }

    const sharedSessionKey = await CryptoProxy.generateSessionKey({
        recipientKeys: attendeeCalendarKey ? [attendeeCalendarKey, calendarPublicKey] : calendarPublicKey,
    });

    const [sharedKeyPacket, attendeeSharedKeyPacket] = await Promise.all([
        CryptoProxy.encryptSessionKey({
            ...sharedSessionKey,
            encryptionKeys: calendarPublicKey,
            format: 'binary',
        }),
        getAttendeeSharedKeyPacket({
            isGuest,
            attendeeEmail,
            sharedSessionKey,
            getCalendarUserSettings,
            getAddresses,
            getCalendarKeys,
        }),
    ]);

    return {
        sharedSessionKey,
        attendeeSharedKeyPacket,
        sharedKeyPacket: sharedKeyPacket.toBase64(),
    };
};
