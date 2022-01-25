import { c } from 'ttag';
import { hasBit } from '../../helpers/bitset';
import { readSessionKeys } from '../deserialize';
import { splitKeys, getPrimaryKey } from '../../keys';
import { CalendarEvent, DecryptedCalendarKey, CalendarKeyFlags } from '../../interfaces/calendar';
import { DecryptedKey } from '../../interfaces';

interface GetCreationKeysArguments {
    calendarEvent?: CalendarEvent;
    addressKeys: DecryptedKey[];
    newCalendarKeys: DecryptedCalendarKey[];
    oldCalendarKeys?: DecryptedCalendarKey[];
    decryptedSharedKeyPacket?: string;
}

export const getCreationKeys = async ({
    calendarEvent,
    addressKeys,
    newCalendarKeys,
    oldCalendarKeys,
    decryptedSharedKeyPacket,
}: GetCreationKeysArguments) => {
    const primaryAddressKey = getPrimaryKey(addressKeys);
    const primaryPrivateAddressKey = primaryAddressKey ? primaryAddressKey.privateKey : undefined;
    if (!primaryPrivateAddressKey) {
        throw new Error(c('Error').t`Address primary private key not found`);
    }

    const { privateKey: primaryPrivateCalendarKey, publicKey: primaryPublicCalendarKey } =
        newCalendarKeys.find(({ Key: { Flags } }) => hasBit(Flags, CalendarKeyFlags.PRIMARY)) || {};
    if (!primaryPrivateCalendarKey || !primaryPublicCalendarKey) {
        throw new Error(c('Error').t`Calendar primary private key is not decrypted`);
    }

    const decryptionKeys = oldCalendarKeys || newCalendarKeys;

    const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
        calendarEvent,
        ...splitKeys(decryptionKeys),
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
