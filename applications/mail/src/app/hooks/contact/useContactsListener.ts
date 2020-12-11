import { useEffect } from 'react';
import { OpenPGPKey } from 'pmcrypto';
import { useEventManager, useUserKeys, useCache } from 'react-components';
import { Cache } from 'proton-shared/lib/helpers/cache';
import { CONTACT_CARD_TYPE } from 'proton-shared/lib/constants';
import { readSigned } from 'proton-shared/lib/contacts/decrypt';
import { parse } from 'proton-shared/lib/contacts/vcard';
import { Contact } from 'proton-shared/lib/interfaces/contacts';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { CACHE_KEY } from 'react-components/hooks/useGetEncryptionPreferences';
import { normalizeEmail } from 'proton-shared/lib/helpers/email';
import { MessageCache, updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { Event } from '../../models/event';

/**
 * Deal with contact update from the event manager
 * Will read the updated contact to invalidate some cached related data
 *
 * @param contact Contact data update from the event manager
 * @param publicKeys Public keys of the current user
 * @param globalCache Proton main cache
 * @param messageCache Message cache
 */
const processContactUpdate = async (
    contact: Contact,
    publicKeys: OpenPGPKey[],
    globalCache: Cache<string, any>,
    messageCache: MessageCache
) => {
    const signedCard = contact.Cards.find(({ Type }) => Type === CONTACT_CARD_TYPE.SIGNED);
    if (!signedCard) {
        return;
    }
    const { data: signedVcard } = await readSigned(signedCard, { publicKeys });
    const properties = parse(signedVcard);
    const emailProperties = properties.filter(({ field, group }) => field === 'email' && group !== undefined);
    const emails = emailProperties.map((property) => normalizeEmail(property.value as string));

    // Looking in the EncryptionPreference cache
    const encryptionPreferenceCache = globalCache.get(CACHE_KEY) as Map<string, any>;
    emails.forEach((email) => {
        encryptionPreferenceCache.delete(email);
    });

    // Looking in the Message cache to check if there is message signed from one of the contact addresses
    messageCache.forEach((message, localID) => {
        if (message.signingPublicKey && emails.includes(message.data?.Sender.Address || '')) {
            updateMessageCache(messageCache, localID, {
                senderPinnedKeys: undefined,
                signingPublicKey: undefined,
                attachedPublicKeys: undefined,
                senderVerified: undefined,
                verificationStatus: undefined,
                verificationErrors: undefined,
            });
        }
    });
};

export const useContactsListener = () => {
    const globalCache = useCache();
    const messageCache = useMessageCache();
    const { subscribe } = useEventManager();
    const [userKeys = []] = useUserKeys();

    const { publicKeys } = splitKeys(userKeys);

    useEffect(
        () =>
            subscribe(({ Contacts = [] }: Event) => {
                for (const { Contact } of Contacts) {
                    void processContactUpdate(Contact, publicKeys, globalCache, messageCache);
                }
            }),
        [publicKeys]
    );
};
