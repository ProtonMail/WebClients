import { c } from 'ttag';
import getPrimaryKey from '../../keys/getPrimaryKey';
import { hasBit } from '../../helpers/bitset';
import { readSessionKeys } from '../deserialize';
import { splitKeys } from '../../keys/keys';
import { CalendarEvent, KeyFlags } from '../../interfaces/calendar';
import { CachedKey } from '../../interfaces';

interface GetCreationKeysArguments {
    Event?: CalendarEvent;
    addressKeys: CachedKey[];
    newCalendarKeys: CachedKey[];
    oldCalendarKeys?: CachedKey[];
}
export const getCreationKeys = async ({
    Event,
    addressKeys,
    newCalendarKeys,
    oldCalendarKeys,
}: GetCreationKeysArguments) => {
    const primaryAddressKey = getPrimaryKey(addressKeys);
    const primaryPrivateAddressKey = primaryAddressKey ? primaryAddressKey.privateKey : undefined;
    if (!primaryPrivateAddressKey) {
        throw new Error(c('Error').t`Address primary private key not found`);
    }

    const { privateKey: primaryPrivateCalendarKey, publicKey: primaryPublicCalendarKey } =
        newCalendarKeys.find(({ Key: { Flags } }) => hasBit(Flags, KeyFlags.PRIMARY)) || {};
    if (!primaryPrivateCalendarKey || !primaryPublicCalendarKey) {
        throw new Error(c('Error').t`Calendar primary private key is not decrypted`);
    }

    const decryptionKeys = oldCalendarKeys || newCalendarKeys;

    const [sharedSessionKey, calendarSessionKey] = Event
        ? await readSessionKeys(Event, splitKeys(decryptionKeys).privateKeys)
        : [];

    return {
        privateKey: primaryPrivateCalendarKey,
        publicKey: primaryPublicCalendarKey,
        signingKey: primaryPrivateAddressKey,
        sharedSessionKey,
        calendarSessionKey,
    };
};

export default getCreationKeys;
