import { c } from 'ttag';

import noop from '@proton/utils/noop';

import { uint8ArrayToBase64String } from '../../helpers/encoding';
import { DecryptedKey } from '../../interfaces';
import { CalendarEvent, DecryptedCalendarKey } from '../../interfaces/calendar';
import { GetAddressKeys } from '../../interfaces/hooks/GetAddressKeys';
import { GetCalendarKeys } from '../../interfaces/hooks/GetCalendarKeys';
import { getPrimaryKey, splitKeys } from '../../keys';
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

export const getSharedSessionKey = async ({
    calendarEvent,
    calendarKeys,
    getAddressKeys,
    getCalendarKeys,
}: {
    calendarEvent: CalendarEvent;
    calendarKeys?: DecryptedCalendarKey[];
    getAddressKeys?: GetAddressKeys;
    getCalendarKeys?: GetCalendarKeys;
}) => {
    try {
        // we need to decrypt the sharedKeyPacket in Event to obtain the decrypted session key
        const privateKeys = calendarKeys
            ? splitKeys(calendarKeys).privateKeys
            : await getCalendarEventDecryptionKeys({ calendarEvent, getAddressKeys, getCalendarKeys });
        if (!privateKeys) {
            return;
        }
        const [sessionKey] = await readSessionKeys({ calendarEvent, privateKeys });

        return sessionKey;
    } catch (e: any) {
        noop();
    }
};

export const getBase64SharedSessionKey = async ({
    calendarEvent,
    calendarKeys,
    getAddressKeys,
    getCalendarKeys,
}: {
    calendarEvent: CalendarEvent;
    calendarKeys?: DecryptedCalendarKey[];
    getAddressKeys?: GetAddressKeys;
    getCalendarKeys?: GetCalendarKeys;
}) => {
    const sessionKey = await getSharedSessionKey({ calendarEvent, calendarKeys, getAddressKeys, getCalendarKeys });

    return sessionKey ? uint8ArrayToBase64String(sessionKey.data) : undefined;
};
