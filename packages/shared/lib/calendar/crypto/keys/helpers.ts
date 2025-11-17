import { c } from 'ttag';

import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { hasBit } from '../../../helpers/bitset';
import type { Address, DecryptedKey } from '../../../interfaces';
import type {
    CalendarEvent,
    CalendarMember,
    CalendarSetupData,
    CreateOrResetCalendarPayload,
    DecryptedCalendarKey,
} from '../../../interfaces/calendar';
import { CalendarKeyFlags } from '../../../interfaces/calendar';
import type { GetAddressKeys } from '../../../interfaces/hooks/GetAddressKeys';
import type { GetCalendarKeys } from '../../../interfaces/hooks/GetCalendarKeys';
import { getPrimaryKey, splitKeys } from '../../../keys';
import { toSessionKey } from '../../../keys/sessionKey';
import { getIsAutoAddedInvite } from '../../apiModels';
import { readSessionKeys } from '../../deserialize';

export const getPrimaryCalendarKey = (calendarKeys: DecryptedCalendarKey[]) => {
    const primaryKey = calendarKeys.find(({ Key: { Flags } }) => hasBit(Flags, CalendarKeyFlags.PRIMARY));
    if (!primaryKey) {
        throw new Error('Calendar primary key not found');
    }
    return primaryKey;
};

export const getCalendarEventDecryptionKeys = async ({
    calendarEvent,
    addressKeys,
    calendarKeys,
    getAddressKeys,
    getCalendarKeys,
}: {
    calendarEvent: CalendarEvent;
    addressKeys?: DecryptedKey[];
    calendarKeys?: DecryptedCalendarKey[];
    getAddressKeys?: GetAddressKeys;
    getCalendarKeys?: GetCalendarKeys;
}) => {
    const { CalendarID } = calendarEvent;
    if (getIsAutoAddedInvite(calendarEvent)) {
        if (!addressKeys && !getAddressKeys) {
            return;
        }
        return splitKeys(addressKeys || (await getAddressKeys?.(calendarEvent.AddressID))).privateKeys;
    }
    if (!calendarKeys && !getCalendarKeys) {
        return;
    }
    return splitKeys(calendarKeys || (await getCalendarKeys?.(CalendarID))).privateKeys;
};

export const getCreationKeys = async ({
    calendarEvent,
    newAddressKeys,
    oldAddressKeys,
    newCalendarKeys,
    oldCalendarKeys,
    decryptedSharedKeyPacket,
}: {
    calendarEvent?: CalendarEvent;
    newAddressKeys: DecryptedKey[];
    oldAddressKeys?: DecryptedKey[];
    newCalendarKeys: DecryptedCalendarKey[];
    oldCalendarKeys?: DecryptedCalendarKey[];
    decryptedSharedKeyPacket?: string;
}) => {
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

    return sessionKey ? sessionKey.data.toBase64() : undefined;
};

export const getAddressesMembersMap = (Members: CalendarMember[], Addresses: Address[]) => {
    return Members.reduce<{ [key: string]: Address }>((acc, Member) => {
        const Address = Addresses.find(({ Email }) => Email === Member.Email);
        if (!Address) {
            return acc;
        }
        acc[Member.ID] = Address;
        return acc;
    }, {});
};

export const isCalendarSetupData = (
    payload: CreateOrResetCalendarPayload | CalendarSetupData
): payload is CalendarSetupData => isTruthy(payload.Passphrase.KeyPacket);
