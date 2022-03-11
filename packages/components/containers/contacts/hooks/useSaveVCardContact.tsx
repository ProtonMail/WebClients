import { useCallback } from 'react';
import { c } from 'ttag';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import { prepareVCardContacts } from '@proton/shared/lib/contacts/encrypt';
import { CATEGORIES, OVERWRITE } from '@proton/shared/lib/contacts/constants';
import { API_CODES } from '@proton/shared/lib/constants';
import { addContacts } from '@proton/shared/lib/api/contacts';
import { AddContactsApiResponses } from '@proton/shared/lib/interfaces/contacts/ContactApi';
import { useApi, useNotifications, useUserKeys } from '../../../hooks';

const { OVERWRITE_CONTACT, THROW_ERROR_IF_CONFLICT } = OVERWRITE;
const { INCLUDE, IGNORE } = CATEGORIES;
const { SINGLE_SUCCESS } = API_CODES;

export const useSaveVCardContact = () => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [userKeysList, loadingUserKeys] = useUserKeys();

    const saveVCardContact = useCallback(
        async (contactID: string | undefined, vCardContact: VCardContact) => {
            const Contacts = await prepareVCardContacts([vCardContact], userKeysList[0]);
            const labels = vCardContact.categories?.length ? INCLUDE : IGNORE;
            const {
                Responses: [{ Response: { Code = null } = {} }],
            } = await api<AddContactsApiResponses>(
                addContacts({
                    Contacts,
                    Overwrite: contactID ? OVERWRITE_CONTACT : THROW_ERROR_IF_CONFLICT,
                    Labels: labels,
                })
            );

            if (Code !== SINGLE_SUCCESS) {
                createNotification({ text: c('Error').t`Contact could not be saved`, type: 'error' });
                throw new Error('Contact could not be saved');
            }
        },
        [api, userKeysList, loadingUserKeys]
    );

    return saveVCardContact;
};
