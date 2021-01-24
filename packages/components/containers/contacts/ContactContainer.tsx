import React from 'react';

import { DecryptedKey } from 'proton-shared/lib/interfaces';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts/Contact';

import useContact from './useContact';
import ContactView from './ContactView';
import useContactProperties from './useContactProperties';
import Loader from '../../components/loader/Loader';

interface Props {
    contactID: string;
    contactEmails: ContactEmail[];
    contactGroupsMap: { [contactGroupID: string]: ContactGroup };
    userKeysList: DecryptedKey[];
    ownAddresses: string[];
    isModal?: boolean;
    onDelete: () => void;
}

const Contact = ({
    contactID,
    contactEmails,
    contactGroupsMap,
    ownAddresses,
    userKeysList = [],
    isModal = false,
    onDelete,
}: Props) => {
    const [contact, contactLoading] = useContact(contactID);
    const { properties, errors, ID } = useContactProperties({ contact, userKeysList });

    if (contactLoading || !properties || ID !== contactID) {
        return <Loader />;
    }

    return (
        <ContactView
            properties={properties}
            contactID={contactID}
            contactEmails={contactEmails}
            contactGroupsMap={contactGroupsMap}
            ownAddresses={ownAddresses}
            userKeysList={userKeysList}
            errors={errors}
            isModal={isModal}
            onDelete={onDelete}
        />
    );
};

export default Contact;
