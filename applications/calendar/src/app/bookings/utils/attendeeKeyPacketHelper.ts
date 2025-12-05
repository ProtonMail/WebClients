import type { SessionKey } from '@proton/crypto/lib';
import { getIsAddressActive, getIsAddressExternal, getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces';
import type { CalendarUserSettings, DecryptedCalendarKey } from '@proton/shared/lib/interfaces/calendar';

import { encryptSlotBookingSharedKeyPackets } from '../../containers/bookings/utils/crypto/bookingEncryption';

export type AttendeeSharedKeyPacketResult =
    | { type: 'success'; keyPacket: string | undefined }
    | { type: 'disabled_address' };

export const getAttendeeSharedKeyPacket = async ({
    isGuest,
    attendeeEmail,
    getCalendarUserSettings,
    getAddresses,
    getCalendarKeys,
    sharedSessionKey,
}: {
    isGuest: boolean;
    attendeeEmail: string;
    sharedSessionKey: SessionKey | undefined;
    getCalendarUserSettings: () => Promise<CalendarUserSettings>;
    getAddresses: () => Promise<Address[]>;
    getCalendarKeys: (calendarID: string) => Promise<DecryptedCalendarKey[]>;
}): Promise<AttendeeSharedKeyPacketResult> => {
    if (isGuest) {
        return { type: 'success', keyPacket: undefined };
    }

    const [calendarSettings, addresses] = await Promise.all([getCalendarUserSettings(), getAddresses()]);

    const usedAddress = addresses.find(
        (address) => canonicalizeInternalEmail(address.Email) === canonicalizeInternalEmail(attendeeEmail)
    );
    if (!calendarSettings.DefaultCalendarID) {
        throw new Error('Default calendar ID or used address not found');
    }

    // The user could have entered an address which is not part of his addresses
    if (!usedAddress) {
        return { type: 'success', keyPacket: undefined };
    }

    // We don't want to auto-add events for external addresses
    if (getIsAddressExternal(usedAddress) || getIsBYOEAddress(usedAddress)) {
        return { type: 'success', keyPacket: undefined };
    }

    // Block booking submission for disabled addresses
    if (!getIsAddressActive(usedAddress)) {
        return { type: 'disabled_address' };
    }

    const sharedKeyPacket = await encryptSlotBookingSharedKeyPackets({
        calendarID: calendarSettings.DefaultCalendarID,
        getCalendarKeys,
        sharedSessionKey,
    });

    return { type: 'success', keyPacket: sharedKeyPacket?.toBase64() };
};
