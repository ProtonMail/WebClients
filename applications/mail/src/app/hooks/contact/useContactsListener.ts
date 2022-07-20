import { useEffect } from 'react';
import { PublicKeyReference } from '@proton/crypto';
import { canonizeEmail } from '@proton/shared/lib/helpers/email';
import { useDispatch } from 'react-redux';
import { useEventManager, useUserKeys, useCache, useContactEmails, useContactGroups } from '@proton/components';
import { Cache } from '@proton/shared/lib/helpers/cache';
import { CONTACT_CARD_TYPE } from '@proton/shared/lib/constants';
import { readSigned } from '@proton/shared/lib/contacts/decrypt';
import { parseToVCard } from '@proton/shared/lib/contacts/vcard';
import { Contact, ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { CACHE_KEY } from '@proton/components/hooks/useGetEncryptionPreferences';
import { Event } from '../../models/event';
import { resetVerification } from '../../logic/messages/read/messagesReadActions';
import { refresh } from '../../logic/contacts/contactsActions';

/**
 * Deal with contact update from the event manager
 * Will read the updated contact to invalidate some cached related data
 *
 * @param contact Contact data update from the event manager
 * @param publicKeys Public keys of the current user
 * @param globalCache Proton main cache
 * @param onResetMessageForEmails
 */
const processContactUpdate = async (
    contact: Contact | undefined,
    publicKeys: PublicKeyReference[],
    globalCache: Cache<string, any>,
    onResetMessageForEmails: (emails: string[]) => void
) => {
    const signedCard = contact?.Cards.find(({ Type }) => Type === CONTACT_CARD_TYPE.SIGNED);
    if (!signedCard) {
        return;
    }
    const { data: signedVcard } = await readSigned(signedCard, { publicKeys });
    const vCardContact = parseToVCard(signedVcard);
    const emails = (vCardContact.email || []).map((property) => canonizeEmail(property.value));

    // Looking in the EncryptionPreference cache
    const encryptionPreferenceCache = globalCache.get(CACHE_KEY) as Map<string, any>;

    emails.forEach((email) => {
        if (encryptionPreferenceCache) {
            encryptionPreferenceCache.delete(email);
        }
    });

    // Looking in the Message cache to check if there is message signed from one of the contact addresses
    onResetMessageForEmails(emails);
};

export const useContactsListener = () => {
    const globalCache = useCache();
    const dispatch = useDispatch();
    const { subscribe } = useEventManager();
    const [userKeys = []] = useUserKeys();
    const [contacts = []] = useContactEmails() as [ContactEmail[], boolean, Error];
    const [contactGroups = []] = useContactGroups();

    const { publicKeys } = splitKeys(userKeys);

    const handleResetMessageForEmails = (emails: string[]) => {
        dispatch(resetVerification(emails));
    };

    useEffect(
        () =>
            subscribe(({ Contacts = [] }: Event) => {
                for (const { Contact } of Contacts) {
                    void processContactUpdate(Contact, publicKeys, globalCache, handleResetMessageForEmails);
                }
            }),
        [publicKeys]
    );

    useEffect(() => {
        dispatch(refresh({ contacts, contactGroups }));
    }, [contacts, contactGroups]);
};
