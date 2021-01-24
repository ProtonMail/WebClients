import React from 'react';

import { ContactProperties, ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts/Contact';
import { DecryptedKey } from 'proton-shared/lib/interfaces';
import { CryptoProcessingError } from 'proton-shared/lib/contacts/decrypt';
import { singleExport } from 'proton-shared/lib/contacts/export';

import { useModals, useActiveBreakpoint } from '../../hooks';
import ContactSummary from '../../components/contacts/ContactSummary';
import ContactViewProperties from '../../components/contacts/ContactViewProperties';
import { classnames } from '../../helpers';

import ContactViewErrors from './ContactViewErrors';
import ContactModal from './modals/ContactModal';
import ContactDeleteModal from './modals/ContactDeleteModal';

interface Props {
    contactID: string;
    contactEmails: ContactEmail[];
    contactGroupsMap: { [contactGroupID: string]: ContactGroup };
    ownAddresses: string[];
    properties: ContactProperties;
    userKeysList: DecryptedKey[];
    errors?: CryptoProcessingError[];
    isModal: boolean;
    onDelete: () => void;
    isPreview?: boolean;
}

const ContactView = ({
    properties = [],
    contactID,
    contactEmails,
    contactGroupsMap,
    ownAddresses,
    userKeysList,
    errors,
    isModal,
    onDelete,
    isPreview = false,
}: Props) => {
    const { createModal } = useModals();
    const { isNarrow } = useActiveBreakpoint();

    const handleDelete = () => {
        createModal(<ContactDeleteModal contactIDs={[contactID]} onDelete={onDelete} />);
    };

    const handleEdit = (field?: string) => {
        createModal(<ContactModal properties={properties} contactID={contactID} newField={field} />);
    };

    const handleExport = () => singleExport(properties);

    const contactViewPropertiesProps = {
        contactID,
        userKeysList,
        contactEmails,
        ownAddresses,
        properties,
        contactGroupsMap,
        leftBlockWidth: 'w100 mw100p',
        rightBlockWidth: 'w100',
    };

    return (
        <div className={classnames([!isModal && 'view-column-detail flex-item-fluid scroll-if-needed'])}>
            <ContactViewErrors errors={errors} />
            <ContactSummary
                handleExport={handleExport}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                properties={properties}
                leftBlockWidth={isNarrow ? 'mauto mw100p' : 'w100 mw100p'}
                isPreview={isPreview}
            />
            <div className="pl1 pr1">
                <ContactViewProperties field="fn" {...contactViewPropertiesProps} />
                <ContactViewProperties field="email" {...contactViewPropertiesProps} isPreview={isPreview} />
                <ContactViewProperties field="tel" {...contactViewPropertiesProps} isPreview={isPreview} />
                <ContactViewProperties field="adr" {...contactViewPropertiesProps} isPreview={isPreview} />
                <ContactViewProperties {...contactViewPropertiesProps} />
            </div>
        </div>
    );
};

export default ContactView;
