import type { SessionKey } from '@proton/crypto/lib';
import { getIsAddressExternal } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';
import type { CalendarUserSettings, DecryptedCalendarKey } from '@proton/shared/lib/interfaces/calendar';

import { encryptSlotBookingSharedKeyPackets } from '../../containers/bookings/utils/crypto/bookingEncryption';

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
}) => {
    if (isGuest) {
        return undefined;
    }

    const [calendarSettings, addresses] = await Promise.all([getCalendarUserSettings(), getAddresses()]);

    const usedAddress = addresses.find((address) => address.Email === attendeeEmail);
    if (!calendarSettings.DefaultCalendarID || !usedAddress) {
        throw new Error('Default calendar ID or used address not found');
    }

    // We don't want to auto-add events for external addresses
    if (getIsAddressExternal(usedAddress)) {
        return undefined;
    }

    const sharedKeyPacket = await encryptSlotBookingSharedKeyPackets({
        calendarID: calendarSettings.DefaultCalendarID,
        getCalendarKeys,
        sharedSessionKey,
    });

    return sharedKeyPacket?.toBase64();
};
