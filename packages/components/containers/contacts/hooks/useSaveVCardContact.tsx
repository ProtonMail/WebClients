import { useCallback } from 'react';

import { c } from 'ttag';

import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { addContacts, updateContact } from '@proton/shared/lib/api/contacts';
import { API_CODES } from '@proton/shared/lib/constants';
import { CATEGORIES, OVERWRITE } from '@proton/shared/lib/contacts/constants';
import { prepareVCardContacts } from '@proton/shared/lib/contacts/encrypt';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { ContactMetadata } from '@proton/shared/lib/interfaces/contacts/Contact';
import type {
    AddContactsApiResponses,
    UpdateContactApiResponse,
} from '@proton/shared/lib/interfaces/contacts/ContactApi';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

const { THROW_ERROR_IF_CONFLICT } = OVERWRITE;
const { INCLUDE, IGNORE } = CATEGORIES;
const { SINGLE_SUCCESS } = API_CODES;

/**
 * A create is one entry in a batch response, so its failure arrives as a code on a 200 rather than as a
 * rejected request. Carrying the code is what lets a caller tell an address already on another contact
 * (`API_CUSTOM_ERROR_CODES.ALREADY_EXISTS`, the conflict `THROW_ERROR_IF_CONFLICT` asks for) from a
 * generic failure.
 */
export class SaveVCardContactError extends Error {
    constructor(public readonly code: number | null) {
        super('Contact could not be saved');
        this.name = 'SaveVCardContactError';
    }
}

const handleContactRequest = async (
    api: Api,
    contactID: string | undefined,
    vCardContact: VCardContact,
    userKeysList: DecryptedKey[]
): Promise<{ Code: number | null; Contact?: ContactMetadata }> => {
    const Contacts = await prepareVCardContacts([vCardContact], userKeysList[0]);

    if (contactID) {
        const { Code, Contact } = await api<UpdateContactApiResponse>(
            updateContact(contactID, { Cards: Contacts[0].Cards })
        );
        return { Code, Contact };
    } else {
        const labels = vCardContact.categories?.length ? INCLUDE : IGNORE;
        const {
            Responses: [{ Response: { Code = null, Contact } = {} }],
        } = await api<AddContactsApiResponses>(
            addContacts({
                Contacts,
                Overwrite: THROW_ERROR_IF_CONFLICT,
                Labels: labels,
            })
        );
        return { Code, Contact };
    }
};

export const useSaveVCardContact = () => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const getUserKeys = useGetUserKeys();

    const saveVCardContact = useCallback(
        async (contactID: string | undefined, vCardContact: VCardContact) => {
            const userKeysList = await getUserKeys();
            const { Code, Contact } = await handleContactRequest(api, contactID, vCardContact, userKeysList);
            if (Code !== SINGLE_SUCCESS) {
                const text =
                    Code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS
                        ? c('Error').t`A contact with this email address already exists`
                        : c('Error').t`Contact could not be saved`;
                createNotification({ text, type: 'error' });
                throw new SaveVCardContactError(Code);
            }

            return Contact;
        },
        [api]
    );

    return saveVCardContact;
};
