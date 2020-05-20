import { c } from 'ttag';
import getPrimaryKey from 'proton-shared/lib/keys/getPrimaryKey';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { KeyFlags } from 'proton-shared/lib/keys/calendarKeys';
import { readSessionKeys } from 'proton-shared/lib/calendar/deserialize';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { CachedKey } from 'proton-shared/lib/interfaces';

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

    const { privateKey: primaryPrivateCalendarKey, publicKey: publicCalendarKey } =
        newCalendarKeys.find(({ Key: { Flags } }) => hasBit(Flags, KeyFlags.PRIMARY)) || {};
    if (!primaryPrivateCalendarKey) {
        throw new Error(c('Error').t`Calendar primary private key is not decrypted`);
    }

    const decryptionKeys = oldCalendarKeys || newCalendarKeys;

    const [sharedSessionKey, calendarSessionKey] = Event
        ? await readSessionKeys(Event, splitKeys(decryptionKeys).privateKeys)
        : [];

    return {
        privateKey: primaryPrivateCalendarKey,
        publicKey: publicCalendarKey,
        signingKey: primaryPrivateAddressKey,
        sharedSessionKey,
        calendarSessionKey,
    };
};

export default getCreationKeys;
