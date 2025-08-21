import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useUserKeys } from '@proton/account/userKeys/hooks';
import type { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';
import type { ContactGroupEditProps } from '@proton/components/containers/contacts/group/ContactGroupEditModal';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { PrivateKeyReference } from '@proton/crypto';
import { CONTACT_SEARCH_PARAMS, isContactSearchParams } from '@proton/mail/hooks/autoOpenContacts/helper';
import { useGetContact } from '@proton/mail/store/contacts/contactHooks';
import { APPS } from '@proton/shared/lib/constants';
import { prepareVCardContact } from '@proton/shared/lib/contacts/decrypt';
import { getSearchParams } from '@proton/shared/lib/helpers/url';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import { splitKeys } from '@proton/shared/lib/keys';

interface Props {
    onEdit: (props: ContactEditProps) => void;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onSelectGroupTab: () => void;
}

/**
 * This hook allows ET app to open the contact drawer on the mail app using a deeplink
 */
const useContactsDrawerFromURL = ({ onEdit, onGroupEdit, onSelectGroupTab }: Props) => {
    const { APP_NAME } = useConfig();
    const history = useHistory();
    const location = useLocation();
    const [userKeysList] = useUserKeys();
    const getContact = useGetContact();
    const { createNotification } = useNotifications();

    const handleEditContact = async (contactID: string, userKeysList: DecryptedKey<PrivateKeyReference>[]) => {
        // To edit a contact we first need to get the contact vCard
        const contact = await getContact(contactID);
        const { publicKeys, privateKeys } = splitKeys(userKeysList);

        const { vCardContact, errors } = await prepareVCardContact(contact, {
            publicKeys,
            privateKeys,
        });

        if (errors.length > 0) {
            createNotification({ type: 'error', text: c('Error').t`Failed to open to contact` });
            return;
        }

        onEdit({ contactID: contactID, vCardContact });
    };

    useEffect(() => {
        if (APP_NAME !== APPS.PROTONMAIL || !isContactSearchParams(location) || !userKeysList) {
            return;
        }

        const params = getSearchParams(location.hash);

        const contactCreateMatch = CONTACT_SEARCH_PARAMS.CREATE_CONTACT in params;
        const contactEditMatch = CONTACT_SEARCH_PARAMS.EDIT_CONTACT in params;
        const contactGroupCreateMatch = CONTACT_SEARCH_PARAMS.CREATE_CONTACT_GROUP in params;
        const contactGroupEditMatch = CONTACT_SEARCH_PARAMS.EDIT_CONTACT_GROUP in params;

        // Check for group-related routes first to set the correct tab
        if (contactGroupCreateMatch || contactGroupEditMatch) {
            onSelectGroupTab();
        }

        if (contactCreateMatch) {
            onEdit({});
        } else if (contactGroupCreateMatch) {
            onGroupEdit({});
        } else if (contactEditMatch && params[CONTACT_SEARCH_PARAMS.EDIT_CONTACT]) {
            void handleEditContact(params[CONTACT_SEARCH_PARAMS.EDIT_CONTACT], userKeysList);
        } else if (contactGroupEditMatch && params[CONTACT_SEARCH_PARAMS.EDIT_CONTACT_GROUP]) {
            onGroupEdit({ contactGroupID: params[CONTACT_SEARCH_PARAMS.EDIT_CONTACT_GROUP] });
        }

        // remove hash params so that closing the modal will not trigger a modal reopen
        history.replace({ pathname: location.pathname, search: location.search });
    }, [location.hash, handleEditContact, userKeysList, APP_NAME]);
};

export default useContactsDrawerFromURL;
