import React from 'react';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { Contact, ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
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

const ContactContainer = ({
    contactID,
    contactEmails,
    contactGroupsMap,
    ownAddresses,
    userKeysList = [],
    isModal = false,
    onDelete,
}: Props) => {
    const [contact, contactLoading] = useContact(contactID) as [Contact, boolean, Error];
    const [{ properties, errors, ID }, onReload] = useContactProperties({ contact, userKeysList });

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
            onReload={onReload}
        />
    );
};

export default ContactContainer;
