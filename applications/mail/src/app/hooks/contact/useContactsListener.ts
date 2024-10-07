import { useEffect } from 'react';

import { useCache, useContactEmails, useEventManager, useUserKeys } from '@proton/components';
import { CACHE_KEY } from '@proton/components/hooks/useGetEncryptionPreferences';
import type { PublicKeyReference } from '@proton/crypto';
import { useContactGroups } from '@proton/mail';
import { CONTACT_CARD_TYPE } from '@proton/shared/lib/constants';
import { readSigned } from '@proton/shared/lib/contacts/decrypt';
import { parseToVCard } from '@proton/shared/lib/contacts/vcard';
import type { Cache } from '@proton/shared/lib/helpers/cache';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Contact } from '@proton/shared/lib/interfaces/contacts';
import { splitKeys } from '@proton/shared/lib/keys/keys';

import { useMailDispatch } from 'proton-mail/store/hooks';

import type { Event } from '../../models/event';
import { refresh } from '../../store/contacts/contactsActions';
import { resetVerification } from '../../store/messages/read/messagesReadActions';

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
    const emails = (vCardContact.email || []).map((property) => canonicalizeEmail(property.value));

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
    const dispatch = useMailDispatch();
    const { subscribe } = useEventManager();
    const [userKeys = []] = useUserKeys();
    const [contacts = []] = useContactEmails();
    const [contactGroups = []] = useContactGroups();

    const { publicKeys } = splitKeys(userKeys);

    const handleResetMessageForEmails = (emails: string[]) => {
        dispatch(resetVerification(emails));
    };

    useEffect(() => {
        const unsubscribe = subscribe(({ Contacts = [] }: Event) => {
            for (const { Contact } of Contacts) {
                void processContactUpdate(Contact, publicKeys, globalCache, handleResetMessageForEmails);
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [publicKeys]);

    useEffect(() => {
        dispatch(refresh({ contacts, contactGroups }));
    }, [contacts, contactGroups]);
};
