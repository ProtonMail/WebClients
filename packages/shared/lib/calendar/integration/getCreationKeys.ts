import { c } from 'ttag';
import { readSessionKeys } from '../deserialize';
import { getPrimaryKey } from '../../keys';
import { CalendarEvent, DecryptedCalendarKey } from '../../interfaces/calendar';
import { DecryptedKey } from '../../interfaces';
import { getCalendarEventDecryptionKeys } from '../keys/getCalendarEventDecryptionKeys';
import { toSessionKey } from '../../keys/sessionKey';
import { getPrimaryCalendarKey } from '../../keys/calendarKeys';

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
