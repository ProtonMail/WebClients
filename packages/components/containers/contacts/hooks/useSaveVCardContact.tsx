import { useCallback } from 'react';

import { c } from 'ttag';

import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { addContacts, updateContact } from '@proton/shared/lib/api/contacts';
import { API_CODES } from '@proton/shared/lib/constants';
import { CATEGORIES, OVERWRITE } from '@proton/shared/lib/contacts/constants';
import { prepareVCardContacts } from '@proton/shared/lib/contacts/encrypt';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type {
    AddContactsApiResponses,
    UpdateContactApiResponse,
} from '@proton/shared/lib/interfaces/contacts/ContactApi';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

const { THROW_ERROR_IF_CONFLICT } = OVERWRITE;
const { INCLUDE, IGNORE } = CATEGORIES;
const { SINGLE_SUCCESS } = API_CODES;

const handleContactRequest = async (
    api: Api,
    contactID: string | undefined,
    vCardContact: VCardContact,
    userKeysList: DecryptedKey[]
) => {
    const Contacts = await prepareVCardContacts([vCardContact], userKeysList[0]);

    if (contactID) {
        const { Code } = await api<UpdateContactApiResponse>(updateContact(contactID, { Cards: Contacts[0].Cards }));
        return Code;
    } else {
        const labels = vCardContact.categories?.length ? INCLUDE : IGNORE;
        const {
            Responses: [{ Response: { Code = null } = {} }],
        } = await api<AddContactsApiResponses>(
            addContacts({
                Contacts,
                Overwrite: THROW_ERROR_IF_CONFLICT,
                Labels: labels,
            })
        );
        return Code;
    }
};

export const useSaveVCardContact = () => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const getUserKeys = useGetUserKeys();

    const saveVCardContact = useCallback(
        async (contactID: string | undefined, vCardContact: VCardContact) => {
            const userKeysList = await getUserKeys();
            const code = await handleContactRequest(api, contactID, vCardContact, userKeysList);
            if (code !== SINGLE_SUCCESS) {
                createNotification({ text: c('Error').t`Contact could not be saved`, type: 'error' });
                throw new Error('Contact could not be saved');
            }
        },
        [api]
    );

    return saveVCardContact;
};
