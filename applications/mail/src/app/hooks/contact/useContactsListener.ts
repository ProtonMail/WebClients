import { useEffect } from 'react';

import { useUserKeys } from '@proton/account/userKeys/hooks';
import { useEventManager } from '@proton/components';
import type { PublicKeyReference } from '@proton/crypto';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import { useContactGroups } from '@proton/mail/store/labels/hooks';
import { removeEmailsFromEncryptionPreferencesCache } from '@proton/mail/store/messages/encryptionPreferences';
import { CONTACT_CARD_TYPE } from '@proton/shared/lib/constants';
import { readSigned } from '@proton/shared/lib/contacts/decrypt';
import { parseToVCard } from '@proton/shared/lib/contacts/vcard';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Contact } from '@proton/shared/lib/interfaces/contacts';
import { splitKeys } from '@proton/shared/lib/keys/keys';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { refresh } from '../../store/contacts/contactsActions';
import { resetVerification } from '../../store/messages/read/messagesReadActions';

/**
 * Deal with contact update from the event manager
 * Will read the updated contact to invalidate some cached related data
 *
 * @param contact Contact data update from the event manager
 * @param publicKeys Public keys of the current user
 * @param onResetMessageForEmails
 */
const processContactUpdate = async (
    contact: Partial<Contact> | undefined,
    publicKeys: PublicKeyReference[],
    onResetMessageForEmails: (emails: string[]) => void
) => {
    const signedCard = contact?.Cards?.find(({ Type }) => Type === CONTACT_CARD_TYPE.SIGNED);
    if (!signedCard) {
        return;
    }
    const { data: signedVcard } = await readSigned(signedCard, { publicKeys });
    const vCardContact = parseToVCard(signedVcard);
    const emails = (vCardContact.email || []).map((property) => canonicalizeEmail(property.value));

    // Looking in the EncryptionPreference cache
    removeEmailsFromEncryptionPreferencesCache(emails);

    // Looking in the Message cache to check if there is message signed from one of the contact addresses
    onResetMessageForEmails(emails);
};

export const useContactsListener = () => {
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
        const unsubscribe = subscribe(({ Contacts = [] }) => {
            for (const contactEvent of Contacts) {
                const contact = 'Contact' in contactEvent ? contactEvent.Contact : undefined;
                void processContactUpdate(contact, publicKeys, handleResetMessageForEmails);
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-B10D89
    }, [publicKeys]);

    useEffect(() => {
        dispatch(refresh({ contacts, contactGroups }));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-DA6FE0
    }, [contacts, contactGroups]);
};
