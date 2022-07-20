import { PublicKeyReference } from '@proton/crypto';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';
import { canonizeInternalEmail } from '../helpers/email';
import { Address } from '../interfaces';
import { CalendarEvent, CalendarEventData } from '../interfaces/calendar';
import { GetAddressKeys } from '../interfaces/hooks/GetAddressKeys';
import { GetEncryptionPreferences } from '../interfaces/hooks/GetEncryptionPreferences';
import { SimpleMap } from '../interfaces/utils';
import { getKeyHasFlagsToVerify } from '../keys';
import { getActiveKeys } from '../keys/getActiveKeys';
import { CALENDAR_CARD_TYPE } from './constants';

const { SIGNED, ENCRYPTED_AND_SIGNED } = CALENDAR_CARD_TYPE;

export const withNormalizedAuthor = (x: CalendarEventData) => ({
    ...x,
    Author: canonizeInternalEmail(x.Author),
});
export const withNormalizedAuthors = (x: CalendarEventData[]) => {
    if (!x) {
        return [];
    }
    return x.map(withNormalizedAuthor);
};

interface GetAuthorPublicKeysMap {
    event: CalendarEvent;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    getEncryptionPreferences: GetEncryptionPreferences;
}

export const getAuthorPublicKeysMap = async ({
    event,
    addresses,
    getAddressKeys,
    getEncryptionPreferences,
}: GetAuthorPublicKeysMap) => {
    const publicKeysMap: SimpleMap<PublicKeyReference | PublicKeyReference[]> = {};
    const authors = unique(
        [...event.SharedEvents, ...event.CalendarEvents]
            .map(({ Author, Type }) => {
                if (![SIGNED, ENCRYPTED_AND_SIGNED].includes(Type)) {
                    // no need to fetch keys in this case
                    return;
                }
                return canonizeInternalEmail(Author);
            })
            .filter(isTruthy)
    );
    const normalizedAddresses = addresses.map((address) => ({
        ...address,
        normalizedEmailAddress: canonizeInternalEmail(address.Email),
    }));
    const promises = authors.map(async (author) => {
        const ownAddress = normalizedAddresses.find(({ normalizedEmailAddress }) => normalizedEmailAddress === author);
        if (ownAddress) {
            const decryptedKeys = await getAddressKeys(ownAddress.ID);
            const addressKeys = await getActiveKeys(ownAddress.SignedKeyList, ownAddress.Keys, decryptedKeys);
            publicKeysMap[author] = addressKeys
                .filter((decryptedKey) => {
                    return getKeyHasFlagsToVerify(decryptedKey.flags);
                })
                .map((key) => key.publicKey);
        } else {
            const { pinnedKeys } = await getEncryptionPreferences(author);
            publicKeysMap[author] = pinnedKeys;
        }
    });
    await Promise.all(promises);

    return publicKeysMap;
};
