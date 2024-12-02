import type { PublicKeyReference } from '@proton/crypto';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { GetVerificationPreferences } from '@proton/shared/lib/interfaces/hooks/GetVerificationPreferences';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';

import { canonicalizeInternalEmail } from '../helpers/email';
import type { ActiveKeyWithVersion, Address } from '../interfaces';
import type { CalendarEvent, CalendarEventData } from '../interfaces/calendar';
import type { GetAddressKeys } from '../interfaces/hooks/GetAddressKeys';
import type { SimpleMap } from '../interfaces/utils';
import { getKeyHasFlagsToVerify } from '../keys';
import { getActiveKeys } from '../keys/getActiveKeys';
import { CALENDAR_CARD_TYPE } from './constants';

const { SIGNED, ENCRYPTED_AND_SIGNED } = CALENDAR_CARD_TYPE;

export const withNormalizedAuthor = (x: CalendarEventData) => ({
    ...x,
    Author: canonicalizeInternalEmail(x.Author),
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
    getVerificationPreferences: GetVerificationPreferences;
    contactEmailsMap: SimpleMap<ContactEmail>;
}

export const getAuthorPublicKeysMap = async ({
    event,
    addresses,
    getAddressKeys,
    getVerificationPreferences,
    contactEmailsMap,
}: GetAuthorPublicKeysMap) => {
    const publicKeysMap: SimpleMap<PublicKeyReference | PublicKeyReference[]> = {};
    const authors = unique(
        [...event.SharedEvents, ...event.CalendarEvents]
            .map(({ Author, Type }) => {
                if (![SIGNED, ENCRYPTED_AND_SIGNED].includes(Type)) {
                    // no need to fetch keys in this case
                    return;
                }
                return canonicalizeInternalEmail(Author);
            })
            .filter(isTruthy)
    );
    const normalizedAddresses = addresses.map((address) => ({
        ...address,
        normalizedEmailAddress: canonicalizeInternalEmail(address.Email),
    }));
    const promises = authors.map(async (author) => {
        const ownAddress = normalizedAddresses.find(({ normalizedEmailAddress }) => normalizedEmailAddress === author);
        if (ownAddress) {
            const decryptedKeys = await getAddressKeys(ownAddress.ID);
            const addressKeys = await getActiveKeys(
                ownAddress,
                ownAddress.SignedKeyList,
                ownAddress.Keys,
                decryptedKeys
            );
            const filterVerificationKeys = <V extends ActiveKeyWithVersion>(decryptedKey: V) => getKeyHasFlagsToVerify(decryptedKey.flags);

            const verificationKeys = {
                v4: addressKeys.v4.filter(filterVerificationKeys).map((key) => key.publicKey),
                v6: addressKeys.v6.filter(filterVerificationKeys).map((key) => key.publicKey)
            }
            publicKeysMap[author] = [...verificationKeys.v4, ...verificationKeys.v6]
        } else {
            try {
                const { verifyingKeys } = await getVerificationPreferences({ email: author, contactEmailsMap });
                publicKeysMap[author] = verifyingKeys;
            } catch (error: any) {
                // We're seeing too many unexpected offline errors in the GET /keys route.
                // We log them to Sentry and ignore them here (no verification will take place in these cases)
                const { ID, CalendarID } = event;
                const errorMessage = error?.message || 'Unknown error';
                captureMessage('Unexpected error verifying event signature', {
                    extra: { message: errorMessage, eventID: ID, calendarID: CalendarID },
                });
            }
        }
    });
    await Promise.all(promises);

    return publicKeysMap;
};
