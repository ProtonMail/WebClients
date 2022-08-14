import { c } from 'ttag';

import { DecryptedKey } from '../../interfaces';
import { CalendarEvent, DecryptedCalendarKey } from '../../interfaces/calendar';
import { getPrimaryKey } from '../../keys';
import { getPrimaryCalendarKey } from '../../keys/calendarKeys';
import { toSessionKey } from '../../keys/sessionKey';
import { readSessionKeys } from '../deserialize';
import { getCalendarEventDecryptionKeys } from '../keys/getCalendarEventDecryptionKeys';

interface GetCreationKeysArguments {
    calendarEvent?: CalendarEvent;
    newAddressKeys: DecryptedKey[];
    oldAddressKeys?: DecryptedKey[];
    newCalendarKeys: DecryptedCalendarKey[];
    oldCalendarKeys?: DecryptedCalendarKey[];
    decryptedSharedKeyPacket?: string;
}

export const getCreationKeys = async ({
    calendarEvent,
    newAddressKeys,
    oldAddressKeys,
    newCalendarKeys,
    oldCalendarKeys,
    decryptedSharedKeyPacket,
}: GetCreationKeysArguments) => {
    const primaryAddressKey = getPrimaryKey(newAddressKeys);
    const primaryPrivateAddressKey = primaryAddressKey ? primaryAddressKey.privateKey : undefined;
    if (!primaryPrivateAddressKey) {
        throw new Error(c('Error').t`Address primary private key not found`);
    }
    const { publicKey: primaryPublicCalendarKey } = getPrimaryCalendarKey(newCalendarKeys);

    if (!calendarEvent) {
        return {
            publicKey: primaryPublicCalendarKey,
            privateKey: primaryPrivateAddressKey,
            sharedSessionKey: decryptedSharedKeyPacket ? toSessionKey(decryptedSharedKeyPacket) : undefined,
        };
    }

    const privateKeys = await getCalendarEventDecryptionKeys({
        calendarEvent,
        addressKeys: oldAddressKeys,
        calendarKeys: oldCalendarKeys || newCalendarKeys,
    });

    const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
        calendarEvent,
        privateKeys,
        decryptedSharedKeyPacket,
    });

    return {
        publicKey: primaryPublicCalendarKey,
        privateKey: primaryPrivateAddressKey,
        sharedSessionKey,
        calendarSessionKey,
    };
};

export default getCreationKeys;
