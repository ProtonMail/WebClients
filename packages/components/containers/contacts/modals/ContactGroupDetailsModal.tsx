import React from 'react';
import { c, msgid } from 'ttag';

import { ContactEmail } from 'proton-shared/lib/interfaces/contacts/Contact';
import { noop } from 'proton-shared/lib/helpers/function';

import { FormModal, ContactGroupTable, Icon, TitleModal } from '../../../components';
import { useContactEmails, useContactGroups } from '../../../hooks';

import './ContactGroupDetailsModal.scss';

interface Props {
    contactGroupID: string;
    onClose?: () => void;
    onEdit: () => void;
}

const ContactGroupDetailsModal = ({ contactGroupID, onClose = noop, onEdit, ...rest }: Props) => {
    const [contactGroups = [], loadingGroups] = useContactGroups();
    const [contactEmails = [], loadingEmails] = useContactEmails() as [ContactEmail[] | undefined, boolean, any];

    const group = contactGroups.find(({ ID }) => ID === contactGroupID);
    const emails = contactEmails.filter(({ LabelIDs = [] }: { LabelIDs: string[] }) =>
        LabelIDs.includes(contactGroupID)
    );
    const emailsCount = emails.length;

    const handleEdit = () => {
        onEdit();
        onClose();
    };

    return (
        <FormModal
            onSubmit={handleEdit}
            loading={loadingGroups || loadingEmails}
            close={c('Action').t`Close`}
            submit={c('Action').t`Edit`}
            modalTitleID="contact-group-details-modal"
            title={
                <TitleModal id="contact-group-details-modal" className="flex flex-row flex-align-items-center">
                    <div
                        className="contact-group-details-chip rounded50 mr0-5"
                        style={{ backgroundColor: group?.Color }}
                    />
                    {group?.Name}
                </TitleModal>
            }
            onClose={onClose}
            {...rest}
        >
            <h4 className="mb1 flex flex-align-items-center">
                <Icon className="mr0-5" name="contacts-groups" />
                <span>{c('Title').ngettext(msgid`${emailsCount} member`, `${emailsCount} members`, emailsCount)}</span>
            </h4>
            <ContactGroupTable contactEmails={emails} />
        </FormModal>
    );
};

export default ContactGroupDetailsModal;
